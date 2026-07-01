import type {
  CommentStatus,
  ConfidenceLevel,
  FetchMethod,
  JobStatus,
  JobType,
  LineupMode,
  ProcessingStatus,
  SourceTier,
  SquadType,
  TopicCategory,
  VoteKind,
} from "./enums";

export interface Source {
  id: string;
  name: string;
  slug: string;
  url: string;
  tier: SourceTier;
  country: string;
  language: string;
  fetch_method: FetchMethod;
  feed_url: string | null;
  scrape_config: Record<string, unknown> | null;
  enabled: boolean;
  last_fetched_at: string | null;
  last_status: string | null;
}

export interface RawItem {
  id: string;
  source_id: string;
  external_id: string;
  url: string;
  title: string;
  body: string | null;
  published_at: string | null;
  language: string;
  fetched_at: string;
  processing_status: ProcessingStatus;
  topic_id: string | null;
}

export interface Topic {
  id: string;
  slug: string;
  title: string;
  category: TopicCategory;
  confidence: ConfidenceLevel;
  summary: string | null;
  summary_updated_at: string | null;
  player_id: string | null;
  first_seen_at: string;
  last_activity_at: string;
  item_count: number;
  is_published: boolean;
}

export interface TopicItem {
  id: string;
  topic_id: string;
  raw_item_id: string;
  source_id: string;
  reported_at: string;
  snippet: string | null;
  contribution: string | null;
}

export interface Translation {
  id: string;
  raw_item_id: string;
  target_lang: string;
  translated_title: string;
  translated_body: string | null;
  model: string;
  created_at: string;
}

export interface Player {
  id: string;
  external_id: string | null;
  name: string;
  photo_url: string | null;
  shirt_number: number | null;
  position: string | null;
  birth_date: string | null;
  nationality: string | null;
  contract_until: string | null;
  market_value: number | null;
  squad: SquadType;
  is_active: boolean;
  updated_at: string;
}

export interface Formation {
  id: string;
  name: string;
  slots: Record<string, unknown>;
}

export interface Profile {
  id: string;
  username: string | null;
  created_at: string;
}

export interface UserLineup {
  id: string;
  profile_id: string;
  formation_id: string;
  slots: Record<string, string | null>;
  mode: LineupMode;
  created_at: string;
}

export interface TransferVote {
  id: string;
  profile_id: string;
  player_id: string | null;
  external_player_ref: string | null;
  kind: VoteKind;
  created_at: string;
}

export interface Comment {
  id: string;
  profile_id: string | null;
  topic_id: string;
  body: string;
  status: CommentStatus;
  created_at: string;
}

export interface Job {
  id: string;
  type: JobType;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  run_after: string;
  locked_at: string | null;
  created_at: string;
}
