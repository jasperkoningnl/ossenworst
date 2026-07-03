import type { SupabaseClient } from "@supabase/supabase-js";
import { maxConfidence, type ConfidenceLevel } from "@/lib/types/enums";

/**
 * Voegt een groep duplicaat-topics samen tot één topic. Het oudste topic
 * (eerste melding) blijft bestaan; de items van de rest verhuizen ernaartoe
 * en de lege topics worden verwijderd. De tellers, activiteit en
 * betrouwbaarheid van de keeper worden herberekend en er wordt een
 * summarize-job enqueued voor een verse samenvatting over de hele tijdlijn.
 */
export async function mergeDuplicateTopics(
  supabase: SupabaseClient,
  group: string[]
): Promise<{ keeperId: string; mergedTitles: string[] } | null> {
  const { data: topics, error } = await supabase
    .from("topics")
    .select("id, title, first_seen_at, last_activity_at, confidence")
    .in("id", group);
  if (error) throw error;
  if (!topics || topics.length < 2) return null;

  const sorted = [...topics].sort(
    (a, b) => new Date(a.first_seen_at).getTime() - new Date(b.first_seen_at).getTime()
  );
  const keeper = sorted[0];
  const losers = sorted.slice(1);
  const loserIds = losers.map((t) => t.id);

  const { data: loserItems, error: itemsError } = await supabase
    .from("topic_items")
    .select("raw_item_id, source_id, reported_at, snippet, contribution, confidence_at")
    .in("topic_id", loserIds);
  if (itemsError) throw itemsError;

  if (loserItems && loserItems.length > 0) {
    // Zelfde raw_item kan (in theorie) al aan de keeper hangen; duplicaten negeren.
    const { error: moveError } = await supabase.from("topic_items").upsert(
      loserItems.map((item) => ({ ...item, topic_id: keeper.id })),
      { onConflict: "topic_id,raw_item_id", ignoreDuplicates: true }
    );
    if (moveError) throw moveError;
  }

  const { error: rawError } = await supabase
    .from("raw_items")
    .update({ topic_id: keeper.id })
    .in("topic_id", loserIds);
  if (rawError) throw rawError;

  // Openstaande summarize-jobs van de verdwijnende topics kunnen alleen nog falen.
  for (const loserId of loserIds) {
    await supabase
      .from("jobs")
      .delete()
      .eq("type", "summarize")
      .eq("status", "queued")
      .contains("payload", { topicId: loserId });
  }

  const { error: deleteError } = await supabase.from("topics").delete().in("id", loserIds);
  if (deleteError) throw deleteError;

  const { count: itemCount } = await supabase
    .from("topic_items")
    .select("id", { count: "exact", head: true })
    .eq("topic_id", keeper.id);

  const confidence = topics.reduce<ConfidenceLevel>(
    (acc, t) => maxConfidence(acc, t.confidence as ConfidenceLevel),
    "PRAATPROGRAMMA"
  );
  const lastActivityAt = topics
    .map((t) => t.last_activity_at)
    .sort()
    .at(-1);

  const { error: updateError } = await supabase
    .from("topics")
    .update({
      item_count: itemCount ?? undefined,
      last_activity_at: lastActivityAt,
      confidence,
    })
    .eq("id", keeper.id);
  if (updateError) throw updateError;

  await supabase.from("jobs").insert({ type: "summarize", payload: { topicId: keeper.id } });

  return { keeperId: keeper.id, mergedTitles: losers.map((t) => t.title) };
}
