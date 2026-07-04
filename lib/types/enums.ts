export const TOPIC_CATEGORIES = [
  "TRANSFER",
  "STAF",
  "CLUB",
  "EREDIVISIE",
  "EX-SPELER",
  "WEDSTRIJD",
  "VROUWENVOETBAL",
] as const;
export type TopicCategory = (typeof TOPIC_CATEGORIES)[number];

export const CONFIDENCE_LEVELS = ["BEVESTIGD", "GERUCHT", "PRAATPROGRAMMA"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const SOURCE_TIERS = [1, 2, 3] as const;
export type SourceTier = (typeof SOURCE_TIERS)[number];

export const FETCH_METHODS = ["rss", "scrape", "api"] as const;
export type FetchMethod = (typeof FETCH_METHODS)[number];

export const PROCESSING_STATUSES = ["pending", "processed", "skipped", "error"] as const;
export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];

export const JOB_TYPES = [
  "fetch_source",
  "process_item",
  "translate",
  "merge",
  "summarize",
  "sync_squad",
] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_STATUSES = ["queued", "running", "done", "error"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const SQUAD_TYPES = ["first", "jong", "former"] as const;
export type SquadType = (typeof SQUAD_TYPES)[number];

export const LINEUP_MODES = ["current", "alltime"] as const;
export type LineupMode = (typeof LINEUP_MODES)[number];

export const VOTE_KINDS = ["out", "wish"] as const;
export type VoteKind = (typeof VOTE_KINDS)[number];

export const COMMENT_STATUSES = ["visible", "hidden"] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

/** Inhoudelijk betrouwbaarheidssignaal uit de merge-call (wat het artikel zelf meldt). */
export const CONFIDENCE_SIGNALS = ["bevestigd", "gerucht", "speculatie"] as const;
export type ConfidenceSignal = (typeof CONFIDENCE_SIGNALS)[number];

/**
 * Betrouwbaarheid komt uit de INHOUD van het artikel, niet uit de bron-tier:
 * een tier-2-krant die een officiële bevestiging meldt maakt het topic
 * gewoon "BEVESTIGD".
 */
export function confidenceForSignal(signal: ConfidenceSignal): ConfidenceLevel {
  if (signal === "bevestigd") return "BEVESTIGD";
  if (signal === "gerucht") return "GERUCHT";
  return "PRAATPROGRAMMA";
}

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  PRAATPROGRAMMA: 0,
  GERUCHT: 1,
  BEVESTIGD: 2,
};

/** Hoogste van twee niveaus: eenmaal bevestigd zakt een topic niet meer terug. */
export function maxConfidence(a: ConfidenceLevel, b: ConfidenceLevel): ConfidenceLevel {
  return CONFIDENCE_RANK[a] >= CONFIDENCE_RANK[b] ? a : b;
}
