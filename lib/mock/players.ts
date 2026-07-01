import type { Player } from "@/lib/types/database";

/**
 * Mock-selectie 25/26, overgenomen uit design/OssenworstApp.dc.html
 * (`eerste`/`jong`). Vervangen door een echte fetch op `players` zodra de
 * sync_squad-job (Fase 3) draait.
 */
function marketValueToNumber(v: string): number {
  const num = parseFloat(v.replace("€", "").replace(",", ".").replace("M", ""));
  return Math.round(num * 1_000_000);
}

function birthDateFromAge(age: number): string {
  return `${2026 - age}-01-01`;
}

function contractUntilFromShortYear(shortYear: string): string {
  return `20${shortYear}-06-30`;
}

interface RawPlayer {
  n: number;
  name: string;
  pos: "D" | "V" | "M" | "A";
  nat: string;
  age: number;
  c: string;
  v: string;
  exp?: boolean;
}

function toPlayer(p: RawPlayer, squad: Player["squad"]): Player {
  return {
    id: `player-${p.n}-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    external_id: null,
    name: p.name,
    photo_url: null,
    shirt_number: p.n,
    position: p.pos,
    birth_date: birthDateFromAge(p.age),
    nationality: p.nat,
    contract_until: contractUntilFromShortYear(p.c),
    market_value: marketValueToNumber(p.v),
    squad,
    is_active: true,
    updated_at: "2026-06-29T00:00:00.000Z",
  };
}

const eersteRaw: RawPlayer[] = [
  { n: 22, name: "Remko Pasveer", pos: "D", nat: "NED", age: 42, c: "26", v: "€0,3M", exp: true },
  { n: 1, name: "Vítězslav Jaroš", pos: "D", nat: "CZE", age: 24, c: "26", v: "€4,0M", exp: true },
  { n: 2, name: "Anton Gaaei", pos: "V", nat: "DEN", age: 23, c: "28", v: "€7,0M" },
  { n: 5, name: "Owen Wijndal", pos: "V", nat: "NED", age: 26, c: "27", v: "€4,5M" },
  { n: 4, name: "Ko Itakura", pos: "V", nat: "JPN", age: 29, c: "29", v: "€14M" },
  { n: 15, name: "Josip Šutalo", pos: "V", nat: "CRO", age: 25, c: "28", v: "€18M" },
  { n: 31, name: "Youri Baas", pos: "V", nat: "NED", age: 22, c: "28", v: "€9,0M" },
  { n: 6, name: "Sivert Mannsverk", pos: "M", nat: "NOR", age: 23, c: "28", v: "€8,0M" },
  { n: 8, name: "Kenneth Taylor", pos: "M", nat: "NED", age: 24, c: "27", v: "€22M" },
  { n: 20, name: "Branco v.d. Boomen", pos: "M", nat: "NED", age: 30, c: "26", v: "€3,0M", exp: true },
  { n: 10, name: "Oscar Gloukh", pos: "M", nat: "ISR", age: 22, c: "29", v: "€20M" },
  { n: 14, name: "Kian Fitz-Jim", pos: "M", nat: "NED", age: 22, c: "27", v: "€6,0M" },
  { n: 21, name: "Davy Klaassen", pos: "M", nat: "NED", age: 33, c: "26", v: "€2,0M", exp: true },
  { n: 7, name: "Steven Berghuis", pos: "A", nat: "NED", age: 34, c: "26", v: "€2,5M", exp: true },
  { n: 11, name: "Mika Godts", pos: "A", nat: "BEL", age: 20, c: "28", v: "€15M" },
  { n: 9, name: "Wout Weghorst", pos: "A", nat: "NED", age: 33, c: "26", v: "€3,0M", exp: true },
  { n: 30, name: "Bertrand Traoré", pos: "A", nat: "BFA", age: 30, c: "26", v: "€4,0M", exp: true },
  { n: 18, name: "Carlos Forbs", pos: "A", nat: "POR", age: 21, c: "29", v: "€12M" },
];

const jongRaw: RawPlayer[] = [
  { n: 45, name: "Jaydon Banel", pos: "A", nat: "NED", age: 20, c: "26", v: "€1,2M", exp: true },
  { n: 38, name: "Don-Angelo Konadu", pos: "A", nat: "NED", age: 20, c: "27", v: "€0,8M" },
  { n: 51, name: "Rio den Haan", pos: "M", nat: "NED", age: 19, c: "26", v: "€0,5M", exp: true },
  { n: 55, name: "Sean Steur", pos: "M", nat: "NED", age: 19, c: "27", v: "€1,0M" },
  { n: 62, name: "Aaron Bouwman", pos: "V", nat: "NED", age: 18, c: "27", v: "€0,6M" },
  { n: 48, name: "Tristan Gooijer", pos: "V", nat: "NED", age: 20, c: "26", v: "€0,7M", exp: true },
];

export const eersteElftal: Player[] = eersteRaw.map((p) => toPlayer(p, "first"));
export const jongAjax: Player[] = jongRaw.map((p) => toPlayer(p, "jong"));

export function squadValue(players: Player[]): string {
  const total = players.reduce((sum, p) => sum + (p.market_value ?? 0), 0);
  return `€${Math.round(total / 1_000_000)}M`;
}

export function findPlayer(name: string): Player | undefined {
  return [...eersteElftal, ...jongAjax].find((p) => p.name === name);
}
