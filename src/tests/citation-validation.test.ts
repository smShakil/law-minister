import { describe, expect, it } from "vitest";

import { validateCitations } from "@/lib/constitution/ask/validateCitations";
import type { AnswerResponse } from "@/lib/constitution/llm/LLMProvider";
import type { RetrievalResult } from "@/lib/constitution/retrieval/types";

const retrievedSources: RetrievalResult[] = [
  {
    sourceId: "article-39",
    articleNumber: "39",
    text: "Freedom of speech text",
    lexicalScore: 1,
    semanticScore: 0.9,
    referenceBoost: 1,
    hybridScore: 0.95,
  },
];

describe("validateCitations", () => {
  it("keeps citations that match retrieved sources", () => {
    const response: AnswerResponse = {
      answer: "Answer",
      citations: [{ sourceId: "article-39", articleNumber: "39" }],
      insufficientContext: false,
    };

    const validated = validateCitations(response, retrievedSources);
    expect(validated.citations).toHaveLength(1);
    expect(validated.citations[0].sourceId).toBe("article-39");
  });

  it("rejects citations not present in retrieved sources", () => {
    const response: AnswerResponse = {
      answer: "Answer",
      citations: [{ sourceId: "article-999", articleNumber: "999" }],
      insufficientContext: false,
    };

    const validated = validateCitations(response, retrievedSources);
    expect(validated.citations).toHaveLength(0);
  });
});
