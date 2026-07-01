import type { SupabaseClient } from "@supabase/supabase-js";
import { eersteElftal, jongAjax } from "@/lib/mock/players";

/**
 * Goedkope relevance-gate zonder Claude: clubnaam + achternamen van de
 * huidige selectie (hergebruikt uit lib/mock/players.ts i.p.v. een aparte
 * lijst). Fase 3 vervangt dit door een live squad-sync; deze lijst is dan
 * ook meteen bijgewerkt.
 */
const KEYWORDS = [
  "ajax",
  ...eersteElftal.map((p) => p.name.split(" ").slice(-1)[0]),
  ...jongAjax.map((p) => p.name.split(" ").slice(-1)[0]),
].map((k) => k.toLowerCase());

export function isRelevant(title: string, body: string | null): boolean {
  const text = `${title} ${body ?? ""}`.toLowerCase();
  return KEYWORDS.some((keyword) => text.includes(keyword));
}

/** Bepaalt relevantie van een raw_item en enqueued een merge-job of markeert het als skipped. */
export async function processRawItem(supabase: SupabaseClient, rawItemId: string) {
  const { data: rawItem, error } = await supabase
    .from("raw_items")
    .select("title, body")
    .eq("id", rawItemId)
    .single();
  if (error) throw error;

  if (!isRelevant(rawItem.title, rawItem.body)) {
    await supabase.from("raw_items").update({ processing_status: "skipped" }).eq("id", rawItemId);
    return { relevant: false };
  }

  await supabase.from("jobs").insert({ type: "merge", payload: { rawItemId } });
  return { relevant: true };
}
