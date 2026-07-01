import type { ConfidenceLevel, TopicCategory } from "@/lib/types/enums";

/** Categoriekleuren 1:1 uit design/OssenworstApp.dc.html (`cats`). */
export const CATEGORY_COLORS: Record<TopicCategory, string> = {
  TRANSFER: "#D2122E",
  STAF: "#9B6CF0",
  CLUB: "#C2C8D2",
  EREDIVISIE: "#27A6C4",
  "EX-SPELER": "#E0A416",
  WEDSTRIJD: "#39B14E",
};

/** Tekstkleur op een categorie-chip: CLUB heeft een lichte achtergrond, dus donkere tekst. */
export function categoryTextColor(category: TopicCategory) {
  return category === "CLUB" ? "#0B0E13" : "#ffffff";
}

/** Betrouwbaarheidskleuren 1:1 uit design (`tiers`). PRAATPROGRAMMA hergebruikt --fg-label (theme-afhankelijk). */
export const CONFIDENCE_COLOR: Record<ConfidenceLevel, string> = {
  BEVESTIGD: "#39B14E",
  GERUCHT: "#E0A416",
  PRAATPROGRAMMA: "var(--fg-label)",
};

/** Bron-tier badge-kleuren (achtergrond/voorgrond) uit design (`tierBg`/`tierFg`). */
export function sourceTierColors(tier: 1 | 2 | 3) {
  if (tier === 1) return { bg: "#143620", fg: "#39B14E" };
  if (tier === 2) return { bg: "#3A2E0C", fg: "#E0A416" };
  return { bg: "#222831", fg: "var(--fg2)" };
}

/** Positiekleuren uit design (`posColor`): D=doel, V=verdediger, M=middenvelder, A=aanvaller. */
export const POSITION_COLORS: Record<string, string> = {
  D: "#E0A416",
  V: "#27A6C4",
  M: "#39B14E",
  A: "#D2122E",
};
