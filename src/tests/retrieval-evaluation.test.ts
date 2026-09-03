import { describe, expect, it } from "vitest";

import { resetSearchIndex } from "@/lib/constitution/loader";
import { processQuery } from "@/lib/constitution/query/processQuery";
import { RETRIEVAL_EVALUATION_CASES } from "@/lib/constitution/retrieval-evaluation";
import { lexicalRetrieve } from "@/lib/constitution/retrieval/lexicalSearch";
import {
  hasSufficientRetrieval,
  mergeRetrievalResults,
} from "@/lib/constitution/retrieval/rankResults";

describe("retrieval evaluation cases (lexical component)", () => {
  resetSearchIndex();

  const relevantCases = RETRIEVAL_EVALUATION_CASES.filter(
    (testCase) => testCase.expectedArticles.length > 0,
  );

  it.each(relevantCases.slice(0, 20))(
    "lexical retrieval includes expected articles for $query",
    ({ query, expectedArticles }) => {
      const processed = processQuery(query);
      const lexical = lexicalRetrieve(processed, 10);
      const merged = mergeRetrievalResults(
        lexical,
        [],
        processed,
        { lexical: 0.35, semantic: 0.45, reference: 0.2 },
      );

      for (const articleNumber of expectedArticles) {
        expect(
          merged.some(
            (result) =>
              result.articleNumber.toLowerCase() === articleNumber.toLowerCase(),
          ),
        ).toBe(true);
      }
    },
  );

  it("flags irrelevant questions as insufficient without explicit Article matches", () => {
    const processed = processQuery("best pizza recipe");
    const merged = mergeRetrievalResults(
      [],
      [],
      processed,
      { lexical: 0.35, semantic: 0.45, reference: 0.2 },
    );

    expect(hasSufficientRetrieval(merged, 0.15, processed)).toBe(false);
  });
});
