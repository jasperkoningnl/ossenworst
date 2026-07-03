import * as cheerio from "cheerio";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Source } from "@/lib/types/database";
import { isTooOld } from "@/lib/pipeline/relevance";
import type { ParsedFeedItem } from "./rss";

export interface ScrapeConfig {
  listUrl: string;
  articleSelector: string;
  titleSelector: string;
  linkSelector: string;
  snippetSelector?: string;
  dateSelector?: string;
  dateAttribute?: string;
  linkAttribute?: string;
  /** Selector voor de artikelafbeelding binnen articleSelector (standaard "img"). */
  imageSelector?: string;
  /** Attribuut met de afbeeldings-URL (standaard "src", vaak "data-src" bij lazy loading). */
  imageAttribute?: string;
}

const USER_AGENT = "OssenworstManager/1.0 (+https://ossenworst.nl)";

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

function extractArticles(html: string, config: ScrapeConfig, baseUrl: string, language: string): ParsedFeedItem[] {
  const $ = cheerio.load(html);
  const articles: ParsedFeedItem[] = [];

  $(config.articleSelector).each((_i, el) => {
    const $el = $(el);

    const title = $el.find(config.titleSelector).first().text().trim();
    if (!title) return;

    const linkEl = $el.find(config.linkSelector).first();
    const rawHref =
      linkEl.attr(config.linkAttribute ?? "href") ?? linkEl.attr("href") ?? "";
    const url = resolveUrl(rawHref, baseUrl);
    if (!url) return;

    const snippet = config.snippetSelector
      ? $el.find(config.snippetSelector).first().text().trim() || null
      : null;

    let published_at: string | null = null;
    if (config.dateSelector) {
      const dateEl = $el.find(config.dateSelector).first();
      const raw = config.dateAttribute
        ? dateEl.attr(config.dateAttribute)
        : dateEl.text().trim();
      if (raw) {
        const parsed = new Date(raw);
        if (!isNaN(parsed.getTime())) {
          published_at = parsed.toISOString();
        }
      }
    }

    const imageEl = $el.find(config.imageSelector ?? "img").first();
    const rawImage =
      imageEl.attr(config.imageAttribute ?? "src") ??
      imageEl.attr("data-src") ??
      imageEl.attr("srcset")?.split(/\s+/)[0];
    const image_url = rawImage ? resolveUrl(rawImage, baseUrl) : null;

    articles.push({
      external_id: url || title,
      url,
      title,
      body: snippet,
      published_at,
      language,
      publisher_name: null,
      image_url,
    });
  });

  return articles;
}

/**
 * Haalt en normaliseert de artikelen van een scrape-bron zónder iets op te
 * slaan. Archiefpagina's kunnen oude artikelen tonen; alleen actuele items
 * blijven over. Gedeeld door de echte fetch en de broncheck (dry-run).
 */
export async function parseScrapeSource(source: Source): Promise<ParsedFeedItem[]> {
  const config = source.scrape_config as ScrapeConfig | null;
  if (!config?.listUrl) throw new Error("geen scrape_config.listUrl ingesteld");

  const res = await fetch(config.listUrl, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  return extractArticles(html, config, config.listUrl, source.language).filter(
    (a) => !isTooOld(a.published_at)
  );
}

export async function fetchScrapeSource(
  supabase: SupabaseClient,
  source: Source
) {
  let articles: ParsedFeedItem[];
  try {
    articles = await parseScrapeSource(source);
  } catch (err) {
    await supabase
      .from("sources")
      .update({
        last_fetched_at: new Date().toISOString(),
        last_status: `fout: ${(err as Error).message}`,
      })
      .eq("id", source.id);
    throw err;
  }

  if (articles.length === 0) {
    await supabase
      .from("sources")
      .update({
        last_fetched_at: new Date().toISOString(),
        last_status: "ok (0 artikelen gevonden)",
      })
      .eq("id", source.id);
    return { inserted: 0 };
  }

  const rows = articles.map((a) => ({ source_id: source.id, ...a }));

  const { data: insertedRows, error } = await supabase
    .from("raw_items")
    .upsert(rows, { onConflict: "source_id,external_id", ignoreDuplicates: true })
    .select("id");

  if (error) {
    await supabase
      .from("sources")
      .update({
        last_fetched_at: new Date().toISOString(),
        last_status: `fout: ${error.message}`,
      })
      .eq("id", source.id);
    throw error;
  }

  if (insertedRows && insertedRows.length > 0) {
    await supabase
      .from("jobs")
      .insert(
        insertedRows.map((r) => ({
          type: "process_item" as const,
          payload: { rawItemId: r.id },
        }))
      );
  }

  await supabase
    .from("sources")
    .update({
      last_fetched_at: new Date().toISOString(),
      last_status: `ok (${insertedRows?.length ?? 0} nieuw)`,
    })
    .eq("id", source.id);

  return { inserted: insertedRows?.length ?? 0 };
}
