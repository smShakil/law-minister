import type { ArticleReference } from "./types";

export const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "of",
  "to",
  "in",
  "what",
  "does",
  "do",
  "can",
  "how",
  "why",
  "for",
  "on",
  "and",
  "or",
  "be",
  "by",
  "with",
  "at",
  "from",
  "that",
  "this",
  "it",
  "as",
  "was",
  "were",
  "has",
  "have",
  "had",
  "will",
  "shall",
  "say",
  "says",
]);

const ARTICLE_REFERENCE_PATTERN =
  /\b(?:article|art\.?)\s*(\d+[a-zA-Z]?)(?:\s*\(\s*(\d+)\s*\))?(?:\s*\(\s*([a-zA-Z])\s*\))?/i;

export function normalizeArticleNumber(articleNumber: string): string {
  const match = articleNumber.trim().match(/^(\d+)([a-zA-Z]?)$/);
  if (!match) {
    return articleNumber.trim().toLowerCase();
  }
  const [, digits, suffix] = match;
  return suffix ? `${digits}${suffix.toLowerCase()}` : digits;
}

export function buildArticleId(articleNumber: string): string {
  return `article-${normalizeArticleNumber(articleNumber)}`;
}

export function buildClauseId(
  articleNumber: string,
  clause: string,
  subClause?: string,
): string {
  const base = `${buildArticleId(articleNumber)}-clause-${clause}`;
  return subClause ? `${base}-${subClause.toLowerCase()}` : base;
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\w\s'"-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeQuery(query: string): string {
  return query.replace(/\s+/g, " ").trim();
}

export function tokenize(text: string, removeStopWords = true): string[] {
  const normalized = normalizeText(text);
  if (!normalized) {
    return [];
  }

  const tokens = normalized
    .split(/\s+/)
    .map((token) => token.replace(/^['"-]+|['"-]+$/g, ""))
    .filter((token) => token.length > 0);

  if (!removeStopWords) {
    return tokens;
  }

  return tokens.filter((token) => !STOP_WORDS.has(token));
}

export function detectArticleReference(query: string): ArticleReference | null {
  const match = query.match(ARTICLE_REFERENCE_PATTERN);
  if (!match) {
    return null;
  }

  const [, articleNumber, clause, subClause] = match;
  return {
    articleNumber: normalizeArticleNumber(articleNumber),
    clause: clause ?? undefined,
    subClause: subClause?.toLowerCase(),
  };
}

export function articleNumbersMatch(
  left: string,
  right: string,
): boolean {
  return normalizeArticleNumber(left) === normalizeArticleNumber(right);
}

export function getArticleUrl(articleNumber: string, clause?: string): string {
  const base = `/constitution/article/${encodeURIComponent(articleNumber)}`;
  return clause ? `${base}#clause-${clause}` : base;
}
