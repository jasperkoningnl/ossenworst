import { findPlayer } from "./players";

/**
 * Formatie-slots gespiegeld aan supabase/migrations/20260701000001_seed_formations.sql
 * (dezelfde x/y-coördinaten). Vervangen door een echte `GET /api/formations`-
 * fetch in Fase 3; de stem-percentages zijn mock (`GET /api/aggregates/lineup`).
 */
export interface PitchSlot {
  id: string;
  label: string;
  x: number;
  y: number;
}

export const FORMATION_OPTIONS = ["4-3-3", "4-2-3-1", "3-5-2"] as const;
export type FormationOption = (typeof FORMATION_OPTIONS)[number];

export const formationSlots: Record<FormationOption, PitchSlot[]> = {
  "4-3-3": [
    { id: "gk", label: "Doel", x: 50, y: 92 },
    { id: "rb", label: "RB", x: 82, y: 72 },
    { id: "rcb", label: "RCB", x: 60, y: 78 },
    { id: "lcb", label: "LCB", x: 40, y: 78 },
    { id: "lb", label: "LB", x: 18, y: 72 },
    { id: "rcm", label: "RCM", x: 68, y: 50 },
    { id: "cm", label: "CM", x: 50, y: 56 },
    { id: "lcm", label: "LCM", x: 32, y: 50 },
    { id: "rw", label: "RW", x: 80, y: 22 },
    { id: "st", label: "ST", x: 50, y: 14 },
    { id: "lw", label: "LW", x: 20, y: 22 },
  ],
  "4-2-3-1": [
    { id: "gk", label: "Doel", x: 50, y: 92 },
    { id: "rb", label: "RB", x: 82, y: 72 },
    { id: "rcb", label: "RCB", x: 60, y: 78 },
    { id: "lcb", label: "LCB", x: 40, y: 78 },
    { id: "lb", label: "LB", x: 18, y: 72 },
    { id: "rdm", label: "RDM", x: 62, y: 58 },
    { id: "ldm", label: "LDM", x: 38, y: 58 },
    { id: "ram", label: "RAM", x: 78, y: 32 },
    { id: "cam", label: "CAM", x: 50, y: 30 },
    { id: "lam", label: "LAM", x: 22, y: 32 },
    { id: "st", label: "ST", x: 50, y: 14 },
  ],
  "3-5-2": [
    { id: "gk", label: "Doel", x: 50, y: 92 },
    { id: "rcb", label: "RCB", x: 68, y: 78 },
    { id: "cb", label: "CB", x: 50, y: 80 },
    { id: "lcb", label: "LCB", x: 32, y: 78 },
    { id: "rwb", label: "RWB", x: 88, y: 52 },
    { id: "rcm", label: "RCM", x: 62, y: 52 },
    { id: "cm", label: "CM", x: 50, y: 56 },
    { id: "lcm", label: "LCM", x: 38, y: 52 },
    { id: "lwb", label: "LWB", x: 12, y: 52 },
    { id: "rst", label: "RST", x: 60, y: 16 },
    { id: "lst", label: "LST", x: 40, y: 16 },
  ],
};

/** Mock-consensus voor 4-3-3, overgenomen uit design (`pitchData`). */
const pitchAssignments433: Record<string, { player: string; pct: number }> = {
  gk: { player: "Remko Pasveer", pct: 71 },
  rb: { player: "Anton Gaaei", pct: 54 },
  rcb: { player: "Ko Itakura", pct: 63 },
  lcb: { player: "Josip Šutalo", pct: 70 },
  lb: { player: "Owen Wijndal", pct: 58 },
  lcm: { player: "Kenneth Taylor", pct: 81 },
  cm: { player: "Sivert Mannsverk", pct: 66 },
  rcm: { player: "Oscar Gloukh", pct: 74 },
  rw: { player: "Carlos Forbs", pct: 49 },
  st: { player: "Wout Weghorst", pct: 41 },
  lw: { player: "Mika Godts", pct: 69 },
};

export interface PitchAssignment extends PitchSlot {
  shirtNumber: number | null;
  playerName: string;
  pct: number;
}

export function getPitchAssignments(formation: FormationOption): PitchAssignment[] {
  if (formation !== "4-3-3") {
    // Alleen 4-3-3 heeft mock-consensusdata uit het design; overige formaties
    // tonen de lege slots totdat er echte stemdata is (Fase 3).
    return formationSlots[formation].map((slot) => ({ ...slot, shirtNumber: null, playerName: "—", pct: 0 }));
  }
  return formationSlots["4-3-3"].map((slot) => {
    const assignment = pitchAssignments433[slot.id];
    const player = assignment ? findPlayer(assignment.player) : undefined;
    return {
      ...slot,
      shirtNumber: player?.shirt_number ?? null,
      playerName: player?.name.split(" ").slice(-1)[0] ?? "—",
      pct: assignment?.pct ?? 0,
    };
  });
}

export interface ConsensusEntry {
  positionLabel: string;
  playerName: string;
  pct: number;
}

export const consensusData: ConsensusEntry[] = [
  { positionLabel: "SPITS", playerName: "Weghorst", pct: 41 },
  { positionLabel: "SPELMAKER (10)", playerName: "Gloukh", pct: 74 },
  { positionLabel: "CONTROLEUR (6)", playerName: "Mannsverk", pct: 66 },
  { positionLabel: "LINKSBUITEN", playerName: "Godts", pct: 69 },
  { positionLabel: "DOEL", playerName: "Pasveer", pct: 71 },
];
