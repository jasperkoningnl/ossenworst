import type { SupabaseClient } from "@supabase/supabase-js";
import type { Job } from "@/lib/types/database";
import { fetchRssSource } from "./fetchers/rss";
import { processRawItem } from "./relevance";
import { mergeRawItem } from "./merge";
import { summarizeTopicJob } from "./summarize";

const MAX_ATTEMPTS = 5;

/** Voert één geclaimd job uit en zet status/backoff op basis van het resultaat. */
export async function processJob(supabase: SupabaseClient, job: Job) {
  try {
    switch (job.type) {
      case "fetch_source": {
        const { data: source, error } = await supabase
          .from("sources")
          .select("*")
          .eq("id", job.payload.sourceId as string)
          .single();
        if (error) throw error;
        await fetchRssSource(supabase, source);
        break;
      }
      case "process_item":
        await processRawItem(supabase, job.payload.rawItemId as string);
        break;
      case "merge":
        await mergeRawItem(supabase, job.payload.rawItemId as string);
        break;
      case "summarize":
        await summarizeTopicJob(supabase, job.payload.topicId as string);
        break;
      case "translate":
      case "sync_squad":
        // Fase 2 / Fase 3 — nog geen handler; job blijft ongebruikt.
        break;
    }
    await supabase.from("jobs").update({ status: "done" }).eq("id", job.id);
  } catch (err) {
    const backoffSeconds = Math.min(60 * 2 ** job.attempts, 3600);
    const nextStatus = job.attempts >= MAX_ATTEMPTS ? "error" : "queued";
    await supabase
      .from("jobs")
      .update({
        status: nextStatus,
        run_after: new Date(Date.now() + backoffSeconds * 1000).toISOString(),
      })
      .eq("id", job.id);
    console.error(`Job ${job.id} (${job.type}) mislukt:`, err);
  }
}
