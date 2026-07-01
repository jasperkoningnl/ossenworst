import type { SupabaseClient } from "@supabase/supabase-js";
import { sourceSeeds } from "./sources.seed";

/**
 * Synct de statische sources.seed.ts naar de `sources`-tabel. Bestaande rijen
 * (op slug) worden alleen aangevuld, niet overschreven op `enabled`, zodat
 * handmatige activatie via de admin-interface niet wordt teruggedraaid door
 * een herhaalde seed-run.
 */
export async function upsertSources(supabase: SupabaseClient) {
  const { data: existing } = await supabase.from("sources").select("slug, enabled");
  const enabledBySlug = new Map((existing ?? []).map((row) => [row.slug, row.enabled]));

  const rows = sourceSeeds.map((seed) => ({
    name: seed.name,
    slug: seed.slug,
    url: seed.url,
    tier: seed.tier,
    country: seed.country,
    language: seed.language,
    fetch_method: seed.fetchMethod,
    feed_url: seed.feedUrl,
    enabled: enabledBySlug.get(seed.slug) ?? seed.enabled,
  }));

  return supabase.from("sources").upsert(rows, { onConflict: "slug" });
}
