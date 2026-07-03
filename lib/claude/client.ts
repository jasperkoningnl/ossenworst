import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Server-side singleton; nooit importeren in client-componenten. */
export function getClaudeClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/** Kwaliteit/kosten-balans voor merge/samenvatting in Fase 1 (MVP-budget). */
export const CLAUDE_MODEL = "claude-sonnet-5";

/** Goedkoop/snel model voor bulk-taken: vertaling, relevantie-opschoning. */
export const CLAUDE_MODEL_CHEAP = "claude-haiku-4-5-20251001";
