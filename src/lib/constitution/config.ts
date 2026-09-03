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
export const MAX_ASK_QUESTION_LENGTH = 500;

export const DEFAULT_RETRIEVAL_WEIGHTS = {
  lexical: parseFloat(process.env.RETRIEVAL_LEXICAL_WEIGHT ?? "0.35"),
  semantic: parseFloat(process.env.RETRIEVAL_SEMANTIC_WEIGHT ?? "0.45"),
  reference: parseFloat(process.env.RETRIEVAL_REFERENCE_WEIGHT ?? "0.20"),
} as const;

export const DEFAULT_RETRIEVAL_TOP_K = {
  lexical: parseInt(process.env.RETRIEVAL_LEXICAL_TOP_K ?? "10", 10),
  semantic: parseInt(process.env.RETRIEVAL_SEMANTIC_TOP_K ?? "10", 10),
  final: parseInt(process.env.RETRIEVAL_FINAL_TOP_K ?? "6", 10),
} as const;

export const DEFAULT_RETRIEVAL_MIN_SCORE = parseFloat(
  process.env.RETRIEVAL_MIN_SCORE ?? "0.15",
);

export const EMBEDDING_DIMENSION = parseInt(
  process.env.EMBEDDING_DIMENSION ?? "1536",
  10,
);

export const isDevelopment = process.env.NODE_ENV === "development";
