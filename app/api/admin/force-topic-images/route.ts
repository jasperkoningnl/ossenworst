import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enrichRawItem } from "@/lib/pipeline/enrich";
import { isUsableImageUrl } from "@/lib/utils/image";

export const maxDuration = 120;

const ENRICH_CONCURRENCY = 4;

interface RawItemRow {
  id: string;
  url: string;
  body: string | null;
  language: string;
  publisher_name: string | null;
  image_url: string | null;
  enriched_at: string | null;
}

/**
 * Gerichte herstelactie voor topics die ondanks de reguliere backfill
 * (`/api/admin/enrich-items`) geen afbeelding hebben gekregen: die route kijkt
 * alleen naar de 300 meest recent opgehaalde raw_items, dus topics die daar
 * inmiddels uitgevallen zijn worden nooit meer opnieuw geprobeerd, hoe vaak de
 * backfill ook draait. Dit endpoint pakt expliciet de gevraagde topic-slugs,
 * negeert enriched_at/afbeelding-status volledig en forceert een verse
 * og:image/JSON-LD/artikelafbeelding-extractie voor elk onderliggend raw_item.
 *
 *   curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \
 *     "https://ossenworst.vercel.app/api/admin/force-topic-images?slugs=slug-een,slug-twee"
 *
 * Met ?imageUrl=… (één slug tegelijk) wordt niet geëxtraheerd maar de
 * opgegeven URL hard op het nieuwste raw_item van het topic gezet — het
 * laatste redmiddel voor pagina's waar automatische extractie niets bruikbaars
 * vindt. De URL moet ge-urlencode zijn:
 *
 *   curl -G -X POST -H "Authorization: Bearer $ADMIN_SECRET" \
 *     --data-urlencode "slugs=mijn-topic-slug" \
 *     --data-urlencode "imageUrl=https://voorbeeld.nl/foto.jpg?width=1960" \
 *     "https://ossenworst.vercel.app/api/admin/force-topic-images"
 */
export async function POST(request: Request) {
  const expected = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const slugs = (params.get("slugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (slugs.length === 0) {
    return NextResponse.json({ error: "geen slugs opgegeven (?slugs=a,b,c)" }, { status: 400 });
  }

  const imageUrl = params.get("imageUrl")?.trim() || null;
  if (imageUrl) {
    if (slugs.length !== 1) {
      return NextResponse.json(
        { error: "imageUrl werkt op één topic tegelijk: geef precies één slug op" },
        { status: 400 }
      );
    }
    if (!isUsableImageUrl(imageUrl)) {
      return NextResponse.json(
        { error: "imageUrl is geen bruikbare afbeeldings-URL (http(s), geen data-URI/SVG/pixel)" },
        { status: 400 }
      );
    }
  }

  try {
    return imageUrl ? await setTopicImage(slugs[0], imageUrl) : await forceTopicImages(slugs);
  } catch (err) {
    console.error("force-topic-images faalde:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/**
 * Zet een handmatig gekozen afbeelding op het nieuwste raw_item van een topic.
 * enriched_at gaat mee zodat de backfill de handmatige keuze niet later
 * overschrijft met een (mislukte) automatische extractie.
 */
async function setTopicImage(slug: string, imageUrl: string) {
  const supabase = createServiceClient();

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id, slug, title")
    .eq("slug", slug)
    .maybeSingle();
  if (topicError) throw topicError;
  if (!topic) {
    return NextResponse.json({ error: `onbekend topic '${slug}'` }, { status: 404 });
  }

  // Het nieuwste item bepaalt de afbeelding in feed en detail (de UI probeert
  // kandidaten nieuwste-eerst), dus daar moet de handmatige URL op staan.
  const { data: latestItem, error: latestError } = await supabase
    .from("topic_items")
    .select("raw_item_id, reported_at")
    .eq("topic_id", topic.id)
    .order("reported_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw latestError;
  if (!latestItem) {
    return NextResponse.json({ error: `topic '${slug}' heeft geen items` }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("raw_items")
    .update({ image_url: imageUrl, enriched_at: new Date().toISOString() })
    .eq("id", latestItem.raw_item_id);
  if (updateError) throw updateError;

  return NextResponse.json({
    slug: topic.slug,
    title: topic.title,
    rawItemId: latestItem.raw_item_id,
    imageUrl,
    set: true,
  });
}

async function forceTopicImages(slugs: string[]) {
  const supabase = createServiceClient();

  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("id, slug, title")
    .in("slug", slugs);
  if (topicsError) throw topicsError;

  const foundSlugs = new Set((topics ?? []).map((t) => t.slug));
  const missingSlugs = slugs.filter((s) => !foundSlugs.has(s));

  if (!topics || topics.length === 0) {
    return NextResponse.json({ error: "geen van de opgegeven slugs bestaat als topic", missingSlugs }, { status: 404 });
  }

  const topicIds = topics.map((t) => t.id);
  const { data: itemRows, error: itemRowsError } = await supabase
    .from("topic_items")
    .select("topic_id, raw_items(id, url, body, language, publisher_name, image_url, enriched_at)")
    .in("topic_id", topicIds);
  if (itemRowsError) throw itemRowsError;

  const rawItemsByTopic = new Map<string, RawItemRow[]>();
  for (const row of itemRows ?? []) {
    const rawItem = row.raw_items as unknown as RawItemRow | null;
    if (!rawItem) continue;
    const list = rawItemsByTopic.get(row.topic_id) ?? [];
    list.push(rawItem);
    rawItemsByTopic.set(row.topic_id, list);
  }

  // Eén gededuplice­erde lijst: raw_items kunnen in theorie bij meerdere van de
  // gevraagde topics horen (samengevoegde duplicaten) en hoeven maar één keer
  // verrijkt te worden.
  const allRawItems = new Map<string, RawItemRow>();
  for (const items of rawItemsByTopic.values()) {
    for (const item of items) allRawItems.set(item.id, item);
  }

  // Placeholder-junk (data-URI's van lazy-loading) telt niet als afbeelding:
  // die rijen moeten juist opnieuw geëxtraheerd én in de telling als "was
  // beeldloos" verschijnen.
  const hadImageBefore = new Set(
    [...allRawItems.values()].filter((item) => isUsableImageUrl(item.image_url)).map((item) => item.id)
  );
  const gotImage = new Set<string>();
  const failures: { id: string; url: string; error: string }[] = [];

  const items = [...allRawItems.values()];
  for (let i = 0; i < items.length; i += ENRICH_CONCURRENCY) {
    await Promise.all(
      items.slice(i, i + ENRICH_CONCURRENCY).map(async (item) => {
        try {
          // enriched_at geforceerd op null: negeert de "al verrijkt"-kortsluiting
          // in enrichRawItem, zodat elke og:image/JSON-LD-poging opnieuw draait
          // ongeacht hoe lang geleden de vorige (mislukte) poging was.
          const result = await enrichRawItem(supabase, { ...item, enriched_at: null });
          if (result.imageUrl) gotImage.add(item.id);
        } catch (err) {
          failures.push({ id: item.id, url: item.url, error: (err as Error).message });
        }
      })
    );
  }

  const perTopic = topics.map((topic) => {
    const items = rawItemsByTopic.get(topic.id) ?? [];
    const hasImageNow = items.some((item) => gotImage.has(item.id) || hadImageBefore.has(item.id));
    return {
      slug: topic.slug,
      title: topic.title,
      rawItemCount: items.length,
      hadImageBefore: items.some((item) => hadImageBefore.has(item.id)),
      hasImageNow,
    };
  });

  return NextResponse.json({
    topicsChecked: topics.length,
    missingSlugs,
    rawItemsProcessed: items.length,
    imagesFilled: gotImage.size,
    failures,
    topics: perTopic,
    stillMissing: perTopic.filter((t) => !t.hasImageNow).map((t) => t.slug),
  });
}
