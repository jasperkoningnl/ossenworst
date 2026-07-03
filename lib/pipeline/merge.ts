import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeAndClassify, type MergeCandidate } from "@/lib/claude/merge";
import { isRelevant, AJAX_SOURCE_SLUGS } from "@/lib/pipeline/relevance";
import { confidenceForTier, type SourceTier } from "@/lib/types/enums";
import { slugify } from "@/lib/utils/slug";

const CANDIDATE_WINDOW_DAYS = 14;
const MAX_CANDIDATES = 20;

/**
 * Vraagt Claude of een raw_item bij een bestaand topic hoort of een nieuw
 * topic start, schrijft het resultaat weg (topics/topic_items) en herberekent
 * de confidence. Kandidaten worden vernauwd op tijdvenster (geen embeddings —
 * dat is Fase 2).
 *
 * Idempotent bij retries: al-verwerkte items worden overgeslagen, een eerder
 * (bij een deels mislukte run) aangemaakt topic wordt via de deterministische
 * slug hergebruikt, en topic_items-duplicaten worden genegeerd.
 */
export async function mergeRawItem(supabase: SupabaseClient, rawItemId: string) {
  const { data: rawItem, error: rawItemError } = await supabase
    .from("raw_items")
    .select("id, source_id, title, body, published_at, processing_status, topic_id, sources(name, tier, slug)")
    .eq("id", rawItemId)
    .single();
  if (rawItemError) throw rawItemError;

  if (rawItem.processing_status === "processed" && rawItem.topic_id) {
    return { topicId: rawItem.topic_id, isNewTopic: false };
  }

  // Goedkope her-check vóór de Claude-call: vangt jobs die enqueued zijn toen
  // het relevantiefilter nog ruimer stond (bv. gnews op de whitelist).
  const sourceForGate = rawItem.sources as unknown as { slug?: string } | null;
  const isAjaxSource = sourceForGate?.slug ? AJAX_SOURCE_SLUGS.has(sourceForGate.slug) : false;
  if (!isAjaxSource && !isRelevant(rawItem.title, rawItem.body)) {
    await supabase.from("raw_items").update({ processing_status: "skipped" }).eq("id", rawItemId);
    return { topicId: null, isNewTopic: false, skipped: true };
  }

  const since = new Date(Date.now() - CANDIDATE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: candidateRows, error: candidatesError } = await supabase
    .from("topics")
    .select("id, title, category, summary")
    .gte("last_activity_at", since)
    .order("last_activity_at", { ascending: false })
    .limit(MAX_CANDIDATES);
  if (candidatesError) throw candidatesError;

  const candidates: MergeCandidate[] = candidateRows ?? [];
  // Zonder gegenereerde Database-types ziet supabase-js een many-to-one FK-join
  // als array; runtime is het altijd één object.
  const source = rawItem.sources as unknown as { name: string; tier: SourceTier } | null;
  const sourceName = source?.name ?? "onbekende bron";
  const sourceTier = source?.tier ?? 2;

  const result = await mergeAndClassify({
    title: rawItem.title,
    body: rawItem.body,
    sourceName,
    sourceTier,
    candidates,
  });

  // Claude's inhoudelijke oordeel: geen Ajax-connectie (wedtips, algemeen
  // voetbalnieuws, niet-voetbal) → skippen i.p.v. een topic maken.
  if (!result.isRelevant) {
    await supabase.from("raw_items").update({ processing_status: "skipped" }).eq("id", rawItemId);
    return { topicId: null, isNewTopic: false, skipped: true };
  }

  // Claude kan een topic-id teruggeven dat niet in de kandidatenlijst stond
  // (hallucinatie); dan zou de FK op topic_items falen. Behandel als nieuw topic.
  const matchedTopicId =
    result.matchedTopicId && candidates.some((c) => c.id === result.matchedTopicId)
      ? result.matchedTopicId
      : null;

  let topicId = matchedTopicId;
  const reportedAt = rawItem.published_at ?? new Date().toISOString();

  if (!topicId) {
    const slug = `${slugify(result.newTopicTitle ?? rawItem.title)}-${rawItem.id.slice(0, 8)}`;
    const { data: newTopic, error: newTopicError } = await supabase
      .from("topics")
      .insert({
        slug,
        title: result.newTopicTitle ?? rawItem.title,
        category: result.category,
        confidence: confidenceForTier(sourceTier),
        summary: result.newTopicSummary,
        summary_updated_at: new Date().toISOString(),
        first_seen_at: reportedAt,
        last_activity_at: reportedAt,
      })
      .select("id")
      .single();
    if (newTopicError) {
      // 23505 = unique violation op slug: een eerdere (deels mislukte) run
      // maakte dit topic al aan — hergebruik het i.p.v. eeuwig te blijven falen.
      if (newTopicError.code === "23505") {
        const { data: existingTopic, error: existingError } = await supabase
          .from("topics")
          .select("id")
          .eq("slug", slug)
          .single();
        if (existingError) throw existingError;
        topicId = existingTopic.id;
      } else {
        throw newTopicError;
      }
    } else {
      topicId = newTopic.id;
    }
  }

  // confidence_at = de betrouwbaarheid van het topic ná het toevoegen van dit
  // item — bepaalt tegelijk de nieuwe topics.confidence, dus in één keer berekend.
  const { data: existingTierRows, error: tierError } = await supabase
    .from("topic_items")
    .select("sources(tier)")
    .eq("topic_id", topicId);
  if (tierError) throw tierError;

  const tiers = [
    ...(existingTierRows ?? [])
      .map((r) => (r.sources as unknown as { tier: SourceTier } | null)?.tier)
      .filter((t): t is SourceTier => Boolean(t)),
    sourceTier,
  ];
  const bestTier = Math.min(...tiers) as SourceTier; // tier 1 = meest betrouwbaar
  const confidenceAt = confidenceForTier(bestTier);

  const { error: topicItemError } = await supabase.from("topic_items").upsert(
    {
      topic_id: topicId,
      raw_item_id: rawItem.id,
      source_id: rawItem.source_id,
      reported_at: reportedAt,
      snippet: result.snippet,
      contribution: result.contribution,
      confidence_at: confidenceAt,
    },
    { onConflict: "topic_id,raw_item_id", ignoreDuplicates: true }
  );
  if (topicItemError) throw topicItemError;

  await supabase
    .from("raw_items")
    .update({ processing_status: "processed", topic_id: topicId })
    .eq("id", rawItem.id);

  await supabase.from("topics").update({ confidence: confidenceAt }).eq("id", topicId);

  // Nieuwe topics krijgen hun samenvatting direct uit de merge-call hierboven;
  // bestaande topics hebben een herberekening over de volledige tijdlijn nodig.
  // Dedup: één queued summarize-job per topic is genoeg.
  if (matchedTopicId) {
    const { data: pendingSummarize } = await supabase
      .from("jobs")
      .select("id")
      .eq("type", "summarize")
      .eq("status", "queued")
      .contains("payload", { topicId })
      .limit(1)
      .maybeSingle();
    if (!pendingSummarize) {
      await supabase.from("jobs").insert({ type: "summarize", payload: { topicId } });
    }
  }

  return { topicId, isNewTopic: !matchedTopicId };
}
