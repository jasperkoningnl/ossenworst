import { NextResponse, after } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { processJob } from "@/lib/pipeline/dispatch";
import { isRelevant, AJAX_SOURCE_SLUGS } from "@/lib/pipeline/relevance";
import type { Job } from "@/lib/types/database";

// Fluid compute staat >10s toe; ruime marge zodat een batch die net vóór de
// budget-deadline start de invocatie niet laat afbreken (en de jobs als
// stale 'running' achterlaat).
export const maxDuration = 90;

// Ruim binnen maxDuration; laat per invocatie tientallen jobs toe i.p.v. de
// oude ~6 (het 8s-budget stamt uit het ontwerp voor de 10s-limiet).
const BUDGET_MS = 45_000;
const FETCH_INTERVAL_MINUTES = 15;
const BULK_PROCESS_LIMIT = 200;
// Jobs zijn I/O-bound (Claude-call of feed-fetch); een paar parallel verwerken
// vermenigvuldigt de doorvoer per invocatie zonder rate-limits te raken.
const JOB_CONCURRENCY = 3;
const STALE_RUNNING_MINUTES = 10;
const DONE_JOB_RETENTION_DAYS = 7;

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const start = Date.now();

  await requeueStaleJobs(supabase);
  await pruneOldJobs(supabase);
  await enqueueDueFetches(supabase);

  const bulkProcessed = await bulkDrainProcessItems(supabase);

  let processed = 0;
  while (Date.now() - start < BUDGET_MS) {
    const batch: Job[] = [];
    while (batch.length < JOB_CONCURRENCY) {
      const { data: claimed, error } = await supabase.rpc("claim_next_job");
      if (error) {
        console.error("claim_next_job faalde:", error);
        break;
      }
      const job = (claimed as Job[] | null)?.[0];
      if (!job) break;
      batch.push(job);
    }
    if (batch.length === 0) break;

    await Promise.all(batch.map((job) => processJob(supabase, job)));
    processed += batch.length;
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
        const res = await fetch(`${origin}/api/cron/tick`, {
          method: "POST",
          headers: { authorization: `Bearer ${expected}` },
        });
        if (!res.ok) {
          // Vercel's recursie-bescherming kan self-requests blokkeren (508);
          // de Action-lus in pipeline-tick.yml is daarom het primaire kanaal.
          console.error(`Self-chain tick kreeg status ${res.status}`);
        }
      } catch (err) {
        console.error("Self-chain tick faalde:", err);
      }
    });
  }

  return NextResponse.json({ ok: true, processed, bulkProcessed, remaining: remaining ?? 0 });
}

/**
 * Zet jobs die te lang op 'running' staan (invocatie gecrasht/getimed-out)
 * terug in de queue. Zonder dit blijft zo'n job eeuwig hangen — en wordt een
 * bron met een hangende fetch_source-job nooit meer opgehaald, omdat
 * enqueueDueFetches bronnen met een lopende job overslaat.
 */
async function requeueStaleJobs(supabase: ReturnType<typeof createServiceClient>) {
  const cutoff = new Date(Date.now() - STALE_RUNNING_MINUTES * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("jobs")
    .update({ status: "queued", locked_at: null })
    .eq("status", "running")
    .lt("locked_at", cutoff);
  if (error) console.error("Requeue van stale jobs faalde:", error);
}

/** Voorkomt dat de jobs-tabel onbeperkt groeit. */
async function pruneOldJobs(supabase: ReturnType<typeof createServiceClient>) {
  const cutoff = new Date(Date.now() - DONE_JOB_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("status", "done")
    .lt("created_at", cutoff);
  if (error) console.error("Opschonen van oude jobs faalde:", error);
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

  const { data: alreadyQueued, error: queuedError } = await supabase
    .from("jobs")
    .select("payload")
    .eq("type", "fetch_source")
    .in("status", ["queued", "running"]);
  // Zonder zicht op de bestaande queue niet blind inserten: dat stapelt
  // dubbele fetch-jobs op (één set per tick).
  if (queuedError) {
    console.error("Kon bestaande fetch-jobs niet lezen, sla enqueue over:", queuedError);
    return;
  }

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
 *
 * De jobs worden eerst atomair geclaimd (status queued → running), zodat een
 * overlappende tick (self-chain + GitHub Action) niet dezelfde items dubbel
 * verwerkt en dubbele merge/translate-jobs aanmaakt.
 */
async function bulkDrainProcessItems(supabase: ReturnType<typeof createServiceClient>) {
  const { data: candidates, error: candidatesError } = await supabase
    .from("jobs")
    .select("id")
    .eq("type", "process_item")
    .eq("status", "queued")
    .lte("run_after", new Date().toISOString())
    .limit(BULK_PROCESS_LIMIT);
  if (candidatesError || !candidates || candidates.length === 0) return 0;

  const { data: jobs, error: claimError } = await supabase
    .from("jobs")
    .update({ status: "running", locked_at: new Date().toISOString() })
    .in("id", candidates.map((c) => c.id))
    .eq("status", "queued")
    .select("id, payload");
  if (claimError || !jobs || jobs.length === 0) return 0;

  const jobIds = jobs.map((j) => j.id);
  // Bij een fout halverwege: jobs terug naar queued zodat een volgende tick
  // ze opnieuw probeert (i.p.v. done markeren en items eeuwig 'pending' laten).
  const requeue = async () => {
    await supabase.from("jobs").update({ status: "queued", locked_at: null }).in("id", jobIds);
  };

  const rawItemIds = jobs.map((j) => (j.payload as Record<string, unknown>).rawItemId as string);

  const { data: rawItems, error: rawError } = await supabase
    .from("raw_items")
    .select("id, title, body, language, sources(slug)")
    .in("id", rawItemIds);
  if (rawError || !rawItems) {
    await requeue();
    return 0;
  }

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
    const { error: skipError } = await supabase
      .from("raw_items")
      .update({ processing_status: "skipped" })
      .in("id", skipped);
    if (skipError) {
      await requeue();
      return 0;
    }
  }

  const newJobs: { type: string; payload: Record<string, string> }[] = [
    ...mergeIds.map((id) => ({ type: "merge", payload: { rawItemId: id } })),
    ...translateIds.map((id) => ({ type: "translate", payload: { rawItemId: id } })),
  ];
  if (newJobs.length > 0) {
    const { error: insertError } = await supabase.from("jobs").insert(newJobs);
    if (insertError) {
      await requeue();
      return 0;
    }
  }

  await supabase.from("jobs").update({ status: "done" }).in("id", jobIds);

  return jobs.length;
}
