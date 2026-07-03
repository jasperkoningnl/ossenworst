import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enrichRawItem } from "@/lib/pipeline/enrich";
import { isGoogleNewsUrl } from "@/lib/pipeline/google-news";

export const maxDuration = 300;

const TIME_BUDGET_MS = 250_000;
const MAX_ITEMS = 300;

/**
 * Backfill: verrijkt raw_items die al aan een topic hangen maar vóór de
 * verrijkingsstap zijn verwerkt (of waarvan de Google News-URL nog niet
 * herleid is). Herstelt zo de bronlinks en publishernamen van bestaand
 * materiaal; nieuwe items worden gewoon in de pipeline verrijkt.
 *
 * Idempotent en veilig her-draaibaar: al-herleide items worden overgeslagen,
 * items waarvan de herleiding eerder faalde worden opnieuw geprobeerd.
 *
 *   curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \
 *     https://ossenworst.vercel.app/api/admin/enrich-items
 */
export async function POST(request: Request) {
  const expected = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    return await enrichItems();
  } catch (err) {
    console.error("enrich-items faalde:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/** Vaste publishernamen voor de site-specifieke Google News-bronnen. */
const PUBLISHER_BY_SLUG: Record<string, string> = {
  "gnews-telegraaf": "De Telegraaf",
  "gnews-vi": "Voetbal International",
  "gnews-ad": "AD Sportwereld",
  "gnews-volkskrant": "de Volkskrant",
  "gnews-parool": "Het Parool",
};

async function enrichItems() {
  const supabase = createServiceClient();
  const start = Date.now();

  const { data: items, error } = await supabase
    .from("raw_items")
    .select("id, url, body, language, publisher_name, enriched_at, sources(slug)")
    .not("topic_id", "is", null)
    .or("enriched_at.is.null,url.ilike.%news.google.com%")
    .order("fetched_at", { ascending: false })
    .limit(MAX_ITEMS);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;
  let resolved = 0;
  let stillGoogle = 0;
  let failures = 0;

  for (const item of items ?? []) {
    if (Date.now() - start > TIME_BUDGET_MS) break;

    const source = item.sources as unknown as { slug?: string } | null;
    const wasGoogle = isGoogleNewsUrl(item.url);

    try {
      const result = await enrichRawItem(
        supabase,
        {
          id: item.id,
          url: item.url,
          body: item.body,
          // Site-specifieke gnews-bronnen hebben een vaste publisher; zo klopt
          // de weergavenaam ook als de URL-herleiding faalt.
          publisher_name:
            item.publisher_name ?? (source?.slug ? PUBLISHER_BY_SLUG[source.slug] ?? null : null),
          // Herleiding opnieuw proberen voor items die nog op Google News wijzen.
          enriched_at: wasGoogle ? null : item.enriched_at,
        },
        // Niet-NL items zijn al vertaald: hun body niet overschrijven met een
        // vers gescrapete (buitenlandse) intro.
        { skipIntro: item.language !== "nl" }
      );

      processed++;
      if (wasGoogle) {
        if (isGoogleNewsUrl(result.url)) stillGoogle++;
        else resolved++;
      }
    } catch (err) {
      failures++;
      console.error(`Verrijken van ${item.id} mislukt, ga door met de rest:`, err);
    }
  }

  return NextResponse.json({
    candidates: items?.length ?? 0,
    processed,
    resolved,
    stillGoogle,
    failures,
    remaining: (items?.length ?? 0) - processed,
  });
}
