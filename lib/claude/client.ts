import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Server-side singleton; nooit importeren in client-componenten. */
export function getClaudeClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * Model voor tool-use-taken (merge/classificatie, cleanup). Haiku bleek in
 * deze omgeving stelselmatig te falen op tool-use-calls (zie de notitie in
 * cleanup.ts), dus die blijven op Sonnet. De kosten worden elders gedrukt:
 * afgekapte artikelteksten, het gratis keyword-relevantiefilter vóór elke
 * call, en Haiku voor alle platte-tekst-taken.
 */
export const CLAUDE_MODEL = "claude-sonnet-5";

/** Goedkoop/snel model voor platte-tekst-taken: vertaling en samenvatting. */
export const CLAUDE_MODEL_CHEAP = "claude-haiku-4-5-20251001";
