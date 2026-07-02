import type { SupabaseClient } from "@supabase/supabase-js";
import { translateToNl, TRANSLATE_MODEL } from "@/lib/claude/translate";

/**
 * Vertaalt een niet-NL raw_item naar het Nederlands, slaat het resultaat op in
 * de translations-cache, overschrijft title/body op het raw_item met de
 * vertaling zodat merge/summarize in het NL werken, en enqueued een merge-job.
 */
export async function translateRawItem(supabase: SupabaseClient, rawItemId: string) {
  const { data: existing } = await supabase
    .from("translations")
    .select("translated_title, translated_body")
    .eq("raw_item_id", rawItemId)
    .eq("target_lang", "nl")
    .maybeSingle();

  if (existing) {
    // Cache-hit kan ook betekenen: vorige run crashte ná het cachen maar vóór
    // het bijwerken van het raw_item. Pas de vertaling dus alsnog toe, anders
    // draait merge op de onvertaalde tekst.
    await supabase
      .from("raw_items")
      .update({ title: existing.translated_title, body: existing.translated_body })
      .eq("id", rawItemId);
    await supabase.from("jobs").insert({ type: "merge", payload: { rawItemId } });
    return { cached: true };
  }

  const { data: rawItem, error } = await supabase
    .from("raw_items")
    .select("title, body, language")
    .eq("id", rawItemId)
    .single();
  if (error) throw error;

  let translated = false;
  try {
    const result = await translateToNl(rawItem.title, rawItem.body, rawItem.language);

    await supabase.from("translations").insert({
      raw_item_id: rawItemId,
      target_lang: "nl",
      translated_title: result.translatedTitle,
      translated_body: result.translatedBody,
      model: TRANSLATE_MODEL,
    });

    await supabase
      .from("raw_items")
      .update({ title: result.translatedTitle, body: result.translatedBody })
      .eq("id", rawItemId);

    translated = true;
  } catch (err) {
    console.error(`Vertaling mislukt voor ${rawItemId}, ga door met originele tekst:`, err);
  }

  await supabase.from("jobs").insert({ type: "merge", payload: { rawItemId } });

  return { cached: false, translated };
}
