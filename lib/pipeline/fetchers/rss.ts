import Parser from "rss-parser";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Source } from "@/lib/types/database";

const parser = new Parser();

function externalIdFor(item: { guid?: string; link?: string; title?: string }): string {
  return item.guid || item.link || item.title || crypto.randomUUID();
}

/**
 * Haalt een RSS-bron op en upsert nieuwe items in `raw_items` (dedup op
 * source_id+external_id via de DB-constraint). Enqueued een `process_item`-
 * job per daadwerkelijk nieuw item.
 */
export async function fetchRssSource(supabase: SupabaseClient, source: Source) {
  if (!source.feed_url) {
    await supabase.from("sources").update({ last_status: "geen feed_url ingesteld" }).eq("id", source.id);
    return { inserted: 0 };
  }

  let feed;
  try {
    feed = await parser.parseURL(source.feed_url);
  } catch (err) {
    await supabase
      .from("sources")
      .update({ last_fetched_at: new Date().toISOString(), last_status: `fout: ${(err as Error).message}` })
      .eq("id", source.id);
    throw err;
  }

  const rows = feed.items.map((item) => ({
    source_id: source.id,
    external_id: externalIdFor(item),
    url: item.link ?? source.url,
    title: item.title ?? "(geen titel)",
    body: item.contentSnippet ?? item.content ?? null,
    published_at: item.isoDate ?? null,
    language: source.language,
  }));

  if (rows.length === 0) {
    await supabase
      .from("sources")
      .update({ last_fetched_at: new Date().toISOString(), last_status: "ok (leeg)" })
      .eq("id", source.id);
    return { inserted: 0 };
  }

  const { data: insertedRows, error } = await supabase
    .from("raw_items")
    .upsert(rows, { onConflict: "source_id,external_id", ignoreDuplicates: true })
    .select("id");

  if (error) {
    await supabase
      .from("sources")
      .update({ last_fetched_at: new Date().toISOString(), last_status: `fout: ${error.message}` })
      .eq("id", source.id);
    throw error;
  }

  if (insertedRows && insertedRows.length > 0) {
    await supabase
      .from("jobs")
      .insert(insertedRows.map((r) => ({ type: "process_item", payload: { rawItemId: r.id } })));
  }

  await supabase
    .from("sources")
    .update({ last_fetched_at: new Date().toISOString(), last_status: "ok" })
    .eq("id", source.id);

  return { inserted: insertedRows?.length ?? 0 };
}
