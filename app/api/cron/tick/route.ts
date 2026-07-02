import { NextResponse, after } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { processJob } from "@/lib/pipeline/dispatch";
import type { Job } from "@/lib/types/database";

const BUDGET_MS = 8000;
const FETCH_INTERVAL_MINUTES = 15;

/**
 * Enqueue + drain in één invocatie, getriggerd door een GitHub Action op een
 * schedule (Vercel Cron op Hobby draait maar 1x/dag — te traag hiervoor, zie
 * .github/workflows/pipeline-tick.yml). Blijft ruim binnen de Vercel
 * 10s-limiet door na het tijdsbudget een self-chaining tick te vuren via
 * next/server's `after()` i.p.v. door te blijven verwerken.
 */
export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const start = Date.now();

  await enqueueDueFetches(supabase);
  await requeueStuckItems(supabase);

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

  return NextResponse.json({ ok: true, processed, remaining: remaining ?? 0 });
}

/**
 * Enqueued fetch_source-jobs voor bronnen die aan de beurt zijn. Houdt geen
 * rekening met al-wachtende fetch_source-jobs voor dezelfde bron (die zouden
 * pas verdwijnen als last_fetched_at bijgewerkt is, wat pas ná verwerking
 * gebeurt) — bij een grote achterstand + snel self-chainen kan dit dezelfde
 * bron dubbel enqueuen. Onschadelijk dankzij de dedup op raw_items, en bij
 * het huidige aantal bronnen verwaarloosbaar; geen extra complexiteit waard.
 */
async function enqueueDueFetches(supabase: ReturnType<typeof createServiceClient>) {
  const cutoff = new Date(Date.now() - FETCH_INTERVAL_MINUTES * 60 * 1000).toISOString();
  const { data: dueSources, error } = await supabase
    .from("sources")
    .select("id")
    .eq("enabled", true)
    .or(`last_fetched_at.is.null,last_fetched_at.lt.${cutoff}`);
  if (error) throw error;

  if (dueSources && dueSources.length > 0) {
    await supabase
      .from("jobs")
      .insert(dueSources.map((s) => ({ type: "fetch_source", payload: { sourceId: s.id } })));
  }
}

/**
 * Vindt raw_items die op `pending` staan maar waarvoor geen actief job meer
 * bestaat (bv. omdat de process_item/translate/merge-jobs het max aantal
 * pogingen hebben bereikt). Queue ze opnieuw als `process_item`.
 */
async function requeueStuckItems(supabase: ReturnType<typeof createServiceClient>) {
  const { data: stuckItems, error } = await supabase
    .from("raw_items")
    .select("id")
    .eq("processing_status", "pending")
    .limit(50);
  if (error || !stuckItems || stuckItems.length === 0) return;

  const stuckIds = stuckItems.map((r) => r.id);

  const { data: activeJobs } = await supabase
    .from("jobs")
    .select("payload")
    .in("status", ["queued", "running"])
    .in("type", ["process_item", "translate", "merge"]);

  const activeRawItemIds = new Set(
    (activeJobs ?? [])
      .map((j) => (j.payload as Record<string, unknown>)?.rawItemId as string)
      .filter(Boolean)
  );

  const orphaned = stuckIds.filter((id) => !activeRawItemIds.has(id));
  if (orphaned.length === 0) return;

  await supabase
    .from("jobs")
    .insert(orphaned.map((id) => ({ type: "process_item", payload: { rawItemId: id } })));
}
