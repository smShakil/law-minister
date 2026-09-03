import { describe, expect, it } from "vitest";

import { processQuery } from "@/lib/constitution/query/processQuery";
import { resetSearchIndex } from "@/lib/constitution/loader";
import { lexicalRetrieve } from "@/lib/constitution/retrieval/lexicalSearch";
import {
  computeHybridScore,
  computeReferenceBoost,
  hasSufficientRetrieval,
  mergeRetrievalResults,
} from "@/lib/constitution/retrieval/rankResults";

describe("hybrid retrieval ranking", () => {
  resetSearchIndex();

  const weights = { lexical: 0.35, semantic: 0.45, reference: 0.2 };

  it("combines lexical and semantic scores deterministically", () => {
    const processed = processQuery("freedom of speech");
    const lexical = lexicalRetrieve(processed, 5);
    const semantic = lexical.map((result) => ({
      ...result,
      semanticScore: result.sourceId.includes("39") ? 0.95 : 0.4,
    }));

    const merged = mergeRetrievalResults(lexical, semantic, processed, weights);
    expect(merged.length).toBeGreaterThan(0);
    expect(merged[0].hybridScore).toBeGreaterThan(0);
  });

  it("merges duplicate documents by sourceId", () => {
    const processed = processQuery("Article 39");
    const merged = mergeRetrievalResults(
      [
        {
          sourceId: "article-39",
          articleNumber: "39",
          text: "Article text",
          lexicalScore: 100,
        },
      ],
      [
        {
          sourceId: "article-39",
          articleNumber: "39",
          text: "Article text",
          semanticScore: 0.8,
        },
      ],
      processed,
      weights,
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].lexicalScore).toBeGreaterThan(0);
    expect(merged[0].semanticScore).toBeGreaterThan(0);
  });

  it("applies a strong reference boost for explicit Article queries", () => {
    const processed = processQuery("What does Article 39 say?");
    const boost39 = computeReferenceBoost(
      "article-39",
      "39",
      undefined,
      undefined,
      processed,
    );
    const boost32 = computeReferenceBoost(
      "article-32",
      "32",
      undefined,
      undefined,
      processed,
    );

    expect(boost39).toBeGreaterThan(boost32);
  });

  it("ranks Article 39 above semantically related articles for Article 39 queries", () => {
    const processed = processQuery("What does Article 39 say?");
    const ranked = mergeRetrievalResults(
      [
        {
          sourceId: "article-39",
          articleNumber: "39",
          text: "Speech text",
          lexicalScore: 100,
        },
        {
          sourceId: "article-26",
          articleNumber: "26",
          text: "Fundamental rights text",
          lexicalScore: 20,
        },
      ],
      [
        {
          sourceId: "article-26",
          articleNumber: "26",
          text: "Fundamental rights text",
          semanticScore: 0.99,
        },
        {
          sourceId: "article-39",
          articleNumber: "39",
          text: "Speech text",
          semanticScore: 0.7,
        },
      ],
      processed,
      weights,
    );

    expect(ranked[0].articleNumber).toBe("39");
  });

  it("computes hybrid score from weighted components", () => {
    const score = computeHybridScore(1, 0.5, 1, weights);
    expect(score).toBeCloseTo(0.35 + 0.225 + 0.2, 5);
  });
});

describe("insufficient retrieval", () => {
  it("rejects unrelated constitutional queries with low scores", () => {
    const processed = processQuery("best pizza recipe");
    const results = mergeRetrievalResults([], [], processed, {
      lexical: 0.35,
      semantic: 0.45,
      reference: 0.2,
    });

    expect(hasSufficientRetrieval(results, 0.15, processed)).toBe(false);
  });

  it("accepts explicit Article queries when the Article is present", () => {
    const processed = processQuery("What does Article 39 say?");
    const results = mergeRetrievalResults(
      [
        {
          sourceId: "article-39",
          articleNumber: "39",
          text: "Speech",
          lexicalScore: 100,
        },
      ],
      [],
      processed,
      { lexical: 0.35, semantic: 0.45, reference: 0.2 },
    );

    expect(hasSufficientRetrieval(results, 0.15, processed)).toBe(true);
  });
});
