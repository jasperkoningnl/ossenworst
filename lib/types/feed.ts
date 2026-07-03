import type { Topic } from "@/lib/types/database";
import type { ConfidenceLevel } from "@/lib/types/enums";

/** Weergave-types voor de feed/detail-UI, gevuld vanuit lib/data/topics.ts. */
export interface TopicFeedItem extends Topic {
  /** Korte teaser voor de feed-rij (ingekorte AI-samenvatting). */
  teaser: string;
  sourceCount: number;
  commentCount: number;
}

export interface TopicTimelineEntry {
  date: string;
  headline: string;
  snippet: string;
  confidence: ConfidenceLevel;
}

export interface TopicSourceEntry {
  name: string;
  date: string;
  tier: 1 | 2 | 3;
}

export interface TopicComment {
  username: string;
  timeAgo: string;
  body: string;
  isAnonymous: boolean;
}

export interface TopicDetail {
  timeline: TopicTimelineEntry[];
  sources: TopicSourceEntry[];
  comments: TopicComment[];
  sagaStartedAt: string;
}
