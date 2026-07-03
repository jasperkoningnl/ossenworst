import type { SupabaseClient } from "@supabase/supabase-js";
import { isGoogleNewsUrl, publisherNameFromUrl, resolveGoogleNewsUrl } from "./google-news";
import { fetchArticleIntro } from "./article-intro";
import { truncate } from "@/lib/utils/text";

/**
 * Eenmalige verrijking van een relevant raw_item, vlak vóór de (betaalde)
 * vertaal-/merge-stap:
 * 1. Google News-redirect-URL herleiden naar de originele publisher-URL.
 * 2. Als de feed weinig/geen tekst meegaf: de intro (lead) van de artikelpagina
 *    zelf ophalen, zodat de UI de openingstekst van de bron kan tonen.
 *
 * Best-effort en idempotent: fouten zijn niet fataal (het item houdt dan zijn
 * feed-gegevens) en `enriched_at` voorkomt dat retries de fetches herhalen.
 */

// Onder deze lengte is een feed-description te mager als intro en proberen we
// de artikelpagina zelf.
const MIN_BODY_CHARS = 200;
const MAX_BODY_CHARS = 1200;

export interface EnrichableRawItem {
  id: string;
  url: string;
  body: string | null;
  publisher_name: string | null;
  image_url: string | null;
  enriched_at: string | null;
}

export interface EnrichedFields {
  url: string;
  body: string | null;
}

export async function enrichRawItem(
  supabase: SupabaseClient,
  rawItem: EnrichableRawItem,
  options: {
    skipIntro?: boolean;
    /**
     * Herstelmodus: haal de intro opnieuw van de artikelpagina en verváng de
     * huidige body door de verse extractie — voor items waarvan een eerdere
     * (slechtere) extractie verkeerde tekst opsloeg.
     */
    forceIntro?: boolean;
  } = {}
): Promise<EnrichedFields> {
  if (rawItem.enriched_at) {
    return { url: rawItem.url, body: rawItem.body };
  }

  let url = rawItem.url;
  let body = rawItem.body;
  let publisherName = rawItem.publisher_name;
  let imageUrl = rawItem.image_url;
  const cameViaGoogleNews = isGoogleNewsUrl(rawItem.url);

  if (cameViaGoogleNews) {
    try {
      const resolved = await resolveGoogleNewsUrl(url);
      if (resolved) url = resolved;
    } catch (err) {
      console.error(`Google News-URL herleiden mislukt voor ${rawItem.id}:`, err);
    }
  }

  const needsIntro =
    !options.skipIntro && (options.forceIntro || !body || body.length < MIN_BODY_CHARS);
  // Zonder herleide URL heeft fetchen geen zin: de Google News-pagina zelf
  // bevat geen artikeltekst.
  if ((needsIntro || !imageUrl) && !isGoogleNewsUrl(url)) {
    try {
      const article = await fetchArticleIntro(url);
      if (
        needsIntro &&
        article.intro &&
        (options.forceIntro || article.intro.length > (body?.length ?? 0))
      ) {
        body = truncate(article.intro, MAX_BODY_CHARS);
      }
      if (article.siteName && !publisherName) publisherName = article.siteName;
      if (article.imageUrl && !imageUrl) imageUrl = article.imageUrl;
    } catch (err) {
      console.error(`Artikel-intro ophalen mislukt voor ${rawItem.id}:`, err);
    }
  }

  // Laatste vangnet voor de weergavenaam van Google News-items: de hostname
  // van de herleide URL ("telegraaf.nl"). Directe bronnen houden gewoon hun
  // bronnaam en krijgen géén publisher_name.
  if (cameViaGoogleNews && !publisherName) publisherName = publisherNameFromUrl(url);

  await supabase
    .from("raw_items")
    .update({
      url,
      body,
      publisher_name: publisherName,
      image_url: imageUrl,
      enriched_at: new Date().toISOString(),
    })
    .eq("id", rawItem.id);

  return { url, body };
}
