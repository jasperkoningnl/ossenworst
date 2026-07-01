import { createClient } from "@/lib/supabase/server";
import { truncate } from "@/lib/utils/text";
import type { Topic } from "@/lib/types/database";
import type { TopicComment, TopicDetail, TopicFeedItem, TopicSourceEntry, TopicTimelineEntry } from "@/lib/types/feed";

const TEASER_MAX_LENGTH = 140;

function toFeedItem(topic: Topic, commentCount: number): TopicFeedItem {
  return {
    ...topic,
    teaser: truncate(topic.summary ?? "", TEASER_MAX_LENGTH),
    sourceCount: topic.item_count,
    reactionCount: commentCount.toLocaleString("nl-NL"),
    // Geen trending-signaal en geen beeldmateriaal in Fase 1 — eerlijker dan
    // de mock-placeholders tonen wanneer we die data simpelweg niet hebben.
    trend: null,
    trendColor: null,
    hasHero: false,
    hasThumb: false,
    imageCredit: null,
    hasDetail: true,
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

  const { data: topics, error } = await supabase
    .from("topics")
    .select("*")
    .eq("is_published", true)
    .order("last_activity_at", { ascending: false });
  if (error) throw error;
  if (!topics || topics.length === 0) return [];

  const commentCounts = await countVisibleComments(
    supabase,
    topics.map((t) => t.id)
  );

  return topics.map((t) => toFeedItem(t, commentCounts.get(t.id) ?? 0));
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDate();
  const month = d.toLocaleString("nl-NL", { month: "short", timeZone: "UTC" }).toUpperCase().replace(".", "");
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

  const [{ data: itemRows }, { data: commentRows }] = await Promise.all([
    supabase
      .from("topic_items")
      .select("snippet, reported_at, contribution, confidence_at, sources(name, tier)")
      .eq("topic_id", topic.id)
      .order("reported_at", { ascending: true }),
    supabase
      .from("comments")
      .select("body, created_at, profiles(username)")
      .eq("topic_id", topic.id)
      .eq("status", "visible")
      .order("created_at", { ascending: false }),
  ]);

  // Zonder gegenereerde Database-types ziet supabase-js many-to-one FK-joins
  // als array; runtime is het altijd één object.
  const items = (itemRows ?? []).map((row) => ({
    ...row,
    source: row.sources as unknown as { name: string; tier: number } | null,
  }));

  const timeline: TopicTimelineEntry[] = items.map((row, i) => ({
    date: formatShortDate(row.reported_at),
    delta: i === 0 ? "1 bron" : "+1 bron",
    headline: contributionHeadline(row.contribution, row.source?.name ?? "onbekende bron"),
    snippet: row.snippet ?? "",
    confidence: row.confidence_at,
  }));

  const sources: TopicSourceEntry[] = items.map((row) => ({
    name: row.source?.name ?? "onbekende bron",
    date: formatShortDate(row.reported_at),
    tier: (row.source?.tier ?? 2) as TopicSourceEntry["tier"],
  }));

  const comments: TopicComment[] = (commentRows ?? []).map((row) => {
    const profile = row.profiles as unknown as { username: string | null } | null;
    return {
      username: profile?.username ?? "anoniem",
      timeAgo: formatShortDate(row.created_at),
      body: row.body,
      upvotes: 0,
      isAnonymous: !profile?.username,
    };
  });

  const commentCount = comments.length;
  const item = toFeedItem(topic, commentCount);

  const detail: TopicDetail = {
    summaryLines: topic.summary ? [{ source: "Ossenworst Manager", text: topic.summary }] : [],
    timeline,
    sources,
    comments,
    imageCaption: "",
    imageCredit: "",
    sagaStartedAt: topic.first_seen_at,
  };

  return { item, detail };
}
