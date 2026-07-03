export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

// Named entities die in (niet-Engelstalige) nieuwsfeeds opduiken. Een kleine
// lijst bleek in de praktijk niet genoeg — vandaar deze ruime tabel plus
// numerieke/hex-decoding in decodeEntities().
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…", lsquo: "‘", rsquo: "’",
  ldquo: "“", rdquo: "”", laquo: "«", raquo: "»",
  euro: "€", pound: "£", dollar: "$", cent: "¢", copy: "©", reg: "®", trade: "™",
  deg: "°", plusmn: "±", frac12: "½", frac14: "¼", times: "×", middot: "·", bull: "•", sect: "§",
  aacute: "á", agrave: "à", acirc: "â", auml: "ä", aring: "å", atilde: "ã", aelig: "æ",
  eacute: "é", egrave: "è", ecirc: "ê", euml: "ë",
  iacute: "í", igrave: "ì", icirc: "î", iuml: "ï",
  oacute: "ó", ograve: "ò", ocirc: "ô", ouml: "ö", otilde: "õ", oslash: "ø",
  uacute: "ú", ugrave: "ù", ucirc: "û", uuml: "ü",
  yacute: "ý", yuml: "ÿ", ccedil: "ç", ntilde: "ñ", szlig: "ß",
  Aacute: "Á", Agrave: "À", Acirc: "Â", Auml: "Ä", Aring: "Å", Atilde: "Ã", AElig: "Æ",
  Eacute: "É", Egrave: "È", Ecirc: "Ê", Euml: "Ë",
  Iacute: "Í", Igrave: "Ì", Icirc: "Î", Iuml: "Ï",
  Oacute: "Ó", Ograve: "Ò", Ocirc: "Ô", Ouml: "Ö", Otilde: "Õ", Oslash: "Ø",
  Uacute: "Ú", Ugrave: "Ù", Ucirc: "Û", Uuml: "Ü",
  Ccedil: "Ç", Ntilde: "Ñ",
};

export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (match, name) => NAMED_ENTITIES[name] ?? match);
}

/** HTML-fragment (feed-description, content:encoded) naar leesbare platte tekst. */
export function htmlToText(html: string): string {
  const withoutBlocks = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(withoutBlocks)
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}
