export const SEARCH_WEIGHTS = {
  exactArticleNumber: 100,
  exactClauseReference: 90,
  exactSubClauseReference: 85,
  exactArticleTitle: 50,
  exactPhrase: 25,
  titleToken: 20,
  articleTextToken: 5,
  clauseTextToken: 4,
  subClauseTextToken: 3,
  partChapterToken: 2,
  preambleToken: 1,
} as const;

export const DEFAULT_SEARCH_LIMIT = 10;
export const MAX_SEARCH_LIMIT = 50;
export const MAX_QUERY_LENGTH = 200;
