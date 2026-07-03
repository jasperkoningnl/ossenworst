import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { findIrrelevantTopicIds, type TopicForReview } from "@/lib/claude/cleanup";

export const maxDuration = 300;

const BATCH_SIZE = 40;

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
  for (let i = 0; i < allTopics.length; i += BATCH_SIZE) {
    const batch = allTopics.slice(i, i + BATCH_SIZE);
    irrelevantIds.push(...(await findIrrelevantTopicIds(batch)));
  }

  if (irrelevantIds.length === 0) {
    return NextResponse.json({ checked: allTopics.length, removed: 0, removedTitles: [] });
  }

  // raw_items op skipped vóór het verwijderen (delete zet topic_id op null,
  // daarna zijn ze niet meer terug te vinden) zodat ze niet opnieuw
  // verwerkt worden.
  const { error: skipError } = await supabase
    .from("raw_items")
    .update({ processing_status: "skipped" })
    .in("topic_id", irrelevantIds);
  if (skipError) {
    return NextResponse.json({ error: skipError.message }, { status: 500 });
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

  const { data: removed, error: deleteError } = await supabase
    .from("topics")
    .delete()
    .in("id", irrelevantIds)
    .select("title");
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    checked: allTopics.length,
    removed: removed?.length ?? 0,
    removedTitles: (removed ?? []).map((t) => t.title),
  });
}
