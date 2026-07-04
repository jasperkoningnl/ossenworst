import * as cheerio from "cheerio";
import { isUsableImageUrl } from "@/lib/utils/image";

/**
 * Haalt de intro (lead/eerste alinea's) van een artikelpagina op, zodat de
 * feed de echte openingstekst van de bron kan tonen i.p.v. een (te summiere)
 * AI-samenvatting. Bij paywalled sites zijn kop + lead vrijwel altijd publiek;
 * we nemen bewust alleen de eerste alinea's mee en linken door voor de rest.
 */

const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT = "OssenworstManager/1.0 (+https://ossenworst.nl)";
// Sommige sites (Akamai/Cloudflare-botwalls, o.a. ajax.nl) geven 403 op
// bot-achtige UA's; een browser-UA als retry lost dat op — zelfde patroon
// als de feed-fetch in fetchers/rss.ts.
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const MAX_INTRO_CHARS = 800;
const MIN_PARAGRAPH_CHARS = 60;
// Alinea-oogst is pas betrouwbaar bij minstens deze totale lengte; daaronder
// is de kans groot dat we teasers of bijschriften te pakken hebben.
const MIN_STRONG_PARAGRAPHS_CHARS = 160;

// Alinea's die vrijwel zeker boilerplate zijn (cookiemuren, abonnee-teksten).
const BOILERPLATE_RE =
  /cookie|adverten|abonnee|abonnement|subscri|newsletter|nieuwsbrief|javascript|browser|privacy/i;

// Containers waarvan de tekst niet bij het artikel zelf hoort: navigatie,
// "lees ook"-kaarten, gerelateerde berichten, bijschriften. Alinea's hierin
// zijn teasers van ándere artikelen en vervuilen de intro.
const NON_ARTICLE_ANCESTORS =
  'a, aside, nav, footer, header, figure, figcaption, [class*="related"], [class*="teaser"], ' +
  '[class*="card"], [class*="recommend"], [class*="read-more"], [class*="lees-ook"], ' +
  '[class*="widget"], [class*="sidebar"], [class*="comment"]';

export interface ArticleIntro {
  intro: string | null;
  siteName: string | null;
  imageUrl: string | null;
}

// Bestandsnaam-patronen die vrijwel nooit de hoofdafbeelding zijn: logo's,
// iconen — de <img>-fallback zou deze anders per ongeluk als
// artikelafbeelding oppikken. Pixels/spacers/placeholders vangt
// isUsableImageUrl al af.
const NON_CONTENT_IMAGE_RE = /logo|icon|avatar|sprite|favicon/i;

function resolveMaybeRelative(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

/**
 * Eerste bruikbare <img> binnen de artikeltekst — laatste redmiddel als de
 * pagina geen og:image/twitter:image heeft. Lazy-loading zet vaak een
 * transparante data-URI-placeholder in src en het echte beeld in
 * data-src/srcset; daarom alle attributen als kandidaten proberen en pas een
 * URL accepteren als hij door isUsableImageUrl komt.
 */
function firstContentImage($: cheerio.CheerioAPI, baseUrl: string): string | null {
  for (const el of $("article img, main img").toArray()) {
    const $el = $(el);
    if ($el.parents(NON_ARTICLE_ANCESTORS).length > 0) continue;
    const candidates = [
      $el.attr("src"),
      $el.attr("data-src"),
      $el.attr("data-lazy-src"),
      $el.attr("data-original"),
      $el.attr("srcset")?.split(/[\s,]+/)[0],
      $el.attr("data-srcset")?.split(/[\s,]+/)[0],
    ];
    for (const candidate of candidates) {
      if (!candidate || NON_CONTENT_IMAGE_RE.test(candidate)) continue;
      const resolved = resolveMaybeRelative(candidate, baseUrl);
      if (resolved && isUsableImageUrl(resolved)) return resolved;
    }
  }
  return null;
}

/** Afbeelding uit JSON-LD-structured data (schema.org NewsArticle/Article "image"). */
function imageFromJsonLd($: cheerio.CheerioAPI): string | null {
  for (const el of $('script[type="application/ld+json"]').toArray()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse($(el).contents().text());
    } catch {
      continue;
    }
    for (const node of Array.isArray(parsed) ? parsed : [parsed]) {
      const image = (node as { image?: unknown } | null)?.image;
      const url =
        typeof image === "string"
          ? image
          : Array.isArray(image)
            ? image.find((i) => typeof i === "string")
            : typeof (image as { url?: unknown })?.url === "string"
              ? (image as { url: string }).url
              : null;
      if (url && /^https?:\/\//.test(url)) return url;
    }
  }
  return null;
}

function collectParagraphs($: cheerio.CheerioAPI, selector: string): string {
  const parts: string[] = [];
  let total = 0;
  $(selector).each((_i, el) => {
    if (total >= MAX_INTRO_CHARS) return false;
    if ($(el).parents(NON_ARTICLE_ANCESTORS).length > 0) return;
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length < MIN_PARAGRAPH_CHARS || BOILERPLATE_RE.test(text)) return;
    parts.push(text);
    total += text.length;
  });
  return parts.join("\n\n");
}

export async function fetchArticleIntro(url: string): Promise<ArticleIntro> {
  const doFetch = (userAgent: string) =>
    fetch(url, {
      headers: { "User-Agent": userAgent, Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });

  let res = await doFetch(USER_AGENT);
  if (res.status === 403 || res.status === 429) {
    res = await doFetch(BROWSER_USER_AGENT);
  }
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) {
    return { intro: null, siteName: null, imageUrl: null };
  }

  const $ = cheerio.load(await res.text());

  const siteName = $('meta[property="og:site_name"]').attr("content")?.trim() || null;
  // og:image/twitter:image dekken bijna alle sites; ontbreken ze (bv. sommige
  // clubsites zonder social-meta), dan proberen we JSON-LD-structured data en
  // als laatste redmiddel de eerste echte artikelafbeelding in de HTML. Elke
  // kandidaat moet door isUsableImageUrl: ook meta-tags bevatten soms
  // placeholders of SVG-logo's.
  const baseUrl = res.url || url;
  const metaCandidates = [
    $('meta[property="og:image"]').attr("content"),
    $('meta[property="og:image:secure_url"]').attr("content"),
    $('meta[name="twitter:image"]').attr("content"),
    $('link[rel="image_src"]').attr("href"),
    imageFromJsonLd($),
  ];
  let imageUrl: string | null = null;
  for (const candidate of metaCandidates) {
    const resolved = candidate ? resolveMaybeRelative(candidate.trim(), baseUrl) : null;
    if (resolved && isUsableImageUrl(resolved)) {
      imageUrl = resolved;
      break;
    }
  }
  if (!imageUrl) imageUrl = firstContentImage($, baseUrl);
  const metaDescription =
    $('meta[property="og:description"]').attr("content")?.trim() ||
    $('meta[name="description"]').attr("content")?.trim() ||
    null;

  let paragraphs = collectParagraphs($, "article p");
  if (paragraphs.length < MIN_PARAGRAPH_CHARS) paragraphs = collectParagraphs($, "main p");
  if (paragraphs.length < MIN_PARAGRAPH_CHARS) paragraphs = collectParagraphs($, "p");

  // De echte openingsalinea's hebben de voorkeur, maar alleen bij een stevige
  // oogst: een magere oogst betekent meestal dat de bodytekst niet in <p>'s
  // staat en we per ongeluk losse fragmenten te pakken hebben. Dan is de door
  // de redactie geschreven meta-description (lead) betrouwbaarder.
  const intro =
    paragraphs.length >= MIN_STRONG_PARAGRAPHS_CHARS
      ? paragraphs.slice(0, MAX_INTRO_CHARS)
      : metaDescription || paragraphs || null;

  return { intro: intro || null, siteName, imageUrl };
}
