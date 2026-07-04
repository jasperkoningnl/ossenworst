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
  mediaContent?: { $?: { url?: string; medium?: string; type?: string } }[];
  mediaThumbnail?: { $?: { url?: string } }[];
}

type FeedItem = Parser.Item & CustomItem;

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
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
    ],
  },
});

const MAX_BODY_CHARS = 1200;

const USER_AGENT = "OssenworstManager/1.0 (+https://ossenworst.nl)";
// Sommige feed-CDN's (footballco, o-jogo) geven 403 op bot-achtige UA's;
// een browser-UA als retry lost dat op.
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/**
 * Maakt veelvoorkomende XML-fouten in feeds onschadelijk vóór het parsen:
 * losse &-tekens (niet-geëscapete entities in URL's/titels) en control
 * characters. Niet-Engelstalige feeds blijken dit in de praktijk vaak te
 * hebben (FutbolRed, Gazeta Esportiva, L'Équipe).
 */
function sanitizeFeedXml(xml: string): string {
  return xml
    .replace(/^\uFEFF/, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&(?!(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);)/g, "&amp;");
}

/** Feed ophalen (met browser-UA-retry bij 403/429) en parsen (met sanitize-retry). */
async function fetchAndParseFeed(feedUrl: string) {
  const doFetch = (userAgent: string) =>
    fetch(feedUrl, {
      headers: { "User-Agent": userAgent, Accept: "application/rss+xml, application/xml, text/xml, */*" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });

  let res = await doFetch(USER_AGENT);
  if (res.status === 403 || res.status === 429) {
    res = await doFetch(BROWSER_USER_AGENT);
  }
  if (!res.ok) throw new Error(`Status code ${res.status}`);

  const xml = await res.text();
  try {
    return await parser.parseString(xml);
  } catch {
    return await parser.parseString(sanitizeFeedXml(xml));
  }
}

/** Eén genormaliseerd feed-item, klaar voor raw_items (of voor de broncheck). */
export interface ParsedFeedItem {
  external_id: string;
  url: string;
  title: string;
  body: string | null;
  published_at: string | null;
  language: string;
  publisher_name: string | null;
  image_url: string | null;
}

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
function publisherNameFor(item: FeedItem): string | null {
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
function bodyFor(item: FeedItem, isGnews: boolean): string | null {
  if (isGnews) return null;
  const raw = item.contentEncoded || item.content || item.contentSnippet || "";
  const text = htmlToText(raw);
  return text ? truncate(text, MAX_BODY_CHARS) : null;
}

/**
 * Afbeelding uit het feed-item, met de fallback-keten media:content →
 * media:thumbnail → enclosure → eerste <img> in de (encoded) content.
 */
function imageUrlFor(item: FeedItem): string | null {
  for (const media of item.mediaContent ?? []) {
    const url = media.$?.url;
    const isImage =
      media.$?.medium === "image" || (media.$?.type ?? "").startsWith("image/") || /\.(jpe?g|png|webp|gif)($|\?)/i.test(url ?? "");
    if (url && isImage) return url;
  }
  const thumbnail = item.mediaThumbnail?.[0]?.$?.url;
  if (thumbnail) return thumbnail;

  const enclosure = item.enclosure;
  if (enclosure?.url && ((enclosure.type ?? "").startsWith("image/") || /\.(jpe?g|png|webp|gif)($|\?)/i.test(enclosure.url))) {
    return enclosure.url;
  }

  const html = item.contentEncoded || item.content || "";
  return html.match(/<img[^>]+src="(https?:\/\/[^"]+)"/i)?.[1] ?? null;
}

/**
 * Haalt en normaliseert de items van een RSS-bron zónder iets op te slaan.
 * Verouderde items (ouder dan MAX_ITEM_AGE_DAYS) worden genegeerd zodat
 * archiefstukken en jubileum-feeds de actuele feed niet vervuilen.
 * Gedeeld door de echte fetch en de broncheck (dry-run).
 */
export async function parseRssSource(source: Source): Promise<ParsedFeedItem[]> {
  if (!source.feed_url) throw new Error("geen feed_url ingesteld");

  const feed = await fetchAndParseFeed(source.feed_url);
  const isGnews = isGoogleNewsSource(source);
  const ageCutoff = Date.now() - MAX_ITEM_AGE_DAYS * 24 * 60 * 60 * 1000;

  return feed.items.flatMap((item) => {
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
      external_id: externalId,
      url,
      title: cleanTitle(item.title ?? "(geen titel)", isGnews),
      body: bodyFor(item, isGnews),
      published_at: item.isoDate ?? null,
      language: source.language,
      publisher_name: isGnews ? publisherNameFor(item) : null,
      image_url: imageUrlFor(item),
    }];
  });
}

/**
 * Haalt een RSS-bron op en upsert nieuwe items in `raw_items` (dedup op
 * source_id+external_id via de DB-constraint). Enqueued een `process_item`-
 * job per daadwerkelijk nieuw item.
 */
export async function fetchRssSource(supabase: SupabaseClient, source: Source) {
  let items: ParsedFeedItem[];
  try {
    items = await parseRssSource(source);
  } catch (err) {
    await supabase
      .from("sources")
      .update({ last_fetched_at: new Date().toISOString(), last_status: `fout: ${(err as Error).message}` })
      .eq("id", source.id);
    throw err;
  }

  const rows = items.map((item) => ({ source_id: source.id, ...item }));

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
