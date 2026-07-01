/**
 * Mock-rankings en voorbeeldselectie, overgenomen uit design (`transferRankData`,
 * `wishRankData`). Vervangen door echte `GET /api/aggregates/transfers` /
 * `GET /api/aggregates/wishlist`-fetches in Fase 3.
 */
export interface TransferRankEntry {
  name: string;
  pct: number;
}

export const transferRank: TransferRankEntry[] = [
  { name: "Anton Gaaei", pct: 62 },
  { name: "Owen Wijndal", pct: 47 },
  { name: "Steven Berghuis", pct: 41 },
  { name: "Bertrand Traoré", pct: 36 },
  { name: "Branco v.d. Boomen", pct: 31 },
  { name: "Carlos Forbs", pct: 19 },
];

export interface WishRankEntry {
  name: string;
  club: string;
  pct: number;
}

export const wishRank: WishRankEntry[] = [
  { name: "M.-A. ter Stegen", club: "BARCELONA", pct: 34 },
  { name: "Dani Ceballos", club: "REAL MADRID", pct: 21 },
  { name: "Caio Henrique", club: "MONACO", pct: 12 },
  { name: "Julian Brandt", club: "DORTMUND", pct: 9 },
  { name: "Matías Galarza", club: "FAMALICÃO", pct: 7 },
  { name: "Yann Sommer", club: "INTER", pct: 5 },
];

/** Voorbeeld van "jouw huidige selectie" — puur visueel, nog niet aan Supabase gekoppeld. */
export const exampleOutVotes = [
  { shirtNumber: 2, name: "Anton Gaaei" },
  { shirtNumber: 7, name: "Steven Berghuis" },
];

export const exampleWishlist = [
  { name: "Marc-André ter Stegen", club: "BARCELONA", position: "D", age: 34, value: "€10M" },
  { name: "Dani Ceballos", club: "REAL MADRID", position: "M", age: 29, value: "€15M" },
];
