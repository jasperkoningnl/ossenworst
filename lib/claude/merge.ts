import { getClaudeClient, CLAUDE_MODEL } from "./client";
import { TOPIC_CATEGORIES, type TopicCategory } from "@/lib/types/enums";

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
  matchedTopicId: string | null;
  category: TopicCategory;
  snippet: string;
  contribution: Contribution;
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
    required: ["matched_topic_id", "category", "snippet", "contribution"],
  },
};

export async function mergeAndClassify(input: MergeInput): Promise<MergeResult> {
  const client = getClaudeClient();

  const candidateList = input.candidates
    .map((c) => `- id=${c.id} | ${c.title} | categorie=${c.category} | samenvatting=${c.summary ?? "(geen)"}`)
    .join("\n");

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system:
      "Je bent de merge-motor van Ossenworst Manager, een Ajax-nieuwsaggregator. Je krijgt een nieuw " +
      "artikel en een lijst van bestaande topics (lopende verhalen van de afgelopen 14 dagen). Bepaal of " +
      "het artikel hetzelfde verhaal is als een bestaand topic (zelfde transfer/gebeurtenis/persoon) of een " +
      "nieuw topic moet starten. Wees conservatief: match alleen bij duidelijke inhoudelijke overlap.",
    tools: [MERGE_TOOL],
    tool_choice: { type: "tool", name: "classify_and_merge" },
    messages: [
      {
        role: "user",
        content:
          `NIEUW ARTIKEL\nBron: ${input.sourceName} (tier ${input.sourceTier})\n` +
          `Titel: ${input.title}\nInhoud: ${input.body ?? "(geen tekst)"}\n\n` +
          `BESTAANDE TOPICS (laatste 14 dagen):\n${candidateList || "(geen)"}`,
      },
    ],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude gaf geen tool_use-antwoord terug voor classify_and_merge");
  }

  const result = toolUse.input as {
    matched_topic_id: string | null;
    category: TopicCategory;
    snippet: string;
    contribution: Contribution;
    new_topic_title?: string | null;
    new_topic_summary?: string | null;
  };

  return {
    matchedTopicId: result.matched_topic_id,
    category: result.category,
    snippet: result.snippet,
    contribution: result.contribution,
    newTopicTitle: result.new_topic_title ?? null,
    newTopicSummary: result.new_topic_summary ?? null,
  };
}
