import type { SupabaseClient } from "@supabase/supabase-js";
import { playerSeeds } from "./squad.seed";

/**
 * Synct de statische spelers-seed naar de `players`-tabel (upsert op naam,
 * zie idx_players_name_unique). Draait mee met de "Seed sources"-workflow.
 */
export async function upsertPlayers(supabase: SupabaseClient) {
  const rows = playerSeeds.map((p) => ({
    name: p.name,
    shirt_number: p.shirtNumber,
    position: p.position,
    nationality: p.nationality,
    birth_date: `${p.birthYear}-01-01`,
    contract_until: p.contractUntil,
    market_value: p.marketValue,
    squad: p.squad,
    is_active: true,
    updated_at: new Date().toISOString(),
  }));

  return supabase.from("players").upsert(rows, { onConflict: "name" });
}
