import { createClient } from "@/lib/supabase/server";
import { publisherNameFromUrl } from "@/lib/pipeline/google-news";
import { truncate } from "@/lib/utils/text";
import type { Topic } from "@/lib/types/database";
import type {
  TopicComment,
  TopicDetail,
  TopicFeedItem,
  TopicIntro,
  TopicSourceEntry,
  TopicTimelineEntry,
} from "@/lib/types/feed";

const TEASER_MAX_LENGTH = 200;
// Topics zonder activiteit in deze periode zijn geen nieuws meer en blijven
// uit de feed — ook als oude items ooit met een historische publicatiedatum
// zijn binnengekomen.
const MAX_FEED_AGE_DAYS = 30;

/** Kop, intro, link, afbeelding en bronnaam van het meest recente item van een topic. */
interface LatestItemInfo {
  title: string | null;
  body: string | null;
  url: string | null;
  imageUrl: string | null;
  sourceName: string | null;
}

interface TopicItemRow {
  topic_id: string;
  reported_at: string;
  raw_items: unknown;
  sources: unknown;
}

/**
 * Weergavenaam van een bron: de echte publisher als die bekend is, anders de
 * bronnaam — behalve voor Google News-vangnetbronnen, waar we liever de
 * hostname van het artikel tonen dan "Google News: …".
 */
function sourceDisplayName(
  publisherName: string | null,
  sourceName: string | null,
  url: string | null
): string {
  if (publisherName) return publisherName;
  if (sourceName && !sourceName.startsWith("Google News")) return sourceName;
  return (url && publisherNameFromUrl(url)) || sourceName || "onbekende bron";
}

function latestInfoFromRow(row: TopicItemRow): LatestItemInfo {
  // Zonder gegenereerde Database-types ziet supabase-js many-to-one FK-joins
  // als array; runtime is het altijd één object.
  const rawItem = row.raw_items as {
    title: string;
    body: string | null;
    url: string;
    publisher_name: string | null;
    image_url: string | null;
  } | null;
  const source = row.sources as { name: string } | null;
  return {
    title: rawItem?.title ?? null,
    body: rawItem?.body ?? null,
    url: rawItem?.url ?? null,
    imageUrl: rawItem?.image_url ?? null,
    sourceName: sourceDisplayName(
      rawItem?.publisher_name ?? null,
      source?.name ?? null,
      rawItem?.url ?? null
    ),
  };
}

/**
 * Meest recente item per topic: de kop en intro van de laatst rapporterende
 * bron zijn leidend in de feed en op de detailpagina.
 */
async function fetchLatestItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  topicIds: string[]
): Promise<Map<string, LatestItemInfo>> {
  const latest = new Map<string, LatestItemInfo>();
  if (topicIds.length === 0) return latest;

  const { data: rows, error } = await supabase
    .from("topic_items")
    .select("topic_id, reported_at, raw_items(title, body, url, publisher_name, image_url), sources(name)")
    .in("topic_id", topicIds)
    .order("reported_at", { ascending: false });
  // Niet fataal (de feed valt terug op topic-titel/samenvatting), maar wél
  // zichtbaar maken: dit faalt bv. wanneer de raw_items-migratie
  // (publisher_name) nog niet gedraaid is.
  if (error) console.error("Laatste bron-items ophalen mislukt:", error.message);

  for (const row of (rows ?? []) as TopicItemRow[]) {
    const existing = latest.get(row.topic_id);
    if (!existing) {
      latest.set(row.topic_id, latestInfoFromRow(row));
    } else if (!existing.imageUrl) {
      // Kop/intro komen van het nieuwste item, maar als dat geen afbeelding
      // heeft, gebruiken we de nieuwste afbeelding van een eerder item.
      const rawItem = row.raw_items as { image_url: string | null } | null;
      if (rawItem?.image_url) existing.imageUrl = rawItem.image_url;
    }
  }
  return latest;
}

function toFeedItem(topic: Topic, latest: LatestItemInfo | undefined, commentCount: number): TopicFeedItem {
  return {
    ...topic,
    title: latest?.title ?? topic.title,
    // Alinea-witruimte plat slaan: de teaser is één doorlopende feed-regel.
    teaser: truncate((latest?.body ?? topic.summary ?? "").replace(/\s+/g, " "), TEASER_MAX_LENGTH),
    imageUrl: latest?.imageUrl ?? null,
    sourceCount: topic.item_count,
    commentCount,
  };
}

async function countVisibleComments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  topicIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (topicIds.length === 0) return counts;

  const { data: rows } = await supabase
    .from("comments")
    .select("topic_id")
    .eq("status", "visible")
    .in("topic_id", topicIds);

  for (const row of rows ?? []) {
    counts.set(row.topic_id, (counts.get(row.topic_id) ?? 0) + 1);
  }
  return counts;
}

export async function getPublishedTopics(): Promise<TopicFeedItem[]> {
  const supabase = await createClient();

  const feedCutoff = new Date(Date.now() - MAX_FEED_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: topics, error } = await supabase
    .from("topics")
    .select("*")
    .eq("is_published", true)
    .gte("last_activity_at", feedCutoff)
    .order("last_activity_at", { ascending: false });
  if (error) throw error;
  if (!topics || topics.length === 0) return [];

  const topicIds = topics.map((t) => t.id);
  const [commentCounts, latestItems] = await Promise.all([
    countVisibleComments(supabase, topicIds),
    fetchLatestItems(supabase, topicIds),
  ]);

  return topics.map((t) => toFeedItem(t, latestItems.get(t.id), commentCounts.get(t.id) ?? 0));
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDate();
  const month = d.toLocaleString("nl-NL", { month: "short", timeZone: "UTC" }).replace(".", "");
  return `${day} ${month}`;
}

function contributionHeadline(contribution: string | null, sourceName: string): string {
  switch (contribution) {
    case "nieuw":
      return `Eerste melding via ${sourceName}`;
    case "bevestigt":
      return `Bevestigd door ${sourceName}`;
    case "nuanceert":
      return `Genuanceerd door ${sourceName}`;
    default:
      return `Extra details via ${sourceName}`;
  }
}

export async function getTopicDetailBySlug(slug: string): Promise<{ item: TopicFeedItem; detail: TopicDetail } | null> {
  const supabase = await createClient();

  const { data: topic, error } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  if (!topic) return null;

  const [{ data: itemRows, error: itemRowsError }, { data: commentRows }] = await Promise.all([
    supabase
      .from("topic_items")
      .select(
        "snippet, reported_at, contribution, confidence_at, sources(name, tier), raw_items(title, body, url, publisher_name, image_url)"
      )
      .eq("topic_id", topic.id)
      .order("reported_at", { ascending: true }),
    supabase
      .from("comments")
      .select("body, created_at, profiles(username)")
      .eq("topic_id", topic.id)
      .eq("status", "visible")
      .order("created_at", { ascending: false }),
  ]);

  // Zie fetchLatestItems: zichtbaar maken i.p.v. stil een lege tijdlijn tonen.
  if (itemRowsError) console.error("Topic-items ophalen mislukt:", itemRowsError.message);

  // Zonder gegenereerde Database-types ziet supabase-js many-to-one FK-joins
  // als array; runtime is het altijd één object.
  const items = (itemRows ?? []).map((row) => ({
    ...row,
    source: row.sources as unknown as { name: string; tier: number } | null,
    rawItem: row.raw_items as unknown as {
      title: string;
      body: string | null;
      url: string;
      publisher_name: string | null;
      image_url: string | null;
    } | null,
  }));

  const displayName = (item: (typeof items)[number]) =>
    sourceDisplayName(
      item.rawItem?.publisher_name ?? null,
      item.source?.name ?? null,
      item.rawItem?.url ?? null
    );

  const timeline: TopicTimelineEntry[] = items.map((row) => ({
    date: formatShortDate(row.reported_at),
    headline: contributionHeadline(row.contribution, displayName(row)),
    snippet: row.snippet ?? "",
    confidence: row.confidence_at,
  }));

  const sources: TopicSourceEntry[] = items.map((row) => ({
    name: displayName(row),
    date: formatShortDate(row.reported_at),
    tier: (row.source?.tier ?? 2) as TopicSourceEntry["tier"],
    url: row.rawItem?.url ?? null,
  }));

  // Kop en intro komen van de meest recente bron; de items staan oplopend
  // gesorteerd, dus dat is de laatste rij.
  const latestRow = items[items.length - 1];
  // Zelfde fallback als in de feed: nieuwste item is leidend, maar zonder
  // eigen afbeelding pakken we de nieuwste afbeelding van een eerder item.
  const newestImage = [...items].reverse().find((row) => row.rawItem?.image_url)?.rawItem
    ?.image_url ?? null;

  const latest: LatestItemInfo | undefined = latestRow
    ? {
        title: latestRow.rawItem?.title ?? null,
        body: latestRow.rawItem?.body ?? null,
        url: latestRow.rawItem?.url ?? null,
        imageUrl: latestRow.rawItem?.image_url ?? newestImage,
        sourceName: latestRow ? displayName(latestRow) : null,
      }
    : undefined;

  const introText = latest?.body ?? latestRow?.snippet ?? topic.summary;
  const intro: TopicIntro | null =
    latest && introText
      ? {
          text: introText,
          sourceName: latest.sourceName ?? "onbekende bron",
          url: latest.url,
          imageUrl: latest.imageUrl,
        }
      : null;

  const comments: TopicComment[] = (commentRows ?? []).map((row) => {
    const profile = row.profiles as unknown as { username: string | null } | null;
    return {
      username: profile?.username ?? "anoniem",
      timeAgo: formatShortDate(row.created_at),
      body: row.body,
      isAnonymous: !profile?.username,
    };
  });

  const item = toFeedItem(topic, latest, comments.length);

  const detail: TopicDetail = {
    intro,
    timeline,
    sources,
    comments,
    sagaStartedAt: topic.first_seen_at,
  };

  return { item, detail };
}
