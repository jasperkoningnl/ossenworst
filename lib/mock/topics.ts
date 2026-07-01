import type { Topic } from "@/lib/types/database";
import type { ConfidenceLevel, TopicCategory } from "@/lib/types/enums";

/**
 * Mock-nieuwsfeed, overgenomen uit design/OssenworstApp.dc.html (`rawFeed`,
 * `timelineData`, `summaryData`, `sourcesData`, `commentsData`). Vervangen
 * door echte `GET /api/topics` / `GET /api/topics/[slug]`-fetches in Fase 1.
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

interface RawFeedItem {
  id: string;
  cat: TopicCategory;
  tier: "bevestigd" | "gerucht" | "praat";
  h: string;
  s: string;
  t: string;
  src: number;
  re: string;
  trend: string;
  trendC: string;
  art: boolean;
  hero?: boolean;
  thumb?: boolean;
  credit?: string;
}

const tierToConfidence: Record<RawFeedItem["tier"], ConfidenceLevel> = {
  bevestigd: "BEVESTIGD",
  gerucht: "GERUCHT",
  praat: "PRAATPROGRAMMA",
};

const rawFeed: RawFeedItem[] = [
  { id: "ts", cat: "TRANSFER", tier: "gerucht", h: "Ter Stegen dichterbij: Ajax voert gesprekken", s: "Spaanse media: transfervrije komst ‘steeds waarschijnlijker’.", t: "2026-06-29T18:42:00.000Z", src: 6, re: "1.324", trend: "↑ STIJGEND", trendC: "#E0A416", art: true, hero: true, credit: "© BRONVERMELDING" },
  { id: "caio", cat: "TRANSFER", tier: "bevestigd", h: "Caio Henrique officieel rond", s: "Linksback komt transfervrij over; vandaag medische keuring.", t: "2026-06-29T14:10:00.000Z", src: 9, re: "402", trend: "BEVESTIGD", trendC: "#39B14E", art: false, thumb: true },
  { id: "staf", cat: "STAF", tier: "bevestigd", h: "Míchel presenteert opvallende technische staf", s: "Nieuwe hoofdtrainer stelt complete staf voor.", t: "2026-06-26T18:44:00.000Z", src: 4, re: "233", trend: "", trendC: "", art: false, thumb: true },
  { id: "berg", cat: "CLUB", tier: "gerucht", h: "Berghuis-dilemma verdeelt de directie", s: "Aflopend contract verdeelt Cruijff en Míchel.", t: "2026-06-29T16:49:00.000Z", src: 3, re: "188", trend: "", trendC: "", art: false },
  { id: "blind", cat: "TRANSFER", tier: "praat", h: "‘Keert Daley Blind deze zomer terug?’", s: "Danny Blind houdt een slag om de arm.", t: "2026-06-29T18:08:00.000Z", src: 1, re: "97", trend: "PRAATPROGRAMMA", trendC: "var(--fg-label)", art: false },
  { id: "erediv", cat: "EREDIVISIE", tier: "bevestigd", h: "Geen midweekse speelrondes meer in 26/27", s: "Gewijzigd speelschema voor komend seizoen.", t: "2026-06-28T11:20:00.000Z", src: 5, re: "64", trend: "", trendC: "", art: false },
  { id: "brob", cat: "EX-SPELER", tier: "bevestigd", h: "Brobbey smaakmaker bij Oranje op het WK", s: "Oud-Ajacied maakt indruk en oogst lof.", t: "2026-06-28T22:30:00.000Z", src: 7, re: "511", trend: "", trendC: "", art: false, thumb: true },
  { id: "godts", cat: "TRANSFER", tier: "gerucht", h: "Arsenal aast op Mika Godts", s: "The Athletic meldt concrete interesse uit Londen.", t: "2026-06-27T09:15:00.000Z", src: 4, re: "276", trend: "↑ STIJGEND", trendC: "#E0A416", art: false, thumb: true },
  { id: "ceb", cat: "TRANSFER", tier: "gerucht", h: "Ceballos-akkoord nabij; Galarza als alternatief", s: "Mundo Deportivo: akkoord met Real Madrid nabij.", t: "2026-06-27T13:35:00.000Z", src: 5, re: "342", trend: "", trendC: "", art: false },
  { id: "oef", cat: "WEDSTRIJD", tier: "bevestigd", h: "Oefenprogramma bekend: Ajax opent in Oostenrijk", s: "Trainingskamp en twee oefenduels op het programma.", t: "2026-06-25T21:33:00.000Z", src: 5, re: "73", trend: "", trendC: "", art: false },
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const topicFeed: TopicFeedItem[] = rawFeed.map((it) => ({
  id: it.id,
  slug: slugify(it.h),
  title: it.h,
  category: it.cat,
  confidence: tierToConfidence[it.tier],
  summary: it.s,
  summary_updated_at: it.t,
  player_id: null,
  first_seen_at: it.t,
  last_activity_at: it.t,
  item_count: it.src,
  is_published: true,
  teaser: it.s,
  sourceCount: it.src,
  reactionCount: it.re,
  trend: it.trend || null,
  trendColor: it.trendC || null,
  hasHero: !!it.hero,
  hasThumb: !!it.thumb,
  imageCredit: it.credit ?? null,
  hasDetail: it.art,
}));

export const topicDetails: Record<string, TopicDetail> = {
  ts: {
    imageCaption: "Ter Stegen in gesprek — archiefbeeld, niet van de recente onderhandelingen.",
    imageCredit: "© BRONVERMELDING / FOTOGRAAF",
    sagaStartedAt: "2026-06-12",
    summaryLines: [
      { source: "SPORT (ES)", text: "opende de jacht: een transfervrije komst van Ter Stegen is ‘steeds waarschijnlijker’ nu hij bij Barcelona uit beeld is." },
      { source: "DE TELEGRAAF", text: "meldt dat Jordi Cruijff een ervaren doelman boven aan zijn lijst heeft en dat er gesprekken lopen." },
      { source: "FABRIZIO ROMANO", text: "houdt een slag om de arm: er is contact, maar van een akkoord is nog geen sprake." },
    ],
    timeline: [
      { date: "12 JUN", delta: "1 bron", headline: "Eerste gerucht in praatprogramma", snippet: "Spaanse talkshow noemt Ajax terloops als optie.", confidence: "PRAATPROGRAMMA" },
      { date: "18 JUN", delta: "+2 bronnen", headline: "SPORT maakt het concreet", snippet: "‘Steeds waarschijnlijker’ op de voorpagina.", confidence: "GERUCHT" },
      { date: "23 JUN", delta: "+1 bron", headline: "Ajax zoekt nadrukkelijk een keeper", snippet: "Voetbalprimeur: Cruijff wil ervaren doelman.", confidence: "GERUCHT" },
      { date: "27 JUN", delta: "+2 bronnen", headline: "Onderhandelingen op gang", snippet: "Meerdere bronnen melden dat Ajax inzet.", confidence: "GERUCHT" },
      { date: "29 JUN", delta: "6 bronnen", headline: "Vandaag: voorwaarden besproken", snippet: "Partijen naderen elkaar over salaris en duur.", confidence: "GERUCHT" },
    ],
    sources: [
      { name: "Fabrizio Romano", date: "29 jun", tier: 1 },
      { name: "De Telegraaf", date: "29 jun", tier: 1 },
      { name: "ESPN", date: "28 jun", tier: 2 },
      { name: "SPORT (ES)", date: "18 jun", tier: 2 },
      { name: "Marca", date: "27 jun", tier: 2 },
      { name: "Voetbalprimeur", date: "23 jun", tier: 3 },
    ],
    comments: [
      { username: "JariL_10", timeAgo: "2u", body: "Eindelijk weer een keeper van wereldklasse. Hier kunnen we op bouwen.", upvotes: 142, isAnonymous: false },
      { username: "anoniem", timeAgo: "3u", body: "Transfervrij én ervaren? Dit is de transfer van de zomer.", upvotes: 88, isAnonymous: true },
      { username: "DeMeer1996", timeAgo: "4u", body: "Geloof het pas als Romano ‘here we go’ typt.", upvotes: 230, isAnonymous: false },
      { username: "WatskeburtAFC", timeAgo: "5u", body: "Salaris wordt het probleem. Past dat binnen de begroting?", upvotes: 54, isAnonymous: false },
    ],
  },
};

export function findTopicBySlug(slug: string): TopicFeedItem | undefined {
  return topicFeed.find((t) => t.slug === slug);
}
