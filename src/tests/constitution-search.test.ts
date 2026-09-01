import { describe, expect, it } from "vitest";

import { SEARCH_EVALUATION_CASES } from "@/lib/constitution/evaluation";
import { resetSearchIndex } from "@/lib/constitution/loader";
import {
  detectArticleReference,
  normalizeQuery,
  tokenize,
} from "@/lib/constitution/normalize";
import { createSearchSnippet } from "@/lib/constitution/snippets";
import { isEmptyQuery, searchConstitution } from "@/lib/constitution/search";

describe("normalizeQuery", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeQuery("  Article   32  ")).toBe("Article 32");
  });
});

describe("tokenize", () => {
  it("is case-insensitive for matching tokens", () => {
    expect(tokenize("Freedom of Speech")).toEqual(tokenize("freedom of speech"));
    expect(tokenize("FREEDOM OF SPEECH")).toEqual(tokenize("freedom of speech"));
  });
});

describe("detectArticleReference", () => {
  it("detects article references in multiple formats", () => {
    expect(detectArticleReference("Article 32")).toEqual({
      articleNumber: "32",
    });
    expect(detectArticleReference("article 32")).toEqual({
      articleNumber: "32",
    });
    expect(detectArticleReference("Art. 32")).toEqual({
      articleNumber: "32",
    });
    expect(detectArticleReference("Article 32(1)")).toEqual({
      articleNumber: "32",
      clause: "1",
    });
    expect(detectArticleReference("Article 39(2)(a)")).toEqual({
      articleNumber: "39",
      clause: "2",
      subClause: "a",
    });
    expect(detectArticleReference("Article 2A")).toEqual({
      articleNumber: "2a",
    });
    expect(detectArticleReference("Article 7B")).toEqual({
      articleNumber: "7b",
    });
    expect(detectArticleReference("Article 141C")).toEqual({
      articleNumber: "141c",
    });
  });
});

describe("searchConstitution", () => {
  resetSearchIndex();

  it("ranks Article 32 first for an Article 32 query", () => {
    const results = searchConstitution("Article 32");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.articleNumber).toBe("32");
  });

  it("ranks freedom of speech highly toward Article 39", () => {
    const results = searchConstitution("freedom of speech");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((result) => result.articleNumber === "39")).toBe(true);
    expect(results[0]?.articleNumber).toBe("39");
  });

  it("returns no results for nonsense queries", () => {
    expect(searchConstitution("xyzabc123")).toEqual([]);
  });

  it("respects result limits", () => {
    const results = searchConstitution("law", { limit: 5 });
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it("does not search empty queries", () => {
    expect(isEmptyQuery("")).toBe(true);
    expect(isEmptyQuery("   ")).toBe(true);
    expect(searchConstitution("")).toEqual([]);
    expect(searchConstitution("   ")).toEqual([]);
  });
});

describe("createSearchSnippet", () => {
  it("returns a relevant excerpt around matched terms", () => {
    const snippet = createSearchSnippet(
      "This is a longer constitutional provision about freedom of thought and conscience, and of speech, is guaranteed for every citizen under the law.",
      ["speech"],
    );

    expect(snippet.toLowerCase()).toContain("speech");
  });
});

describe("search evaluation cases", () => {
  resetSearchIndex();

  it.each(SEARCH_EVALUATION_CASES)(
    "returns expected articles for $query",
    ({ query, expectedArticles }) => {
      const results = searchConstitution(query, { limit: 10 });
      expect(results.length).toBeGreaterThan(0);

      for (const articleNumber of expectedArticles) {
        expect(
          results.some(
            (result) =>
              result.articleNumber.toLowerCase() ===
              articleNumber.toLowerCase(),
          ),
        ).toBe(true);
      }
    },
  );
});
