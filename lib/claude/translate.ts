import { getClaudeClient } from "./client";

export const TRANSLATE_MODEL = "claude-haiku-4-5-20251001";

export interface TranslationResult {
  translatedTitle: string;
  translatedBody: string | null;
}

/** Haalt eventuele ```json-fences rond het antwoord weg vóór het parsen. */
function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export async function translateToNl(
  title: string,
  body: string | null,
  sourceLanguage: string
): Promise<TranslationResult> {
  const client = getClaudeClient();

  const message = await client.messages.create({
    model: TRANSLATE_MODEL,
    max_tokens: 1024,
    system:
      "Je bent een vertaler voor Ossenworst Manager, een Ajax-nieuwsaggregator. " +
      "Vertaal de gegeven titel en tekst naar natuurlijk Nederlands. Behoud de " +
      "journalistieke stijl en eigennamen. Geef je antwoord als JSON met exact " +
      'de velden "title" en "body" (body mag null zijn als er geen tekst is), ' +
      "zonder codeblokken of andere opmaak eromheen.",
    messages: [
      {
        role: "user",
        content:
          `Brontaal: ${sourceLanguage}\n\n` +
          `Titel: ${title}\n\n` +
          `Tekst: ${body ?? "(geen tekst)"}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude gaf geen tekstantwoord terug voor vertaling");
  }

  let parsed: { title?: string; body?: string | null };
  try {
    parsed = JSON.parse(stripCodeFences(textBlock.text));
  } catch {
    // Niet-parsebaar antwoord bewust niet als "vertaling" teruggeven: de
    // aanroeper zou de ruwe modeloutput dan permanent cachen. Gooien laat de
    // pipeline terugvallen op de originele tekst zonder te cachen.
    throw new Error("Vertaalantwoord was geen geldige JSON");
  }
  return {
    translatedTitle: parsed.title ?? title,
    translatedBody: parsed.body ?? null,
  };
}
