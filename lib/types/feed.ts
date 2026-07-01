import type { Topic } from "@/lib/types/database";
import type { ConfidenceLevel } from "@/lib/types/enums";

/**
 * Weergave-types voor de feed/detail-UI. Gedeeld tussen lib/mock/topics.ts
 * (Fase 0-schermen) en lib/data/topics.ts (echte Supabase-queries, Fase 1) —
 * zodat componenten zoals TopicCard ongewijzigd blijven ongeacht de databron.
 */
export interface TopicFeedItem extends Topic {
  /** Korte teaser voor de feed-rij (aparte granulariteit dan de volledige AI-samenvatting in het detail). */
  teaser: string;
  sourceCount: number;
  reactionCount: string;
  trend: string | null;
  trendColor: string | null;
  hasHero: boolean;
  hasThumb: boolean;
  imageCredit: string | null;
  hasDetail: boolean;
}

export interface TopicSummaryLine {
  source: string;
  text: string;
}

export interface TopicTimelineEntry {
  date: string;
  delta: string;
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
  upvotes: number;
  isAnonymous: boolean;
}

export interface TopicDetail {
  summaryLines: TopicSummaryLine[];
  timeline: TopicTimelineEntry[];
  sources: TopicSourceEntry[];
  comments: TopicComment[];
  imageCaption: string;
  imageCredit: string;
  sagaStartedAt: string;
}
