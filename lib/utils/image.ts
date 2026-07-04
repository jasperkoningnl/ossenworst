/**
 * Onderscheidt echte artikelafbeeldingen van placeholder-junk. Lazy-loading
 * zet vaak een minuscule transparante data-URI (of een spacer/pixel-URL) in
 * het src-attribuut terwijl het echte beeld in data-src/srcset staat; zulke
 * placeholders "laden" gewoon in de browser en glippen dus ook door een
 * onError-fallback heen. Daarom hard filteren op URL-vorm.
 */

// "1x1" en "blank" alleen als los token (begrensd door niet-alfanumeriek):
// als substring matchen ze ook legitieme media-ID's zoals ajax.nl's
// "/media/gc3fx1x1/thomas1920.jpg".
const JUNK_IMAGE_RE =
  /pixel|spacer|placeholder|doubleclick|feedburner|(^|[^0-9a-z])(1x1|blank)(?![0-9a-z])/i;

export function isUsableImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  // data:-URI's zijn per definitie lazy-load-placeholders; alleen echte
  // http(s)-URL's kunnen een artikelafbeelding zijn.
  if (!/^https?:\/\//i.test(url)) return false;
  if (/\.svg($|\?)/i.test(url)) return false;
  return !JUNK_IMAGE_RE.test(url);
}
