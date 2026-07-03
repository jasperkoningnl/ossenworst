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

// Alinea's die vrijwel zeker boilerplate zijn (cookiemuren, abonnee-teksten).
const BOILERPLATE_RE =
  /cookie|adverten|abonnee|abonnement|subscri|newsletter|nieuwsbrief|javascript|browser|privacy/i;

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

  // De echte openingsalinea's hebben de voorkeur; de meta-description is
  // vaak alleen de eerste zin en dient als vangnet.
  const intro =
    paragraphs.length >= MIN_PARAGRAPH_CHARS * 2
      ? paragraphs.slice(0, MAX_INTRO_CHARS)
      : metaDescription;

  return { intro: intro || null, siteName, imageUrl };
}
