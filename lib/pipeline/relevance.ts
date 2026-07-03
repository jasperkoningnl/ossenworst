import type { SupabaseClient } from "@supabase/supabase-js";
import { eersteElftal, jongAjax } from "@/lib/mock/players";

/**
 * Bronnen die per definitie over Ajax gaan (club- en fansites); alleen items
 * hiervan slaan de keyword-check over. Google News-queries horen hier bewust
 * NIET bij: die matchen losjes en leveren ook artikelen zonder Ajax-connectie
 * (gokpromoties, regionaal nieuws), dus die gaan gewoon door het filter.
 */
export const AJAX_SOURCE_SLUGS = new Set([
  "ajax-nl",
  "ajax-supporters",
  "ajax-freaks",
  "ajax-showtime",
  "ajax-daily",
  "reddit-ajax",
]);

// Bewust géén losse "eredivisie"/"knvb beker": die keywords lieten al het
// generieke competitienieuws door, terwijl artikelen die Ajax raken vrijwel
// altijd "Ajax" of een spelersnaam bevatten.
const CLUB_KEYWORDS = [
  "ajax",
  "аякс", // Russische bronnen (Sport-Express, Sports.ru) schrijven Ajax in Cyrillisch
  "johan cruijff arena",
  "johan cruyff arena",
  "de toekomst",
];

/**
 * Achternamen die ook gewone woorden of veelvoorkomende namen zijn (baas, haan,
 * steur; Taylor/Traoré dragen ook andere voetballers). Die matchen alleen als
 * volledige naam, anders vist het filter half niet-Ajax-nieuws binnen.
 */
const AMBIGUOUS_SURNAMES = new Set(["baas", "haan", "steur", "taylor", "traore"]);

/** lowercase + diacritics strippen, zodat "Šutalo" ook "sutalo" matcht (en andersom). */
function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PLAYER_KEYWORDS = [...eersteElftal, ...jongAjax].flatMap((p) => {
  const fullName = normalize(p.name);
  const surname = fullName.split(" ").slice(-1)[0];
  return AMBIGUOUS_SURNAMES.has(surname) ? [fullName] : [fullName, surname];
});

// Unicode-bewuste "woordgrenzen" i.p.v. \b: \b werkt niet rond niet-ASCII
// letters (Cyrillisch, letters met diacritics), substring-match ving juist
// te veel ("baas" in "wielrenbaas").
const KEYWORD_PATTERNS = [...CLUB_KEYWORDS.map(normalize), ...PLAYER_KEYWORDS].map(
  (keyword) =>
    new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(keyword)}(?![\\p{L}\\p{N}])`, "u")
);

export function isRelevant(title: string, body: string | null): boolean {
  const text = normalize(`${title} ${body ?? ""}`);
  return KEYWORD_PATTERNS.some((pattern) => pattern.test(text));
}

export async function processRawItem(supabase: SupabaseClient, rawItemId: string) {
  const { data: rawItem, error } = await supabase
    .from("raw_items")
    .select("title, body, language, sources(slug)")
    .eq("id", rawItemId)
    .single();
  if (error) throw error;

  const source = rawItem.sources as unknown as { slug: string } | null;
  const isAjaxSource = source?.slug ? AJAX_SOURCE_SLUGS.has(source.slug) : false;

  if (!isAjaxSource && !isRelevant(rawItem.title, rawItem.body)) {
    await supabase.from("raw_items").update({ processing_status: "skipped" }).eq("id", rawItemId);
    return { relevant: false };
  }

  const needsTranslation = rawItem.language !== "nl";
  const jobType = needsTranslation ? "translate" : "merge";
  await supabase.from("jobs").insert({ type: jobType, payload: { rawItemId } });
  return { relevant: true };
}
