import Parser from "rss-parser";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Source } from "@/lib/types/database";

const parser = new Parser({
  headers: {
    "User-Agent": "OssenworstManager/1.0 (+https://ossenworst.nl)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
  timeout: 8000,
});

/**
 * Stabiele dedup-sleutel. Items zonder guid, link én titel worden overgeslagen:
 * een random fallback zou de unique-constraint omzeilen en hetzelfde item bij
 * elke fetch opnieuw binnenhalen.
 */
function externalIdFor(item: { guid?: string; link?: string; title?: string }): string | null {
  return item.guid || item.link || item.title || null;
}

/**
 * Google News-titels eindigen op " - Publicatienaam". Strippen zorgt dat
 * dezelfde kop via gnews en via de directe feed niet als twee verschillende
 * verhalen bij de merge belandt.
 */
function cleanTitle(title: string, source: Source): string {
  if (source.feed_url?.includes("news.google.com")) {
    return title.replace(/\s+-\s+[^-]+$/, "").trim() || title;
  }
  return title;
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

  const rows = feed.items.flatMap((item) => {
    const externalId = externalIdFor(item);
    if (!externalId) return [];
    return [{
      source_id: source.id,
      external_id: externalId,
      url: item.link ?? source.url,
      title: cleanTitle(item.title ?? "(geen titel)", source),
      body: item.contentSnippet ?? item.content ?? null,
      published_at: item.isoDate ?? null,
      language: source.language,
    }];
  });

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
    .update({ last_fetched_at: new Date().toISOString(), last_status: `ok (${insertedRows?.length ?? 0} nieuw)` })
    .eq("id", source.id);

  return { inserted: insertedRows?.length ?? 0 };
}
