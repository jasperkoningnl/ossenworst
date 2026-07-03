import { getClaudeClient, CLAUDE_MODEL_CHEAP } from "./client";

export interface SummarizeTimelineEntry {
  sourceName: string;
  snippet: string;
  reportedAt: string;
}

/** Herschrijft de lopende NL-samenvatting van een topic op basis van de volledige tijdlijn. */
export async function summarizeTopic(title: string, timeline: SummarizeTimelineEntry[]): Promise<string> {
  const client = getClaudeClient();

  const timelineText = timeline.map((t) => `- ${t.sourceName} (${t.reportedAt}): ${t.snippet}`).join("\n");

  // Platte tekst zonder tool use: dit werkt (net als de vertaling) prima en
  // veel goedkoper op Haiku.
  const message = await client.messages.create({
    model: CLAUDE_MODEL_CHEAP,
    max_tokens: 512,
    system:
      "Je schrijft de lopende NL-samenvatting van een Ajax-nieuwstopic voor Ossenworst Manager. Stijl: " +
      "'Volgens De Telegraaf...', 'Marca schrijft dat...'. Kort en feitelijk, maximaal 3-4 zinnen, noem " +
      "meerdere bronnen als die verschillende dingen melden. Geef alleen de samenvattende tekst terug, " +
      "zonder inleiding of opmaak.",
    messages: [
      {
        role: "user",
        content: `Topic: ${title}\n\nTijdlijn van meldingen (oud naar nieuw):\n${timelineText}\n\nSchrijf de bijgewerkte samenvatting.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude gaf geen tekstantwoord terug voor summarizeTopic");
  }
  return textBlock.text.trim();
}
