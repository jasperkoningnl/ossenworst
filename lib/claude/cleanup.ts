import { getClaudeClient, CLAUDE_MODEL } from "./client";

export interface TopicForReview {
  id: string;
  title: string;
  summary: string | null;
}

const REVIEW_TOOL = {
  name: "flag_irrelevant_topics",
  description:
    "Wijs de topics aan die geen duidelijke connectie met AFC Ajax hebben of niet actueel zijn, " +
    "en dus niet in een Ajax-nieuwsfeed thuishoren.",
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

  // Bewust het merge-model en niet het goedkope model: de Haiku-calls bleken
  // in deze omgeving stelselmatig te falen (zie reviewErrorMessages in de
  // cleanup-response), terwijl dit model aantoonbaar werkt in de pipeline.
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system:
      "Je controleert de topiclijst van Ossenworst Manager, een nieuwsaggregator die uitsluitend ACTUEEL " +
      "nieuws over AFC Ajax toont (club, spelers, staf, transfers, wedstrijden, jeugd). Wijs topics aan " +
      "die daar duidelijk NIET bij horen: algemeen voetbal-/competitienieuws zonder Ajax-link, gokpromoties " +
      "en wedtips, nieuws dat niets met voetbal te maken heeft, én niet-actueel materiaal zoals " +
      "terugblikken, jubileum- en 'op deze dag'-stukken, quizzen en topics die primair over wedstrijden of " +
      "gebeurtenissen van maanden of jaren geleden gaan (bv. een duel uit 2009 of 2018). " +
      "Twijfel je, laat het topic dan staan.",
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
