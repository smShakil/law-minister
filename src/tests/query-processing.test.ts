import { describe, expect, it } from "vitest";

import {
  detectAllArticleReferences,
  extractDetectedArticles,
} from "@/lib/constitution/query/detectArticleReferences";
import { processQuery } from "@/lib/constitution/query/processQuery";
import { tokenize } from "@/lib/constitution/normalize";

describe("processQuery", () => {
  it("detects Article 39 from an explicit article question", () => {
    const processed = processQuery("What does Article 39 say?");
    expect(processed.detectedArticles).toContain("39");
    expect(processed.normalizedQuery).toBe("What does Article 39 say?");
  });

  it("normalizes freedom of speech queries", () => {
    const processed = processQuery("  freedom   of speech  ");
    expect(processed.normalizedQuery).toBe("freedom of speech");
    expect(processed.searchTerms).toEqual(tokenize("freedom of speech"));
  });

  it("detects multiple articles", () => {
    const references = detectAllArticleReferences("Articles 31 and 32");
    expect(extractDetectedArticles(references)).toEqual(
      expect.arrayContaining(["31", "32"]),
    );
  });

  it("detects clause references", () => {
    const processed = processQuery("Article 39 clause 2");
    expect(processed.detectedArticles).toContain("39");
    expect(processed.detectedClauses).toContain("2");
  });
});
