import type { SupabaseClient } from "@supabase/supabase-js";
import { eersteElftal, jongAjax } from "@/lib/mock/players";

const AJAX_SOURCE_SLUGS = new Set([
  "ajax-nl",
  "ajax-supporters",
  "ajax-freaks",
  "ajax-showtime",
  "ajax-daily",
  "reddit-ajax",
  "football-oranje",
  "gnews-telegraaf",
  "gnews-vi",
  "gnews-ad",
  "gnews-volkskrant",
  "gnews-parool",
  "gnews-ajax-es",
  "gnews-ajax-it",
  "gnews-ajax-de",
  "gnews-ajax-fr",
  "gnews-ajax-pt",
  "gnews-ajax-br",
  "gnews-ajax-tr",
]);

const KEYWORDS = [
  "ajax",
  "afc ajax",
  "ajax amsterdam",
  "johan cruijff arena",
  "johan cruyff arena",
  "de toekomst",
  "eredivisie",
  "knvb beker",
  ...eersteElftal.map((p) => p.name.split(" ").slice(-1)[0]),
  ...jongAjax.map((p) => p.name.split(" ").slice(-1)[0]),
].map((k) => k.toLowerCase());

export function isRelevant(title: string, body: string | null): boolean {
  const text = `${title} ${body ?? ""}`.toLowerCase();
  return KEYWORDS.some((keyword) => text.includes(keyword));
}

export async function processRawItem(supabase: SupabaseClient, rawItemId: string) {
  const { data: rawItem, error } = await supabase
    .from("raw_items")
    .select("title, body, language, sources(slug)")
    .eq("id", rawItemId)
    .single();
  if (error) throw error;

  const source = rawItem.sources as unknown as { slug: string } | null;
  const isAjaxSource = source?.slug ? AJAX_SOURCE_SLUGS.has(source.slug) : false;

  if (!isAjaxSource && !isRelevant(rawItem.title, rawItem.body)) {
    await supabase.from("raw_items").update({ processing_status: "skipped" }).eq("id", rawItemId);
    return { relevant: false };
  }

  const needsTranslation = rawItem.language !== "nl";
  const jobType = needsTranslation ? "translate" : "merge";
  await supabase.from("jobs").insert({ type: jobType, payload: { rawItemId } });
  return { relevant: true };
}
