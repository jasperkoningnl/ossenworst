import type { Topic } from "@/lib/types/database";
import type { ConfidenceLevel } from "@/lib/types/enums";

/** Weergave-types voor de feed/detail-UI, gevuld vanuit lib/data/topics.ts. */
export interface TopicFeedItem extends Topic {
  /** Korte teaser voor de feed-rij: de intro van de meest recente bron. */
  teaser: string;
  /**
   * Afbeeldingskandidaten, nieuwste bron eerst. De UI probeert ze op volgorde:
   * laadt de eerste niet (dode link, hotlink-blokkade), dan schakelt hij door
   * naar de afbeelding van de volgende bron van hetzelfde topic.
   */
  imageUrls: string[];
  sourceCount: number;
  commentCount: number;
}

export interface TopicTimelineEntry {
  date: string;
  headline: string;
  snippet: string;
  confidence: ConfidenceLevel;
  /** Link naar het originele artikel bij deze bron. */
  url: string | null;
}

/** Intro van de meest recente bron, met doorverwijzing naar het volledige artikel. */
export interface TopicIntro {
  text: string;
  sourceName: string;
  url: string | null;
  /** Zie TopicFeedItem.imageUrls: kandidaten op volgorde, met client-side fallback. */
  imageUrls: string[];
}

export interface TopicComment {
  username: string;
  timeAgo: string;
  body: string;
  isAnonymous: boolean;
}

export interface TopicDetail {
  intro: TopicIntro | null;
  timeline: TopicTimelineEntry[];
  comments: TopicComment[];
  sagaStartedAt: string;
}
