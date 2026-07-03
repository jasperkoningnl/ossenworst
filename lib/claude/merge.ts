import { getClaudeClient, CLAUDE_MODEL } from "./client";
import { TOPIC_CATEGORIES, type ConfidenceSignal, type TopicCategory } from "@/lib/types/enums";

export interface MergeCandidate {
  id: string;
  title: string;
  category: TopicCategory;
  summary: string | null;
}

export interface MergeInput {
  title: string;
  body: string | null;
  sourceName: string;
  sourceTier: 1 | 2 | 3;
  candidates: MergeCandidate[];
}

export type Contribution = "nieuw" | "bevestigt" | "nuanceert" | "detail";

export interface MergeResult {
  /** false = geen duidelijke Ajax-connectie; item wordt geskipt i.p.v. getopicaliseerd. */
  isRelevant: boolean;
  matchedTopicId: string | null;
  category: TopicCategory;
  snippet: string;
  contribution: Contribution;
  confidenceSignal: ConfidenceSignal;
  /** Alleen gezet als matchedTopicId null is (nieuw topic). */
  newTopicTitle: string | null;
  newTopicSummary: string | null;
}

const MERGE_TOOL = {
  name: "classify_and_merge",
  description:
    "Bepaal of een nieuw artikel bij een bestaand Ajax-nieuwstopic hoort (zelfde gebeurtenis/gerucht) of een nieuw topic start.",
  input_schema: {
    type: "object" as const,
    properties: {
      is_relevant: {
        type: "boolean",
        description:
          "false als het artikel niet PRIMAIR over AFC Ajax gaat. Een terloopse Ajax-vermelding is niet genoeg: " +
          "nieuws over andere clubs of hun spelers, Oranje/bondscoach-nieuws, algemeen competitienieuws, " +
          "gokpromoties en wedtips, of niet-voetbal is allemaal false — tenzij het een concreet, aan Ajax " +
          "gekoppeld transferverhaal is (speler wordt expliciet met Ajax in verband gebracht). " +
          "Ook false voor niet-actueel materiaal: terugblikken, jubileum- en 'op deze dag'-stukken, " +
          "quizzen en artikelen die primair over wedstrijden of gebeurtenissen van maanden of jaren geleden gaan. " +
          "Bij false mogen de overige velden nominale waarden bevatten.",
      },
      matched_topic_id: {
        type: ["string", "null"],
        description: "id van het gematchte bestaande topic, of null als er geen duidelijke match is.",
      },
      category: { type: "string", enum: [...TOPIC_CATEGORIES] },
      snippet: {
        type: "string",
        description: "Eén NL-zin: wat deze specifieke bron meldt (voor de tijdlijn).",
      },
      contribution: {
        type: "string",
        enum: ["nieuw", "bevestigt", "nuanceert", "detail"],
        description: "nieuw = start een topic, bevestigt/nuanceert/detail = aard van de bijdrage aan een bestaand topic.",
      },
      confidence_signal: {
        type: "string",
        enum: ["bevestigd", "gerucht", "speculatie"],
        description:
          "Wat het ARTIKEL INHOUDELIJK meldt: 'bevestigd' = officieel afgerond of door club/speler bevestigd " +
          "(deal rond, presentatie, officiële mededeling, medische keuring doorstaan, 'definitief'); " +
          "'gerucht' = serieuze berichtgeving over iets dat nog niet rond is (interesse, onderhandelingen, " +
          "bod); 'speculatie' = talkshowpraat, columns, opinies of geruchten zonder eigen bronnen.",
      },
      new_topic_title: {
        type: ["string", "null"],
        description: "Korte NL-kop voor het topic. Alleen invullen als matched_topic_id null is.",
      },
      new_topic_summary: {
        type: ["string", "null"],
        description:
          "1-2 zinnen NL in de stijl 'Volgens De Telegraaf...'. Alleen invullen als matched_topic_id null is.",
      },
    },
    required: ["is_relevant", "matched_topic_id", "category", "snippet", "contribution", "confidence_signal"],
  },
};

/** Artikeltekst afkappen vóór de call: de eerste alinea's zijn genoeg om te
 * classificeren/matchen, en dit drukt de input-tokens (= kosten) flink bij
 * bronnen die volledige artikelen meesturen. */
const MAX_BODY_CHARS = 1500;

export async function mergeAndClassify(input: MergeInput): Promise<MergeResult> {
  const client = getClaudeClient();

  const body =
    input.body && input.body.length > MAX_BODY_CHARS
      ? `${input.body.slice(0, MAX_BODY_CHARS)}…`
      : input.body;

  const candidateList = input.candidates
    .map((c) => `- id=${c.id} | ${c.title} | categorie=${c.category} | samenvatting=${c.summary ?? "(geen)"}`)
    .join("\n");

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system:
      "Je bent de merge-motor van Ossenworst Manager, een Ajax-nieuwsaggregator. Je krijgt een nieuw " +
      "artikel en een lijst van bestaande topics (lopende verhalen van de afgelopen 14 dagen). Beoordeel " +
      "EERST of het artikel een duidelijke connectie met AFC Ajax heeft (club, spelers, staf, transfers, " +
      "wedstrijden of jeugd van Ajax). Geen Ajax-connectie — zoals algemeen voetbalnieuws over andere clubs " +
      "of toernooien, gokpromoties/wedtips of nieuws buiten het voetbal — betekent is_relevant=false. " +
      "Het artikel moet PRIMAIR over Ajax gaan; een terloopse vermelding is niet genoeg. " +
      "De feed toont uitsluitend ACTUEEL nieuws: terugblikken, jubileum- en 'op deze dag'-artikelen, quizzen " +
      "en stukken die primair over wedstrijden of gebeurtenissen van maanden of jaren geleden gaan (bv. een " +
      "duel uit 2009 of 2018) zijn óók is_relevant=false, hoe prominent Ajax er ook in voorkomt. " +
      "Is het wel relevant, bepaal dan of het artikel hetzelfde verhaal is als een bestaand topic of een " +
      "nieuw topic moet starten. Berichten over dezelfde transfer, hetzelfde gerucht of dezelfde gebeurtenis " +
      "rond dezelfde persoon horen bij ÉÉN topic — ook als de invalshoek, details of het stadium van het " +
      "verhaal verschillen (interesse → onderhandeling → afronding is één doorlopend verhaal). Match dus op " +
      "persoon + verhaal, en wees alleen terughoudend bij écht verschillende verhalen (andere persoon of " +
      "andere gebeurtenis).",
    tools: [MERGE_TOOL],
    tool_choice: { type: "tool", name: "classify_and_merge" },
    messages: [
      {
        role: "user",
        content:
          `NIEUW ARTIKEL\nBron: ${input.sourceName} (tier ${input.sourceTier})\n` +
          `Titel: ${input.title}\nInhoud: ${body ?? "(geen tekst)"}\n\n` +
          `BESTAANDE TOPICS (laatste 14 dagen):\n${candidateList || "(geen)"}`,
      },
    ],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude gaf geen tool_use-antwoord terug voor classify_and_merge");
  }

  const result = toolUse.input as {
    is_relevant: boolean;
    matched_topic_id: string | null;
    category: TopicCategory;
    snippet: string;
    contribution: Contribution;
    confidence_signal?: ConfidenceSignal;
    new_topic_title?: string | null;
    new_topic_summary?: string | null;
  };

  return {
    isRelevant: result.is_relevant !== false,
    matchedTopicId: result.matched_topic_id,
    category: result.category,
    snippet: result.snippet,
    contribution: result.contribution,
    confidenceSignal: result.confidence_signal ?? "gerucht",
    newTopicTitle: result.new_topic_title ?? null,
    newTopicSummary: result.new_topic_summary ?? null,
  };
}
