import { SEARCH_WEIGHTS } from "./config";
import { getSearchDocuments } from "./loader";
import { createSearchSnippet } from "./snippets";
import type {
  ArticleReference,
  ConstitutionSearchResult,
  SearchDocument,
  SearchOptions,
} from "./types";
import {
  articleNumbersMatch,
  detectArticleReference,
  normalizeQuery,
  normalizeText,
  tokenize,
} from "./normalize";

function scoreDocument(
  document: SearchDocument,
  query: string,
  queryTokens: string[],
  articleReference: ArticleReference | null,
): { score: number; matchReasons: string[] } {
  let score = 0;
  const matchReasons: string[] = [];
  const searchableText = document.searchableText;
  const normalizedQuery = normalizeText(query);

  if (articleReference) {
    if (
      articleNumbersMatch(document.articleNumber, articleReference.articleNumber)
    ) {
      score += SEARCH_WEIGHTS.exactArticleNumber;
      matchReasons.push("Exact Article number match");

      if (articleReference.clause && document.clause === articleReference.clause) {
        score += SEARCH_WEIGHTS.exactClauseReference;
        matchReasons.push("Exact clause reference match");
      }

      if (
        articleReference.subClause &&
        document.subClause === articleReference.subClause
      ) {
        score += SEARCH_WEIGHTS.exactSubClauseReference;
        matchReasons.push("Exact sub-clause reference match");
      }
    }
  }

  if (document.articleTitle) {
    const normalizedTitle = normalizeText(document.articleTitle);
    if (normalizedTitle === normalizedQuery) {
      score += SEARCH_WEIGHTS.exactArticleTitle;
      matchReasons.push("Exact Article title match");
    }
  }

  if (queryTokens.length >= 2) {
    const phrase = queryTokens.join(" ");
    if (searchableText.includes(phrase)) {
      score += SEARCH_WEIGHTS.exactPhrase;
      matchReasons.push("Exact phrase match");
    }
  }

  if (document.articleTitle) {
    const titleTokens = tokenize(document.articleTitle, false);
    for (const token of queryTokens) {
      if (titleTokens.includes(token)) {
        score += SEARCH_WEIGHTS.titleToken;
        if (!matchReasons.includes("Title keyword match")) {
          matchReasons.push("Title keyword match");
        }
      }
    }
  }

  for (const token of queryTokens) {
    if (!searchableText.includes(token)) {
      continue;
    }

    if (document.clause) {
      if (document.subClause) {
        score += SEARCH_WEIGHTS.subClauseTextToken;
        if (!matchReasons.includes("Sub-clause text match")) {
          matchReasons.push("Sub-clause text match");
        }
      } else {
        score += SEARCH_WEIGHTS.clauseTextToken;
        if (!matchReasons.includes("Clause text match")) {
          matchReasons.push("Clause text match");
        }
      }
    } else if (document.id === "preamble") {
      score += SEARCH_WEIGHTS.preambleToken;
      if (!matchReasons.includes("Preamble match")) {
        matchReasons.push("Preamble match");
      }
    } else if (!document.clause) {
      score += SEARCH_WEIGHTS.articleTextToken;
      if (!matchReasons.includes("Article text match")) {
        matchReasons.push("Article text match");
      }
    }

    if (document.partTitle && normalizeText(document.partTitle).includes(token)) {
      score += SEARCH_WEIGHTS.partChapterToken;
      if (!matchReasons.includes("Part title match")) {
        matchReasons.push("Part title match");
      }
    }
  }

  return { score, matchReasons };
}

function dedupeResults(
  results: ConstitutionSearchResult[],
): ConstitutionSearchResult[] {
  const seen = new Set<string>();
  const deduped: ConstitutionSearchResult[] = [];

  for (const result of results) {
    const key = [
      result.articleNumber,
      result.clause ?? "",
      result.subClause ?? "",
    ].join(":");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(result);
  }

  return deduped;
}

export function searchConstitution(
  rawQuery: string,
  options: SearchOptions = {},
): ConstitutionSearchResult[] {
  const query = normalizeQuery(rawQuery);
  if (!query) {
    return [];
  }

  const limit = options.limit ?? 10;
  const queryTokens = tokenize(query);
  const articleReference = detectArticleReference(query);
  const documents = getSearchDocuments();

  const scored: ConstitutionSearchResult[] = [];

  for (const document of documents) {
    const { score, matchReasons } = scoreDocument(
      document,
      query,
      queryTokens,
      articleReference,
    );

    if (score <= 0) {
      continue;
    }

    scored.push({
      id: document.id,
      articleNumber: document.articleNumber,
      articleTitle: document.articleTitle,
      part: document.part,
      partTitle: document.partTitle,
      chapter: document.chapter,
      chapterTitle: document.chapterTitle,
      clause: document.clause,
      subClause: document.subClause,
      snippet: createSearchSnippet(document.text, queryTokens),
      score,
      matchReasons,
    });
  }

  scored.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    const leftArticle = Number.parseInt(left.articleNumber, 10);
    const rightArticle = Number.parseInt(right.articleNumber, 10);

    if (!Number.isNaN(leftArticle) && !Number.isNaN(rightArticle)) {
      return leftArticle - rightArticle;
    }

    return left.articleNumber.localeCompare(right.articleNumber);
  });

  return dedupeResults(scored).slice(0, limit);
}

export function isEmptyQuery(query: string): boolean {
  return normalizeQuery(query).length === 0;
}
