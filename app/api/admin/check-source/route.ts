import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { parseRssSource, type ParsedFeedItem } from "@/lib/pipeline/fetchers/rss";
import { parseScrapeSource } from "@/lib/pipeline/fetchers/scrape";
import { isGoogleNewsUrl } from "@/lib/pipeline/google-news";
import type { Source } from "@/lib/types/database";

export const maxDuration = 60;

const RECENT_DAYS = 7;
const MIN_BODY_CHARS = 80;

/**
 * Kwaliteitscheck van één bron (dry-run, schrijft niets weg) voor de
 * gecontroleerde opbouw van de feed. Rapporteert per bron:
 * - haalt hij berichten op (werkende feed of scrape-config)
 * - zijn de berichten recent en gedateerd
 * - komen er intro's en afbeeldingen mee
 * - linken de items naar de bron zelf (en niet naar Google News)
 *
 * Met ?enable=true wordt de bron ingeschakeld als de kerncriteria
 * (berichten + recent + correcte links) slagen.
 *
 *   curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \
 *     "https://ossenworst.vercel.app/api/admin/check-source?slug=nos-sport&enable=true"
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
  if (!slug) {
    return NextResponse.json({ error: "geef een bron op met ?slug=…" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: source, error } = await supabase
    .from("sources")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!source) {
    return NextResponse.json(
      { error: `onbekende bron '${slug}' — draai eerst de Seed sources-workflow` },
      { status: 404 }
    );
  }

  let items: ParsedFeedItem[];
  try {
    items =
      source.fetch_method === "scrape"
        ? await parseScrapeSource(source as Source)
        : await parseRssSource(source as Source);
  } catch (err) {
    return NextResponse.json({
      slug,
      name: source.name,
      ok: false,
      error: (err as Error).message,
      checks: { haaltBerichtenOp: false },
      enabled: source.enabled,
    });
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
  const pass = checks.haaltBerichtenOp && checks.recent && checks.linktNaarBron;

  let enabledNow = source.enabled as boolean;
  if (enable && pass) {
    const { error: enableError } = await supabase
      .from("sources")
      .update({ enabled: true })
      .eq("id", source.id);
    if (enableError) {
      return NextResponse.json({ error: enableError.message }, { status: 500 });
    }
    enabledNow = true;
  }

  return NextResponse.json({
    slug,
    name: source.name,
    ok: pass,
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
    enabled: enabledNow,
    enableRequested: enable,
  });
}
