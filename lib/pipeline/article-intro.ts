import * as cheerio from "cheerio";

/**
 * Haalt de intro (lead/eerste alinea's) van een artikelpagina op, zodat de
 * feed de echte openingstekst van de bron kan tonen i.p.v. een (te summiere)
 * AI-samenvatting. Bij paywalled sites zijn kop + lead vrijwel altijd publiek;
 * we nemen bewust alleen de eerste alinea's mee en linken door voor de rest.
 */

const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT = "OssenworstManager/1.0 (+https://ossenworst.nl)";
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
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: "follow",
  });
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) {
    return { intro: null, siteName: null, imageUrl: null };
  }

  const $ = cheerio.load(await res.text());

  const siteName = $('meta[property="og:site_name"]').attr("content")?.trim() || null;
  const imageUrl =
    $('meta[property="og:image"]').attr("content")?.trim() ||
    $('meta[name="twitter:image"]').attr("content")?.trim() ||
    null;
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
