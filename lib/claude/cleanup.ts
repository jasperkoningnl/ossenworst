import { getClaudeClient, CLAUDE_MODEL } from "./client";

export interface TopicForReview {
  id: string;
  title: string;
  summary: string | null;
}

export interface TopicReviewResult {
  /** Topics zonder Ajax-connectie of zonder actualiteit — worden verwijderd. */
  irrelevantIds: string[];
  /** Groepen topics die hetzelfde verhaal beschrijven — worden samengevoegd. */
  duplicateGroups: string[][];
  /** Topics waarvan de inhoud een officieel bevestigde gebeurtenis beschrijft. */
  confirmedIds: string[];
}

const REVIEW_TOOL = {
  name: "review_topics",
  description:
    "Beoordeel de topiclijst van een Ajax-nieuwsfeed: wijs irrelevante/niet-actuele topics aan, " +
    "groepeer duplicaten die hetzelfde verhaal beschrijven, en markeer topics die inmiddels " +
    "officieel bevestigd zijn.",
  input_schema: {
    type: "object" as const,
    properties: {
      irrelevant_ids: {
        type: "array",
        items: { type: "string" },
        description: "ids van topics zonder duidelijke Ajax-connectie of zonder actualiteit. Leeg array als alles relevant is.",
      },
      duplicate_groups: {
        type: "array",
        items: { type: "array", items: { type: "string" } },
        description:
          "Groepen van 2+ topic-ids die hetzelfde verhaal beschrijven (zelfde transfer/gebeurtenis/persoon) " +
          "en dus samengevoegd moeten worden. Alleen groepen bij duidelijke overlap; leeg array als er geen zijn.",
      },
      confirmed_ids: {
        type: "array",
        items: { type: "string" },
        description:
          "ids van topics waarvan titel/samenvatting een OFFICIEEL bevestigde of afgeronde gebeurtenis " +
          "beschrijft (deal rond, presentatie, officiële mededeling), zodat hun status op 'bevestigd' kan. " +
          "Leeg array als geen enkel topic duidelijk bevestigd is.",
      },
    },
    required: ["irrelevant_ids", "duplicate_groups", "confirmed_ids"],
  },
};

/**
 * Laat Claude een batch bestaande topics beoordelen: opruimen (geen
 * Ajax-connectie of niet actueel), samenvoegen (duplicaten binnen de batch)
 * en bevestigen (inhoud beschrijft een officieel afgeronde gebeurtenis).
 * Twijfelgevallen blijven ongemoeid.
 */
export async function reviewTopics(topics: TopicForReview[]): Promise<TopicReviewResult> {
  if (topics.length === 0) return { irrelevantIds: [], duplicateGroups: [], confirmedIds: [] };
  const client = getClaudeClient();

  const topicList = topics
    .map((t) => `- id=${t.id} | ${t.title}${t.summary ? ` | ${t.summary}` : ""}`)
    .join("\n");

  // Bewust het merge-model en niet het goedkope model: de Haiku-calls bleken
  // in deze omgeving stelselmatig te falen, terwijl dit model aantoonbaar
  // werkt in de pipeline.
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system:
      "Je controleert de topiclijst van Ossenworst Manager, een nieuwsaggregator die uitsluitend ACTUEEL " +
      "nieuws over AFC Ajax toont (club, spelers, staf, transfers, wedstrijden, jeugd). Drie taken:\n" +
      "1. IRRELEVANT: wijs topics aan die er duidelijk niet bij horen. Een topic moet PRIMAIR over Ajax " +
      "gaan; een terloopse vermelding is niet genoeg. Irrelevant zijn: nieuws over andere clubs of hun " +
      "spelers zonder concreet aan Ajax gekoppeld transferverhaal, Oranje/bondscoach-nieuws, algemeen " +
      "competitienieuws, gokpromoties en wedtips, niet-voetbal, én niet-actueel materiaal zoals " +
      "terugblikken, jubileum- en 'op deze dag'-stukken, quizzen en topics die primair over wedstrijden of " +
      "gebeurtenissen van maanden of jaren geleden gaan (bv. een duel uit 2009 of 2018).\n" +
      "2. DUPLICATEN: groepeer topics die hetzelfde verhaal beschrijven — dezelfde transfer, hetzelfde " +
      "gerucht of dezelfde gebeurtenis rond dezelfde persoon, ook als de invalshoek of het stadium " +
      "verschilt (interesse → onderhandeling → afronding is één verhaal).\n" +
      "3. BEVESTIGD: markeer topics waarvan de inhoud een officieel bevestigde of afgeronde gebeurtenis " +
      "beschrijft (transfer rond, contract getekend, presentatie, officiële clubmededeling).\n" +
      "Twijfel je ergens over, laat het topic dan met rust.",
    tools: [REVIEW_TOOL],
    tool_choice: { type: "tool", name: "review_topics" },
    messages: [{ role: "user", content: `TOPICS:\n${topicList}` }],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude gaf geen tool_use-antwoord terug voor review_topics");
  }

  const result = toolUse.input as {
    irrelevant_ids?: string[];
    duplicate_groups?: string[][];
    confirmed_ids?: string[];
  };

  // Alleen ids accepteren die echt in de aangeboden batch zaten.
  const known = new Set(topics.map((t) => t.id));
  const irrelevantIds = (result.irrelevant_ids ?? []).filter((id) => known.has(id));
  const irrelevant = new Set(irrelevantIds);
  const duplicateGroups = (result.duplicate_groups ?? [])
    .map((group) => [...new Set(group)].filter((id) => known.has(id) && !irrelevant.has(id)))
    .filter((group) => group.length >= 2);
  const confirmedIds = (result.confirmed_ids ?? []).filter((id) => known.has(id) && !irrelevant.has(id));

  return { irrelevantIds, duplicateGroups, confirmedIds };
}
