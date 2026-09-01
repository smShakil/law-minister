export { DEFAULT_SEARCH_LIMIT, MAX_QUERY_LENGTH, MAX_SEARCH_LIMIT, SEARCH_WEIGHTS } from "./config";
export {
  articleNumbersMatch,
  buildArticleId,
  buildClauseId,
  detectArticleReference,
  getArticleUrl,
  normalizeArticleNumber,
  normalizeQuery,
  normalizeText,
  STOP_WORDS,
  tokenize,
} from "./normalize";
export { createSearchSnippet, escapeRegExp } from "./snippets";
export {
  buildSearchApiUrl,
  buildSearchPageUrl,
  parseSearchLimit,
} from "./search-params";
export type {
  ArticleReference,
  ConstitutionArticle,
  ConstitutionClause,
  ConstitutionDataset,
  ConstitutionMetadata,
  ConstitutionPart,
  ConstitutionSearchResult,
  SearchApiResponse,
  SearchDocument,
  SearchEvaluationCase,
  SearchOptions,
} from "./types";
