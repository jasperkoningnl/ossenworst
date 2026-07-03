/**
 * Herleidt Google News-redirect-URLs (news.google.com/rss/articles/CBMi…) naar
 * de originele publisher-URL, zodat de feed naar de oorspronkelijke bron linkt
 * i.p.v. naar Google News.
 *
 * Twee strategieën:
 * 1. Offline: het artikel-id is base64url-gecodeerd en bevat bij het oude
 *    formaat de originele URL letterlijk (gratis, geen netwerk).
 * 2. Netwerk-fallback voor het nieuwe formaat ("AU_yqL…"): de artikelpagina
 *    bevat een signature+timestamp waarmee Google's interne batchexecute-
 *    endpoint de echte URL teruggeeft.
 *
 * Beide zijn best-effort: bij elke afwijking geven we null terug en blijft de
 * Google News-link staan — beter een omweg-link dan een kapotte link.
 */

const ARTICLE_ID_RE = /news\.google\.com\/(?:rss\/articles|articles|read)\/([^?/]+)/;
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT = "OssenworstManager/1.0 (+https://ossenworst.nl)";

export function isGoogleNewsUrl(url: string): boolean {
  return ARTICLE_ID_RE.test(url);
}

/** Offline decodering van het oude id-formaat. null bij nieuw formaat of afwijkende bytes. */
export function decodeGoogleNewsUrl(url: string): string | null {
  const match = url.match(ARTICLE_ID_RE);
  if (!match) return null;

  let bytes: Buffer;
  try {
    bytes = Buffer.from(match[1], "base64url");
  } catch {
    return null;
  }

  // Verwachte omhulling: prefix 08 13 22, optionele suffix d2 01 00.
  if (bytes.length < 5 || bytes[0] !== 0x08 || bytes[1] !== 0x13 || bytes[2] !== 0x22) return null;
  let end = bytes.length;
  if (bytes[end - 3] === 0xd2 && bytes[end - 2] === 0x01 && bytes[end - 1] === 0x00) end -= 3;

  // Length-prefixed string (varint, 1 of 2 bytes).
  let start = 3;
  let length = bytes[start];
  if (length >= 0x80) {
    length = (bytes[start] & 0x7f) | (bytes[start + 1] << 7);
    start += 2;
  } else {
    start += 1;
  }
  if (start + length > end) return null;

  const decoded = bytes.subarray(start, start + length).toString("utf8");
  // Nieuw formaat: de payload is zelf weer een gecodeerd blob i.p.v. een URL.
  if (!/^https?:\/\//.test(decoded)) return null;
  return decoded;
}

/**
 * Netwerk-fallback voor het nieuwe id-formaat: haal signature/timestamp van de
 * artikelpagina en vraag de echte URL op via batchexecute.
 */
async function decodeViaBatchExecute(articleId: string): Promise<string | null> {
  const pageRes = await fetch(`https://news.google.com/rss/articles/${articleId}`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!pageRes.ok) return null;
  const html = await pageRes.text();

  const signature = html.match(/data-n-a-sg="([^"]+)"/)?.[1];
  const timestamp = html.match(/data-n-a-ts="([^"]+)"/)?.[1];
  if (!signature || !timestamp) return null;

  const innerReq = JSON.stringify([
    "garturlreq",
    [
      ["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1],
      "X", "X", 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0,
    ],
    articleId,
    Number(timestamp),
    signature,
  ]);
  const body = `f.req=${encodeURIComponent(JSON.stringify([[["Fbv4je", innerReq]]]))}`;

  const res = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": USER_AGENT,
    },
    body,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) return null;

  const text = await res.text();
  const payload = text.split("\n\n")[1];
  if (!payload) return null;
  const outer = JSON.parse(payload) as unknown[][];
  const inner = outer?.[0]?.[2];
  if (typeof inner !== "string") return null;
  const decoded = JSON.parse(inner) as unknown[];
  const resolved = decoded?.[1];
  return typeof resolved === "string" && /^https?:\/\//.test(resolved) ? resolved : null;
}

/** Volledige resolutie: eerst offline, dan netwerk. null als beide falen. */
export async function resolveGoogleNewsUrl(url: string): Promise<string | null> {
  const offline = decodeGoogleNewsUrl(url);
  if (offline) return offline;

  const match = url.match(ARTICLE_ID_RE);
  if (!match) return null;
  try {
    return await decodeViaBatchExecute(match[1]);
  } catch {
    return null;
  }
}
