import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enrichRawItem } from "@/lib/pipeline/enrich";
import { isGoogleNewsUrl } from "@/lib/pipeline/google-news";
import { isUsableImageUrl } from "@/lib/utils/image";

export const maxDuration = 300;

const TIME_BUDGET_MS = 250_000;
const MAX_ITEMS = 300;
const ENRICH_CONCURRENCY = 4;
const RETRY_WINDOW_HOURS = 24;

/**
 * Backfill: verrijkt raw_items die al aan een topic hangen maar vóór de
 * verrijkingsstap zijn verwerkt (of waarvan de Google News-URL nog niet
 * herleid is, of de afbeelding ontbreekt). Herstelt zo de bronlinks,
 * publishernamen, intro's en afbeeldingen van bestaand materiaal; nieuwe
 * items worden gewoon in de pipeline verrijkt.
 *
 * Met ?force=true worden bestaande intro's van NL-items opnieuw van de
 * artikelpagina geëxtraheerd en vervángen — herstelmodus voor items waarvan
 * een eerdere (slechtere) extractie verkeerde tekst opsloeg (bv. teasers van
 * gerelateerde berichten). Vertaalde teksten en lange feed-teksten blijven
 * daarbij ongemoeid.
 *
 * Idempotent en veilig her-draaibaar.
 *
 *   curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \
 *     "https://ossenworst.vercel.app/api/admin/enrich-items?force=true"
 */
export async function POST(request: Request) {
  const expected = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    return await enrichItems(new URL(request.url).searchParams.get("force") === "true");
  } catch (err) {
    console.error("enrich-items faalde:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/** Vaste publishernamen voor de site-specifieke Google News-bronnen. */
const PUBLISHER_BY_SLUG: Record<string, string> = {
  "gnews-telegraaf": "De Telegraaf",
  "gnews-vi": "Voetbal International",
  "gnews-ad": "AD Sportwereld",
  "gnews-volkskrant": "de Volkskrant",
  "gnews-parool": "Het Parool",
};

async function enrichItems(force: boolean) {
  const supabase = createServiceClient();
  const start = Date.now();

  // Items zonder afbeelding waarvan het artikel simpelweg geen og:image heeft
  // (of de fetch faalt) zouden anders bij élke run opnieuw vooraan staan en
  // met hun timeouts het budget opeten, zodat oudere items nooit aan de
  // beurt komen. Het retry-venster maakt de backfill convergent: elke poging
  // zet enriched_at, en pas na RETRY_WINDOW_HOURS doet zo'n item weer mee.
  const retryCutoff = new Date(Date.now() - RETRY_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("raw_items")
    .select("id, url, body, language, publisher_name, image_url, enriched_at, sources(slug, fetch_method)")
    .not("topic_id", "is", null);
  if (!force) {
    // image_url.like.data:* vangt lazy-load-placeholders (data-URI's) die een
    // eerdere extractie als afbeelding opsloeg — die rijen zouden anders
    // buiten alle criteria vallen en nooit meer hersteld worden.
    query = query.or(
      `enriched_at.is.null,url.ilike.%news.google.com%,image_url.like.data:*,and(image_url.is.null,enriched_at.lt.${retryCutoff})`
    );
  }
  // Op fetched_at aflopend sorteren zou bij een backlog groter dan MAX_ITEMS
  // permanent dezelfde (nieuwste) kandidaten bovenaan houden en de oudste
  // kapotte items nooit meer bereiken, ongeacht hoe vaak deze route draait.
  // Op enriched_at oplopend (nooit-verrijkt eerst) sorteren garandeert dat elke
  // run de langst-wachtende items oppakt, zodat de backlog over meerdere runs
  // altijd convergeert.
  const { data: items, error } = await query
    .order("enriched_at", { ascending: true, nullsFirst: true })
    .limit(MAX_ITEMS);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;
  let resolved = 0;
  let stillGoogle = 0;
  let imagesFilled = 0;
  let failures = 0;

  const enrichOne = async (item: NonNullable<typeof items>[number]) => {
    const source = item.sources as unknown as { slug?: string; fetch_method?: string } | null;
    const wasGoogle = isGoogleNewsUrl(item.url);
    // Herstelmodus: intro's opnieuw extraheren voor NL-items van
    // scrape-bronnen (daar kwam de body sowieso van de artikelpagina of een
    // kaal lijstsnippet) en voor korte bodies (snippets of misextracties).
    // Lange feed-teksten (content:encoded) blijven staan.
    const forceIntro =
      force &&
      item.language === "nl" &&
      (source?.fetch_method === "scrape" || (item.body?.length ?? 0) < 500);

    // Placeholder-junk (data-URI's van lazy-loading) telt als "geen
    // afbeelding": anders sluit enriched_at deze rijen kort en worden ze
    // nooit hersteld.
    const hadUsableImage = isUsableImageUrl(item.image_url);

    try {
      const result = await enrichRawItem(
        supabase,
        {
          id: item.id,
          url: item.url,
          body: item.body,
          // Site-specifieke gnews-bronnen hebben een vaste publisher; zo klopt
          // de weergavenaam ook als de URL-herleiding faalt.
          publisher_name:
            item.publisher_name ?? (source?.slug ? PUBLISHER_BY_SLUG[source.slug] ?? null : null),
          image_url: item.image_url,
          // Opnieuw verrijken als de URL nog op Google News wijst, de
          // afbeelding ontbreekt (items van vóór de image-ondersteuning) of
          // de herstelmodus actief is.
          enriched_at: wasGoogle || !hadUsableImage || forceIntro ? null : item.enriched_at,
        },
        // Niet-NL items zijn al vertaald: hun body niet overschrijven met een
        // vers gescrapete (buitenlandse) intro.
        { skipIntro: item.language !== "nl", forceIntro }
      );

      processed++;
      if (!hadUsableImage && isUsableImageUrl(result.imageUrl)) imagesFilled++;
      if (wasGoogle) {
        if (isGoogleNewsUrl(result.url)) stillGoogle++;
        else resolved++;
      }
    } catch (err) {
      failures++;
      console.error(`Verrijken van ${item.id} mislukt, ga door met de rest:`, err);
    }
  };

  // Parallel in kleine batches: de fetches zijn I/O-bound en zo past een
  // volle kandidatenlijst ruim binnen het tijdsbudget.
  const all = items ?? [];
  for (let i = 0; i < all.length; i += ENRICH_CONCURRENCY) {
    if (Date.now() - start > TIME_BUDGET_MS) break;
    await Promise.all(all.slice(i, i + ENRICH_CONCURRENCY).map(enrichOne));
  }

  return NextResponse.json({
    candidates: all.length,
    processed,
    resolved,
    stillGoogle,
    imagesFilled,
    failures,
    remaining: all.length - processed - failures,
  });
}
