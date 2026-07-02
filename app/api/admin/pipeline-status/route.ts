import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { JOB_TYPES, PROCESSING_STATUSES } from "@/lib/types/enums";

/**
 * Diagnose-overzicht van de aggregatiepipeline in één JSON: queue-diepte per
 * jobtype/status, mislukte jobs, verwerkingsstatus van raw_items, bronnen met
 * fouten en de nieuwste topics. Bedoeld om zonder database-toegang te kunnen
 * zien of de pipeline gezond is:
 *
 *   curl -H "Authorization: Bearer $ADMIN_SECRET" \
 *     https://ossenworst.vercel.app/api/admin/pipeline-status
 */
export async function GET(request: Request) {
  const expected = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // Tellen via head-counts: rijen ophalen en zelf aggregeren loopt tegen de
  // PostgREST max-rows limiet (1000) aan en zou stilletjes ondertellen.
  const countJobs = async (filters: { type?: string; status: string; dueBefore?: string }) => {
    let query = supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", filters.status);
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.dueBefore) query = query.lte("run_after", filters.dueBefore);
    const { count } = await query;
    return count ?? 0;
  };

  const jobTypeCounts = await Promise.all(
    JOB_TYPES.map(async (type) => ({
      type,
      queued: await countJobs({ type, status: "queued" }),
      running: await countJobs({ type, status: "running" }),
      error: await countJobs({ type, status: "error" }),
    }))
  );

  const [queuedDueNow, doneCount, errorSamples, oldestQueued, rawItemCounts, topics, sources] =
    await Promise.all([
      countJobs({ status: "queued", dueBefore: now }),
      countJobs({ status: "done" }),
      supabase
        .from("jobs")
        .select("type, payload, attempts, run_after, created_at")
        .eq("status", "error")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("jobs")
        .select("type, created_at")
        .eq("status", "queued")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      Promise.all(
        PROCESSING_STATUSES.map(async (status) => {
          const { count } = await supabase
            .from("raw_items")
            .select("id", { count: "exact", head: true })
            .eq("processing_status", status);
          return [status, count ?? 0] as const;
        })
      ),
      supabase
        .from("topics")
        .select("slug, title, category, confidence, item_count, last_activity_at", {
          count: "exact",
        })
        .order("last_activity_at", { ascending: false })
        .limit(5),
      supabase
        .from("sources")
        .select("name, slug, enabled, last_fetched_at, last_status")
        .eq("enabled", true)
        .order("last_fetched_at", { ascending: true, nullsFirst: true }),
    ]);

  const enabledSources = sources.data ?? [];
  const failingSources = enabledSources.filter((s) => s.last_status?.startsWith("fout"));
  const neverFetched = enabledSources.filter((s) => !s.last_fetched_at);

  return NextResponse.json({
    generatedAt: now,
    jobs: {
      byType: jobTypeCounts.filter((t) => t.queued + t.running + t.error > 0),
      queuedDueNow,
      done: doneCount,
      oldestQueued: oldestQueued.data ?? null,
      recentErrors: errorSamples.data ?? [],
    },
    rawItems: Object.fromEntries(rawItemCounts),
    topics: {
      total: topics.count ?? 0,
      latest: topics.data ?? [],
    },
    sources: {
      enabled: enabledSources.length,
      failing: failingSources,
      neverFetched: neverFetched.map((s) => s.slug),
      all: enabledSources,
    },
  });
}
