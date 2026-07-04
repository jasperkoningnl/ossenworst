import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { parseRssSource, type ParsedFeedItem } from "@/lib/pipeline/fetchers/rss";
import { parseScrapeSource } from "@/lib/pipeline/fetchers/scrape";
import { isGoogleNewsUrl } from "@/lib/pipeline/google-news";
import type { Source } from "@/lib/types/database";

export const maxDuration = 300;

const RECENT_DAYS = 7;
const MIN_BODY_CHARS = 80;
// Bronnen parallel checken; elke fetch heeft een 8s-timeout dus dit houdt de
// all-modus ruim binnen maxDuration.
const CHECK_CONCURRENCY = 6;

interface SourceCheckResult {
  slug: string;
  name: string;
  ok: boolean;
  error?: string;
  checks: Record<string, boolean>;
  stats?: Record<string, number>;
  sample?: { title: string; url: string; published_at: string | null; introChars: number; afbeelding: boolean }[];
  enabled: boolean;
}

/**
 * Kwaliteitscheck van bronnen (dry-run, schrijft geen items weg) voor de
 * gecontroleerde opbouw van de feed. Rapporteert per bron:
 * - haalt hij berichten op (werkende feed of scrape-config)
 * - zijn de berichten recent en gedateerd
 * - komen er intro's en afbeeldingen mee
 * - linken de items naar de bron zelf (en niet naar Google News)
 *
 * Modi:
 * - ?slug=nos-sport — één bron checken.
 * - zonder slug — alle bronnen met een feed_url of scrape_config checken.
 * - &enable=true — bronnen die de kerncriteria halen worden ingeschakeld en
 *   bronnen die niets ophalen worden uitgeschakeld (zodat een kapotte feed
 *   niet elke tick blijft falen tot iemand hem fixt).
 *
 *   curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \
 *     "https://ossenworst.vercel.app/api/admin/check-source?enable=true"
 */
export async function POST(request: Request) {
  const expected = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const slug = params.get("slug");
  const enable = params.get("enable") === "true";

  const supabase = createServiceClient();

  let query = supabase.from("sources").select("*");
  if (slug) {
    query = query.eq("slug", slug);
  } else {
    // Alle checkbare bronnen: met een feed of met een scrape-config.
    query = query.or("feed_url.not.is.null,scrape_config.not.is.null");
  }
  const { data: sources, error } = await query.order("name");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!sources || sources.length === 0) {
    return NextResponse.json(
      { error: slug ? `onbekende bron '${slug}' — draai eerst de Seed sources-workflow` : "geen checkbare bronnen" },
      { status: 404 }
    );
  }

  // Google News-bronnen zijn een bewust laatste redmiddel en doen niet mee in
  // de all-modus; expliciet checken op slug kan wel.
  const checkable = slug
    ? (sources as Source[])
    : (sources as Source[]).filter((s) => !s.feed_url?.includes("news.google.com"));

  const results: SourceCheckResult[] = [];
  for (let i = 0; i < checkable.length; i += CHECK_CONCURRENCY) {
    const batch = checkable.slice(i, i + CHECK_CONCURRENCY);
    results.push(...(await Promise.all(batch.map((source) => checkSource(source)))));
  }

  let enabledCount = 0;
  let disabledCount = 0;
  if (enable) {
    for (const result of results) {
      const source = checkable.find((s) => s.slug === result.slug)!;
      if (result.ok && !source.enabled) {
        const { error: updateError } = await supabase.from("sources").update({ enabled: true }).eq("id", source.id);
        if (!updateError) {
          result.enabled = true;
          enabledCount++;
        }
      } else if (!result.checks.haaltBerichtenOp && source.enabled) {
        // Dode feed of kapotte selectors: uitzetten zodat hij niet elke tick
        // blijft falen; na een fix zet een nieuwe check hem weer aan.
        const { error: updateError } = await supabase.from("sources").update({ enabled: false }).eq("id", source.id);
        if (!updateError) {
          result.enabled = false;
          disabledCount++;
        }
      }
    }
  }

  if (slug) {
    return NextResponse.json({ ...results[0], enableRequested: enable });
  }

  return NextResponse.json({
    checked: results.length,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    enabledNow: enabledCount,
    disabledNow: disabledCount,
    enableRequested: enable,
    // Voorbeelditems weglaten in de all-modus: 40 bronnen × 5 samples maakt
    // de respons onleesbaar; per-slug-modus toont ze wel.
    results: results.map((r) => ({ ...r, sample: undefined })),
  });
}

async function checkSource(source: Source): Promise<SourceCheckResult> {
  let items: ParsedFeedItem[];
  try {
    items =
      source.fetch_method === "scrape"
        ? await parseScrapeSource(source)
        : await parseRssSource(source);
  } catch (err) {
    return {
      slug: source.slug,
      name: source.name,
      ok: false,
      error: (err as Error).message,
      checks: { haaltBerichtenOp: false },
      enabled: source.enabled,
    };
  }

  const recentCutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
  const dated = items.filter((i) => i.published_at);
  const recent = dated.filter((i) => new Date(i.published_at!).getTime() >= recentCutoff);
  const withIntro = items.filter((i) => (i.body?.length ?? 0) >= MIN_BODY_CHARS);
  const withImage = items.filter((i) => i.image_url);
  const googleLinks = items.filter((i) => isGoogleNewsUrl(i.url));

  const sourceHost = new URL(source.url).hostname.replace(/^www\./, "");
  const ownDomainLinks = items.filter((i) => {
    try {
      return new URL(i.url).hostname.replace(/^www\./, "").endsWith(sourceHost);
    } catch {
      return false;
    }
  });

  const checks = {
    haaltBerichtenOp: items.length > 0,
    // Feeds zonder datums zijn niet per se stuk, maar recent materiaal moet
    // aantoonbaar zijn zodra er wél datums zijn.
    recent: items.length > 0 && (dated.length === 0 || recent.length > 0),
    intros: withIntro.length >= Math.ceil(items.length / 2),
    afbeeldingen: withImage.length >= Math.ceil(items.length / 2),
    linktNaarBron: googleLinks.length === 0,
  };
  // Kerncriteria voor inschakelen; intro's/afbeeldingen kunnen de
  // verrijkingsstap nog aanvullen en zijn daarom adviserend.
  const ok = checks.haaltBerichtenOp && checks.recent && checks.linktNaarBron;

  return {
    slug: source.slug,
    name: source.name,
    ok,
    checks,
    stats: {
      items: items.length,
      metDatum: dated.length,
      recent7d: recent.length,
      metIntro: withIntro.length,
      metAfbeelding: withImage.length,
      naarEigenDomein: ownDomainLinks.length,
      naarGoogleNews: googleLinks.length,
    },
    sample: items.slice(0, 5).map((i) => ({
      title: i.title,
      url: i.url,
      published_at: i.published_at,
      introChars: i.body?.length ?? 0,
      afbeelding: Boolean(i.image_url),
    })),
    enabled: source.enabled,
  };
}
