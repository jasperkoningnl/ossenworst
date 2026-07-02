import { NextResponse, after } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { processJob } from "@/lib/pipeline/dispatch";
import { isRelevant } from "@/lib/pipeline/relevance";
import type { Job } from "@/lib/types/database";

const BUDGET_MS = 8000;
const FETCH_INTERVAL_MINUTES = 15;
const BULK_PROCESS_LIMIT = 200;

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const start = Date.now();

  await enqueueDueFetches(supabase);

  const bulkProcessed = await bulkDrainProcessItems(supabase);

  let processed = 0;
  while (Date.now() - start < BUDGET_MS) {
    const { data: claimed, error } = await supabase.rpc("claim_next_job");
    if (error) {
      console.error("claim_next_job faalde:", error);
      break;
    }
    const job = (claimed as Job[] | null)?.[0];
    if (!job) break;

    await processJob(supabase, job);
    processed++;
  }

  const { count: remaining } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "queued")
    .lte("run_after", new Date().toISOString());

  if (remaining && remaining > 0) {
    const origin = new URL(request.url).origin;
    after(async () => {
      try {
        await fetch(`${origin}/api/cron/tick`, {
          method: "POST",
          headers: { authorization: `Bearer ${expected}` },
        });
      } catch (err) {
        console.error("Self-chain tick faalde:", err);
      }
    });
  }

  return NextResponse.json({ ok: true, processed, bulkProcessed, remaining: remaining ?? 0 });
}

async function enqueueDueFetches(supabase: ReturnType<typeof createServiceClient>) {
  const cutoff = new Date(Date.now() - FETCH_INTERVAL_MINUTES * 60 * 1000).toISOString();
  const { data: dueSources, error } = await supabase
    .from("sources")
    .select("id")
    .eq("enabled", true)
    .or(`last_fetched_at.is.null,last_fetched_at.lt.${cutoff}`);
  if (error) throw error;
  if (!dueSources || dueSources.length === 0) return;

  const { data: alreadyQueued } = await supabase
    .from("jobs")
    .select("payload")
    .eq("type", "fetch_source")
    .in("status", ["queued", "running"]);

  const queuedSourceIds = new Set(
    (alreadyQueued ?? []).map((j) => (j.payload as Record<string, unknown>)?.sourceId as string)
  );

  const newSources = dueSources.filter((s) => !queuedSourceIds.has(s.id));
  if (newSources.length > 0) {
    await supabase
      .from("jobs")
      .insert(newSources.map((s) => ({ type: "fetch_source", payload: { sourceId: s.id } })));
  }
}

/**
 * Verwerkt process_item-jobs in bulk zonder de claim-queue. Dit is puur een
 * keyword-check — geen externe API nodig — en kan honderden items per seconde
 * aan i.p.v. de ~6/tick die de normale queue haalt.
 */
async function bulkDrainProcessItems(supabase: ReturnType<typeof createServiceClient>) {
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, payload")
    .eq("type", "process_item")
    .eq("status", "queued")
    .lte("run_after", new Date().toISOString())
    .limit(BULK_PROCESS_LIMIT);
  if (jobsError || !jobs || jobs.length === 0) return 0;

  const rawItemIds = jobs.map((j) => (j.payload as Record<string, unknown>).rawItemId as string);

  const { data: rawItems, error: rawError } = await supabase
    .from("raw_items")
    .select("id, title, body, language, sources(slug)")
    .in("id", rawItemIds);
  if (rawError || !rawItems) return 0;

  const AJAX_SOURCE_SLUGS = new Set([
    "ajax-nl", "ajax-supporters", "ajax-freaks", "ajax-showtime", "ajax-daily",
    "reddit-ajax", "football-oranje",
    "gnews-telegraaf", "gnews-vi", "gnews-ad", "gnews-volkskrant", "gnews-parool",
    "gnews-ajax-es", "gnews-ajax-it", "gnews-ajax-de", "gnews-ajax-fr",
    "gnews-ajax-pt", "gnews-ajax-br", "gnews-ajax-tr",
  ]);

  const relevant: string[] = [];
  const skipped: string[] = [];
  const translateIds: string[] = [];
  const mergeIds: string[] = [];

  for (const item of rawItems) {
    const source = item.sources as unknown as { slug: string } | null;
    const isAjaxSource = source?.slug ? AJAX_SOURCE_SLUGS.has(source.slug) : false;

    if (!isAjaxSource && !isRelevant(item.title, item.body)) {
      skipped.push(item.id);
    } else {
      relevant.push(item.id);
      if (item.language !== "nl") {
        translateIds.push(item.id);
      } else {
        mergeIds.push(item.id);
      }
    }
  }

  if (skipped.length > 0) {
    await supabase
      .from("raw_items")
      .update({ processing_status: "skipped" })
      .in("id", skipped);
  }

  const newJobs: { type: string; payload: Record<string, string> }[] = [
    ...mergeIds.map((id) => ({ type: "merge", payload: { rawItemId: id } })),
    ...translateIds.map((id) => ({ type: "translate", payload: { rawItemId: id } })),
  ];
  if (newJobs.length > 0) {
    await supabase.from("jobs").insert(newJobs);
  }

  const jobIds = jobs.map((j) => j.id);
  await supabase.from("jobs").update({ status: "done" }).in("id", jobIds);

  return jobs.length;
}
