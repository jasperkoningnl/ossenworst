import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { findIrrelevantTopicIds, type TopicForReview } from "@/lib/claude/cleanup";

export const maxDuration = 300;

const BATCH_SIZE = 40;
// PostgREST zet .in()-filters in de URL; te veel uuid's tegelijk geeft een
// (onduidelijke) URL-lengte-fout. Daarom in stukken werken.
const ID_CHUNK_SIZE = 50;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Ruimt topics op die geen Ajax-connectie hebben (aangemaakt toen het
 * relevantiefilter nog te ruim stond). Claude beoordeelt alle topics in
 * batches; afgekeurde topics worden verwijderd en hun raw_items op
 * "skipped" gezet zodat ze niet opnieuw de pipeline in gaan.
 *
 *   curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \
 *     https://ossenworst.vercel.app/api/admin/cleanup-topics
 */
export async function POST(request: Request) {
  const expected = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    return await cleanupTopics();
  } catch (err) {
    // Altijd JSON met de echte foutmelding teruggeven, zodat de workflow-log
    // laat zien wát er misging i.p.v. alleen een curl exit code.
    console.error("cleanup-topics faalde:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

async function cleanupTopics() {
  const supabase = createServiceClient();

  const { data: topics, error } = await supabase
    .from("topics")
    .select("id, title, summary")
    .order("last_activity_at", { ascending: false })
    .limit(1000);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const allTopics = (topics ?? []) as TopicForReview[];
  const irrelevantIds: string[] = [];
  let reviewErrors = 0;
  const reviewErrorMessages = new Set<string>();
  for (const batch of chunk(allTopics, BATCH_SIZE)) {
    try {
      irrelevantIds.push(...(await findIrrelevantTopicIds(batch)));
    } catch (err) {
      // Eén mislukte Claude-call mag de hele opruimronde niet laten klappen;
      // de overgeslagen batch komt bij een volgende run vanzelf weer langs.
      // De (gededupliceerde) foutmeldingen gaan mee in de response, zodat een
      // structureel probleem zichtbaar is zonder Vercel-logs.
      reviewErrors++;
      if (reviewErrorMessages.size < 3) reviewErrorMessages.add((err as Error).message);
      console.error("Topic-reviewbatch mislukt, ga door met de rest:", err);
    }
  }

  if (irrelevantIds.length === 0) {
    return NextResponse.json({
      checked: allTopics.length,
      removed: 0,
      removedTitles: [],
      reviewErrors,
      reviewErrorMessages: [...reviewErrorMessages],
    });
  }

  // raw_items op skipped vóór het verwijderen (delete zet topic_id op null,
  // daarna zijn ze niet meer terug te vinden) zodat ze niet opnieuw
  // verwerkt worden.
  for (const ids of chunk(irrelevantIds, ID_CHUNK_SIZE)) {
    const { error: skipError } = await supabase
      .from("raw_items")
      .update({ processing_status: "skipped" })
      .in("topic_id", ids);
    if (skipError) {
      return NextResponse.json({ error: skipError.message }, { status: 500 });
    }
  }

  // Openstaande summarize-jobs voor deze topics zouden na de delete alleen
  // nog maar kunnen falen — opruimen.
  for (const topicId of irrelevantIds) {
    await supabase
      .from("jobs")
      .delete()
      .eq("type", "summarize")
      .eq("status", "queued")
      .contains("payload", { topicId });
  }

  const removedTitles: string[] = [];
  for (const ids of chunk(irrelevantIds, ID_CHUNK_SIZE)) {
    const { data: removed, error: deleteError } = await supabase
      .from("topics")
      .delete()
      .in("id", ids)
      .select("title");
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    removedTitles.push(...(removed ?? []).map((t) => t.title));
  }

  return NextResponse.json({
    checked: allTopics.length,
    removed: removedTitles.length,
    removedTitles,
    reviewErrors,
    reviewErrorMessages: [...reviewErrorMessages],
  });
}
