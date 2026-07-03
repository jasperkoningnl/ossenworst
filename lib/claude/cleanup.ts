import { getClaudeClient, CLAUDE_MODEL_CHEAP } from "./client";

export interface TopicForReview {
  id: string;
  title: string;
  summary: string | null;
}

const REVIEW_TOOL = {
  name: "flag_irrelevant_topics",
  description:
    "Wijs de topics aan die geen duidelijke connectie met AFC Ajax hebben en dus niet in een Ajax-nieuwsfeed thuishoren.",
  input_schema: {
    type: "object" as const,
    properties: {
      irrelevant_ids: {
        type: "array",
        items: { type: "string" },
        description: "ids van topics zonder duidelijke Ajax-connectie. Leeg array als alles relevant is.",
      },
    },
    required: ["irrelevant_ids"],
  },
};

/**
 * Laat Claude (goedkoop model) beoordelen welke bestaande topics geen
 * Ajax-connectie hebben — opruimactie voor topics die zijn aangemaakt toen
 * het relevantiefilter nog te ruim stond. Twijfelgevallen blijven staan.
 */
export async function findIrrelevantTopicIds(topics: TopicForReview[]): Promise<string[]> {
  if (topics.length === 0) return [];
  const client = getClaudeClient();

  const topicList = topics
    .map((t) => `- id=${t.id} | ${t.title}${t.summary ? ` | ${t.summary}` : ""}`)
    .join("\n");

  const message = await client.messages.create({
    model: CLAUDE_MODEL_CHEAP,
    max_tokens: 2048,
    system:
      "Je controleert de topiclijst van Ossenworst Manager, een nieuwsaggregator die uitsluitend over " +
      "AFC Ajax gaat (club, spelers, staf, transfers, wedstrijden, jeugd). Wijs topics aan die daar " +
      "duidelijk NIET bij horen: algemeen voetbal-/competitienieuws zonder Ajax-link, gokpromoties en " +
      "wedtips, en nieuws dat niets met voetbal te maken heeft. Twijfel je, laat het topic dan staan.",
    tools: [REVIEW_TOOL],
    tool_choice: { type: "tool", name: "flag_irrelevant_topics" },
    messages: [{ role: "user", content: `TOPICS:\n${topicList}` }],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude gaf geen tool_use-antwoord terug voor flag_irrelevant_topics");
  }

  const flagged = (toolUse.input as { irrelevant_ids?: string[] }).irrelevant_ids ?? [];
  // Alleen ids accepteren die echt in de aangeboden batch zaten.
  const known = new Set(topics.map((t) => t.id));
  return flagged.filter((id) => known.has(id));
}
