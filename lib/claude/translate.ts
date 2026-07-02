import { getClaudeClient } from "./client";

const TRANSLATE_MODEL = "claude-haiku-4-5-20251001";

export interface TranslationResult {
  translatedTitle: string;
  translatedBody: string | null;
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
      'de velden "title" en "body" (body mag null zijn als er geen tekst is).',
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

  try {
    const parsed = JSON.parse(textBlock.text.trim());
    return {
      translatedTitle: parsed.title ?? title,
      translatedBody: parsed.body ?? null,
    };
  } catch {
    return { translatedTitle: textBlock.text.trim(), translatedBody: null };
  }
}
