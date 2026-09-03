import { normalizeQuery, tokenize } from "../normalize";
import type { ArticleReference } from "../types";
import {
  detectAllArticleReferences,
  extractDetectedArticles,
  extractDetectedClauses,
} from "./detectArticleReferences";

export interface ProcessedQuery {
  originalQuery: string;
  normalizedQuery: string;
  detectedArticles: string[];
  detectedClauses: string[];
  detectedReferences: ArticleReference[];
  searchTerms: string[];
}

export function processQuery(rawQuery: string): ProcessedQuery {
  const originalQuery = rawQuery;
  const normalizedQuery = normalizeQuery(rawQuery);
  const detectedReferences = detectAllArticleReferences(normalizedQuery);
  const detectedArticles = extractDetectedArticles(detectedReferences);
  const detectedClauses = extractDetectedClauses(detectedReferences);
  const searchTerms = tokenize(normalizedQuery);

  return {
    originalQuery,
    normalizedQuery,
    detectedArticles,
    detectedClauses,
    detectedReferences,
    searchTerms,
  };
}
