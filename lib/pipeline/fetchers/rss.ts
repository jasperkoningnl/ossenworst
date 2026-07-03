import Parser from "rss-parser";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Source } from "@/lib/types/database";
import { decodeGoogleNewsUrl } from "@/lib/pipeline/google-news";
import { MAX_ITEM_AGE_DAYS } from "@/lib/pipeline/relevance";
import { htmlToText, truncate } from "@/lib/utils/text";

/** Extra velden bovenop rss-parser's defaults (zie customFields hieronder). */
interface CustomItem {
  /** Volledige artikeltekst uit content:encoded — veel rijker dan de description. */
  contentEncoded?: string;
  /** RSS <source>-element; Google News zet hier de echte publisher in. */
  gnewsSource?: { _?: string; $?: { url?: string } } | string;
}

const parser = new Parser<Record<string, unknown>, CustomItem>({
  headers: {
    "User-Agent": "OssenworstManager/1.0 (+https://ossenworst.nl)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
  timeout: 8000,
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["source", "gnewsSource"],
    ],
  },
});

const MAX_BODY_CHARS = 1200;

/**
 * Stabiele dedup-sleutel. Items zonder guid, link én titel worden overgeslagen:
 * een random fallback zou de unique-constraint omzeilen en hetzelfde item bij
 * elke fetch opnieuw binnenhalen.
 */
function externalIdFor(item: { guid?: string; link?: string; title?: string }): string | null {
  return item.guid || item.link || item.title || null;
}

function isGoogleNewsSource(source: Source): boolean {
  return source.feed_url?.includes("news.google.com") ?? false;
}

/**
 * Google News-titels eindigen op " - Publicatienaam". Strippen zorgt dat
 * dezelfde kop via gnews en via de directe feed niet als twee verschillende
 * verhalen bij de merge belandt.
 */
function cleanTitle(title: string, isGnews: boolean): string {
  if (isGnews) {
    return title.replace(/\s+-\s+[^-]+$/, "").trim() || title;
  }
  return title;
}

/** Echte publishernaam uit het RSS <source>-element of het titel-achtervoegsel. */
function publisherNameFor(item: Parser.Item & CustomItem): string | null {
  const source = item.gnewsSource;
  if (typeof source === "string" && source.trim()) return source.trim();
  if (source && typeof source === "object" && source._?.trim()) return source._.trim();
  return item.title?.match(/\s+-\s+([^-]+)$/)?.[1]?.trim() ?? null;
}

/**
 * Beste beschikbare artikeltekst uit het feed-item, opgeschoond naar platte
 * tekst. Google News-descriptions zijn alleen een lijstje links en dus
 * waardeloos als intro; die krijgen null (de verrijkingsstap haalt de intro
 * later van de artikelpagina zelf).
 */
function bodyFor(item: Parser.Item & CustomItem, isGnews: boolean): string | null {
  if (isGnews) return null;
  const raw = item.contentEncoded || item.content || item.contentSnippet || "";
  const text = htmlToText(raw);
  return text ? truncate(text, MAX_BODY_CHARS) : null;
}

/**
 * Haalt een RSS-bron op en upsert nieuwe items in `raw_items` (dedup op
 * source_id+external_id via de DB-constraint). Verouderde items (ouder dan
 * MAX_ITEM_AGE_DAYS) worden genegeerd zodat archiefstukken en jubileum-feeds
 * de actuele feed niet vervuilen. Enqueued een `process_item`-job per
 * daadwerkelijk nieuw item.
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

  const isGnews = isGoogleNewsSource(source);
  const ageCutoff = Date.now() - MAX_ITEM_AGE_DAYS * 24 * 60 * 60 * 1000;

  const rows = feed.items.flatMap((item) => {
    const externalId = externalIdFor(item);
    if (!externalId) return [];
    if (item.isoDate && new Date(item.isoDate).getTime() < ageCutoff) return [];

    // Google News-links waar mogelijk direct (offline, gratis) herleiden naar
    // de originele publisher-URL; de rest doet de verrijkingsstap later.
    let url = item.link ?? source.url;
    if (isGnews && item.link) {
      url = decodeGoogleNewsUrl(item.link) ?? item.link;
    }

    return [{
      source_id: source.id,
      external_id: externalId,
      url,
      title: cleanTitle(item.title ?? "(geen titel)", isGnews),
      body: bodyFor(item, isGnews),
      published_at: item.isoDate ?? null,
      language: source.language,
      publisher_name: isGnews ? publisherNameFor(item) : null,
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
