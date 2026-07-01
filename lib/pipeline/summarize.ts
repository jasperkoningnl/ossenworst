import type { SupabaseClient } from "@supabase/supabase-js";
import { summarizeTopic } from "@/lib/claude/summarize";

/** Herschrijft topics.summary op basis van de volledige tijdlijn (topic_items). */
export async function summarizeTopicJob(supabase: SupabaseClient, topicId: string) {
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("title")
    .eq("id", topicId)
    .single();
  if (topicError) throw topicError;

  const { data: items, error: itemsError } = await supabase
    .from("topic_items")
    .select("snippet, reported_at, sources(name)")
    .eq("topic_id", topicId)
    .order("reported_at", { ascending: true });
  if (itemsError) throw itemsError;

  const timeline = (items ?? []).map((it) => {
    // Zonder gegenereerde Database-types ziet supabase-js een many-to-one
    // FK-join als array; runtime is het altijd één object.
    const source = it.sources as unknown as { name: string } | null;
    return {
      sourceName: source?.name ?? "onbekende bron",
      snippet: it.snippet ?? "",
      reportedAt: it.reported_at,
    };
  });

  const summary = await summarizeTopic(topic.title, timeline);

  await supabase
    .from("topics")
    .update({ summary, summary_updated_at: new Date().toISOString() })
    .eq("id", topicId);
}
