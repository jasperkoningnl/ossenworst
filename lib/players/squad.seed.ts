import type { Player } from "@/lib/types/database";
import type { SquadType } from "@/lib/types/enums";

/**
 * Statische selectie 25/26 als seed voor de `players`-tabel (en als fallback
 * voor de UI zolang die tabel nog niet geseed is). Wordt vervangen door de
 * sync_squad-job (API-Football / Transfermarkt-datasets) in een latere fase.
 */
export interface PlayerSeed {
  name: string;
  shirtNumber: number;
  position: "D" | "V" | "M" | "A";
  nationality: string;
  birthYear: number;
  contractUntil: string;
  marketValue: number;
  squad: SquadType;
}

function seed(
  squad: SquadType,
  rows: [number, string, PlayerSeed["position"], string, number, string, number][]
): PlayerSeed[] {
  return rows.map(([shirtNumber, name, position, nationality, birthYear, contractUntil, marketValue]) => ({
    name,
    shirtNumber,
    position,
    nationality,
    birthYear,
    contractUntil,
    marketValue,
    squad,
  }));
}

export const playerSeeds: PlayerSeed[] = [
  ...seed("first", [
    [22, "Remko Pasveer", "D", "NED", 1984, "2026-06-30", 300_000],
    [1, "Vítězslav Jaroš", "D", "CZE", 2002, "2026-06-30", 4_000_000],
    [2, "Anton Gaaei", "V", "DEN", 2003, "2028-06-30", 7_000_000],
    [5, "Owen Wijndal", "V", "NED", 2000, "2027-06-30", 4_500_000],
    [4, "Ko Itakura", "V", "JPN", 1997, "2029-06-30", 14_000_000],
    [15, "Josip Šutalo", "V", "CRO", 2000, "2028-06-30", 18_000_000],
    [31, "Youri Baas", "V", "NED", 2003, "2028-06-30", 9_000_000],
    [6, "Sivert Mannsverk", "M", "NOR", 2002, "2028-06-30", 8_000_000],
    [8, "Kenneth Taylor", "M", "NED", 2002, "2027-06-30", 22_000_000],
    [20, "Branco v.d. Boomen", "M", "NED", 1995, "2026-06-30", 3_000_000],
    [10, "Oscar Gloukh", "M", "ISR", 2004, "2029-06-30", 20_000_000],
    [14, "Kian Fitz-Jim", "M", "NED", 2003, "2027-06-30", 6_000_000],
    [21, "Davy Klaassen", "M", "NED", 1993, "2026-06-30", 2_000_000],
    [7, "Steven Berghuis", "A", "NED", 1991, "2026-06-30", 2_500_000],
    [11, "Mika Godts", "A", "BEL", 2005, "2028-06-30", 15_000_000],
    [9, "Wout Weghorst", "A", "NED", 1992, "2026-06-30", 3_000_000],
    [30, "Bertrand Traoré", "A", "BFA", 1995, "2026-06-30", 4_000_000],
    [18, "Carlos Forbs", "A", "POR", 2004, "2029-06-30", 12_000_000],
  ]),
  ...seed("jong", [
    [45, "Jaydon Banel", "A", "NED", 2005, "2026-06-30", 1_200_000],
    [38, "Don-Angelo Konadu", "A", "NED", 2006, "2027-06-30", 800_000],
    [51, "Rio den Haan", "M", "NED", 2006, "2026-06-30", 500_000],
    [55, "Sean Steur", "M", "NED", 2007, "2027-06-30", 1_000_000],
    [62, "Aaron Bouwman", "V", "NED", 2008, "2027-06-30", 600_000],
    [48, "Tristan Gooijer", "V", "NED", 2005, "2026-06-30", 700_000],
  ]),
];

/** Seed → Player-vorm zoals de UI die verwacht (zonder database-id). */
export function seedToPlayer(p: PlayerSeed): Player {
  return {
    id: `seed-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    external_id: null,
    name: p.name,
    photo_url: null,
    shirt_number: p.shirtNumber,
    position: p.position,
    birth_date: `${p.birthYear}-01-01`,
    nationality: p.nationality,
    contract_until: p.contractUntil,
    market_value: p.marketValue,
    squad: p.squad,
    is_active: true,
    updated_at: new Date(0).toISOString(),
  };
}

export const fallbackPlayers: Player[] = playerSeeds.map(seedToPlayer);

export function squadValue(players: Player[]): string {
  const total = players.reduce((sum, p) => sum + (p.market_value ?? 0), 0);
  return `€${Math.round(total / 1_000_000)}M`;
}
