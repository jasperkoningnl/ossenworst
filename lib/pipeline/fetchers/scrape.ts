import * as cheerio from "cheerio";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Source } from "@/lib/types/database";
import { isTooOld } from "@/lib/pipeline/relevance";

export interface ScrapeConfig {
  listUrl: string;
  articleSelector: string;
  titleSelector: string;
  linkSelector: string;
  snippetSelector?: string;
  dateSelector?: string;
  dateAttribute?: string;
  linkAttribute?: string;
}

const USER_AGENT = "OssenworstManager/1.0 (+https://ossenworst.nl)";

function externalIdFor(url: string, title: string): string {
  return url || title || crypto.randomUUID();
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

function extractArticles(html: string, config: ScrapeConfig, baseUrl: string) {
  const $ = cheerio.load(html);
  const articles: {
    url: string;
    title: string;
    body: string | null;
    published_at: string | null;
  }[] = [];

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

    articles.push({ url, title, body: snippet, published_at });
  });

  return articles;
}

export async function fetchScrapeSource(
  supabase: SupabaseClient,
  source: Source
) {
  const config = source.scrape_config as ScrapeConfig | null;
  if (!config?.listUrl) {
    await supabase
      .from("sources")
      .update({ last_status: "geen scrape_config.listUrl ingesteld" })
      .eq("id", source.id);
    return { inserted: 0 };
  }

  let html: string;
  try {
    const res = await fetch(config.listUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
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

  // Archiefpagina's kunnen oude artikelen tonen; alleen actuele items ingesten.
  const articles = extractArticles(html, config, config.listUrl).filter(
    (a) => !isTooOld(a.published_at)
  );

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

  const rows = articles.map((a) => ({
    source_id: source.id,
    external_id: externalIdFor(a.url, a.title),
    url: a.url,
    title: a.title,
    body: a.body,
    published_at: a.published_at,
    language: source.language,
  }));

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
