import type { SupabaseClient } from "@supabase/supabase-js";
import { translateToNl } from "@/lib/claude/translate";

/**
 * Vertaalt een niet-NL raw_item naar het Nederlands, slaat het resultaat op in
 * de translations-cache, overschrijft title/body op het raw_item met de
 * vertaling zodat merge/summarize in het NL werken, en enqueued een merge-job.
 */
export async function translateRawItem(supabase: SupabaseClient, rawItemId: string) {
  const { data: existing } = await supabase
    .from("translations")
    .select("id")
    .eq("raw_item_id", rawItemId)
    .eq("target_lang", "nl")
    .maybeSingle();

  if (existing) {
    await supabase.from("jobs").insert({ type: "merge", payload: { rawItemId } });
    return { cached: true };
  }

  const { data: rawItem, error } = await supabase
    .from("raw_items")
    .select("title, body, language")
    .eq("id", rawItemId)
    .single();
  if (error) throw error;

  const result = await translateToNl(rawItem.title, rawItem.body, rawItem.language);

  await supabase.from("translations").insert({
    raw_item_id: rawItemId,
    target_lang: "nl",
    translated_title: result.translatedTitle,
    translated_body: result.translatedBody,
    model: "claude-haiku-4-5-20251001",
  });

  await supabase
    .from("raw_items")
    .update({ title: result.translatedTitle, body: result.translatedBody })
    .eq("id", rawItemId);

  await supabase.from("jobs").insert({ type: "merge", payload: { rawItemId } });

  return { cached: false };
}
