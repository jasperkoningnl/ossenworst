import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/lib/types/database";
import { fallbackPlayers } from "./squad.seed";

/**
 * Laadt de selectie uit de `players`-tabel; valt terug op de statische seed
 * zolang die tabel leeg is. `fromDb` bepaalt of stemmen/opstellen kan (de
 * FK's op transfer_votes/user_lineups vereisen echte database-id's).
 */
export async function loadPlayers(
  supabase: SupabaseClient
): Promise<{ players: Player[]; fromDb: boolean }> {
  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("is_active", true)
    .order("shirt_number", { ascending: true });

  if (data && data.length > 0) {
    return { players: data as Player[], fromDb: true };
  }
  return { players: fallbackPlayers, fromDb: false };
}
