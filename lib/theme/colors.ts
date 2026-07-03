import type { ConfidenceLevel, TopicCategory } from "@/lib/types/enums";

/** Categoriekleuren, afgestemd op het lichte rood/wit-thema (voldoende contrast op wit). */
export const CATEGORY_COLORS: Record<TopicCategory, string> = {
  TRANSFER: "#D2122E",
  STAF: "#6C46C8",
  CLUB: "#7d7462",
  EREDIVISIE: "#0F6E96",
  "EX-SPELER": "#9A6A06",
  WEDSTRIJD: "#1F8A3D",
};

/** NL-weergavelabels voor categorieën (de enum-namen zijn systeemtaal). */
export const CATEGORY_LABEL: Record<TopicCategory, string> = {
  TRANSFER: "Transfer",
  STAF: "Staf",
  CLUB: "Club",
  EREDIVISIE: "Eredivisie",
  "EX-SPELER": "Ex-speler",
  WEDSTRIJD: "Wedstrijd",
};

/** Alle categorie-chips hebben een verzadigde achtergrond, dus witte tekst. */
export function categoryTextColor() {
  return "#ffffff";
}

/** Betrouwbaarheidskleuren (theme-afhankelijk via CSS-vars waar mogelijk). */
export const CONFIDENCE_COLOR: Record<ConfidenceLevel, string> = {
  BEVESTIGD: "var(--confirmed)",
  GERUCHT: "var(--rumor)",
  PRAATPROGRAMMA: "var(--fg-label)",
};

/** NL-weergavelabels voor betrouwbaarheid (de enum-namen zijn systeemtaal). */
export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  BEVESTIGD: "Bevestigd",
  GERUCHT: "Gerucht",
  PRAATPROGRAMMA: "Praatprogramma",
};

/** Bron-tier badge-kleuren (achtergrond/voorgrond), licht-thema-vriendelijk. */
export function sourceTierColors(tier: 1 | 2 | 3) {
  if (tier === 1) return { bg: "#e0f2e5", fg: "#166b30" };
  if (tier === 2) return { bg: "#f6ead0", fg: "#8a5d04" };
  return { bg: "#eceadf", fg: "var(--fg2)" };
}

/** Positiekleuren: D=doel, V=verdediger, M=middenvelder, A=aanvaller. */
export const POSITION_COLORS: Record<string, string> = {
  D: "#9A6A06",
  V: "#0F6E96",
  M: "#1F8A3D",
  A: "#D2122E",
};
