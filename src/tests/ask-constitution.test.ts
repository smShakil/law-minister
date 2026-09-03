import { describe, expect, it } from "vitest";

import { askConstitution } from "@/lib/constitution/ask/askConstitution";
import { MockLLMProvider } from "@/lib/constitution/llm/createLLMProvider";
import { processQuery } from "@/lib/constitution/query/processQuery";
import { resetSearchIndex } from "@/lib/constitution/loader";
import { lexicalRetrieve } from "@/lib/constitution/retrieval/lexicalSearch";
import {
  hasSufficientRetrieval,
  mergeRetrievalResults,
} from "@/lib/constitution/retrieval/rankResults";

describe("askConstitution", () => {
  resetSearchIndex();

  it("returns insufficient context when retrieval is weak", async () => {
    const response = await askConstitution("best pizza recipe in dhaka", {
      hybridSearchFn: async (processedQuery) => ({
        results: [],
        sufficient: false,
      }),
      llmProvider: new MockLLMProvider(),
    });

    expect(response.insufficientContext).toBe(true);
    expect(response.sources).toHaveLength(0);
  });

  it("returns a grounded response with validated sources", async () => {
    const response = await askConstitution("What does Article 39 say?", {
      hybridSearchFn: async (processedQuery) => {
        const lexical = lexicalRetrieve(processedQuery, 5);
        const results = mergeRetrievalResults(
          lexical,
          [],
          processedQuery,
          { lexical: 0.35, semantic: 0.45, reference: 0.2 },
        );

        return {
          results,
          sufficient: hasSufficientRetrieval(results, 0.15, processedQuery),
        };
      },
      llmProvider: new MockLLMProvider(),
    });

    expect(response.insufficientContext).toBe(false);
    expect(response.answer.length).toBeGreaterThan(0);
    expect(response.sources.length).toBeGreaterThan(0);
    expect(response.citations.length).toBeGreaterThan(0);
  });
});

describe("ask API validation helpers", () => {
  it("processes valid constitutional questions", () => {
    const processed = processQuery("Can freedom of speech be restricted by law?");
    expect(processed.searchTerms.length).toBeGreaterThan(0);
  });
});
