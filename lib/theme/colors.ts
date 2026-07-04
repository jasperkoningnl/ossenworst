import type { ConfidenceLevel, TopicCategory } from "@/lib/types/enums";

/** Categoriekleuren, afgestemd op het lichte rood/wit-thema (voldoende contrast op wit). */
export const CATEGORY_COLORS: Record<TopicCategory, string> = {
  TRANSFER: "#D2122E",
  STAF: "#6C46C8",
  CLUB: "#7d7462",
  EREDIVISIE: "#0F6E96",
  "EX-SPELER": "#9A6A06",
  WEDSTRIJD: "#1F8A3D",
  VROUWENVOETBAL: "#C23B7A",
};

/** NL-weergavelabels voor categorieën (de enum-namen zijn systeemtaal). */
export const CATEGORY_LABEL: Record<TopicCategory, string> = {
  TRANSFER: "Transfer",
  STAF: "Staf",
  CLUB: "Club",
  EREDIVISIE: "Eredivisie",
  "EX-SPELER": "Ex-speler",
  WEDSTRIJD: "Wedstrijd",
  VROUWENVOETBAL: "Vrouwenvoetbal",
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

/**
 * NL-weergavelabels voor betrouwbaarheid (de enum-namen zijn systeemtaal).
 * "PRAATPROGRAMMA" is backend-jargon en heet in de UI "Onbevestigd".
 */
export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  BEVESTIGD: "Bevestigd",
  GERUCHT: "Gerucht",
  PRAATPROGRAMMA: "Onbevestigd",
};

/** Positiekleuren: D=doel, V=verdediger, M=middenvelder, A=aanvaller. */
export const POSITION_COLORS: Record<string, string> = {
  D: "#9A6A06",
  V: "#0F6E96",
  M: "#1F8A3D",
  A: "#D2122E",
};
