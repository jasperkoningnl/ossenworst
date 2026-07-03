import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { reviewTopics, type TopicForReview } from "@/lib/claude/cleanup";
import { mergeDuplicateTopics } from "@/lib/pipeline/merge-topics";

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
 * Onderhoud op de bestaande topiclijst, in drie stappen per reviewbatch:
 * 1. Topics zonder Ajax-connectie of zonder actualiteit verwijderen.
 * 2. Duplicaat-topics (zelfde verhaal) samenvoegen tot één topic.
 * 3. Topics waarvan de inhoud officieel bevestigd is op BEVESTIGD zetten.
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
  const duplicateGroups: string[][] = [];
  const confirmedIds: string[] = [];
  let reviewErrors = 0;
  const reviewErrorMessages = new Set<string>();

  // Batches op volgorde van activiteit: duplicaten zijn vrijwel altijd recente
  // topics en belanden zo in dezelfde batch (over batchgrenzen heen worden ze
  // pas bij een volgende run gevonden).
  for (const batch of chunk(allTopics, BATCH_SIZE)) {
    try {
      const result = await reviewTopics(batch);
      irrelevantIds.push(...result.irrelevantIds);
      duplicateGroups.push(...result.duplicateGroups);
      confirmedIds.push(...result.confirmedIds);
    } catch (err) {
      // Eén mislukte Claude-call mag de hele opruimronde niet laten klappen;
      // de overgeslagen batch komt bij een volgende run vanzelf weer langs.
      reviewErrors++;
      if (reviewErrorMessages.size < 3) reviewErrorMessages.add((err as Error).message);
      console.error("Topic-reviewbatch mislukt, ga door met de rest:", err);
    }
  }

  // --- 1. Irrelevante topics verwijderen ---
  const removedTitles: string[] = [];
  if (irrelevantIds.length > 0) {
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
  }

  // --- 2. Duplicaten samenvoegen ---
  const mergedTitles: string[] = [];
  let mergeErrors = 0;
  for (const group of duplicateGroups) {
    try {
      const result = await mergeDuplicateTopics(supabase, group);
      if (result) mergedTitles.push(...result.mergedTitles);
    } catch (err) {
      mergeErrors++;
      console.error("Samenvoegen van duplicaat-groep mislukt, ga door met de rest:", err);
    }
  }

  // --- 3. Bevestigde topics op BEVESTIGD zetten ---
  let confirmed = 0;
  const stillExisting = confirmedIds.filter((id) => !irrelevantIds.includes(id));
  for (const ids of chunk(stillExisting, ID_CHUNK_SIZE)) {
    const { data: updated, error: confirmError } = await supabase
      .from("topics")
      .update({ confidence: "BEVESTIGD" })
      .in("id", ids)
      .neq("confidence", "BEVESTIGD")
      .select("id");
    if (confirmError) {
      return NextResponse.json({ error: confirmError.message }, { status: 500 });
    }
    confirmed += updated?.length ?? 0;
  }

  return NextResponse.json({
    checked: allTopics.length,
    removed: removedTitles.length,
    removedTitles,
    merged: mergedTitles.length,
    mergedTitles,
    mergeErrors,
    confirmed,
    reviewErrors,
    reviewErrorMessages: [...reviewErrorMessages],
  });
}
