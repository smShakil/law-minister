import type { ArticleReference } from "../types";
import { normalizeArticleNumber } from "../normalize";

const SINGLE_ARTICLE_PATTERN =
  /\b(?:articles?|art\.?)\s*(\d+[a-zA-Z]?)(?:\s*\(\s*(\d+)\s*\))?(?:\s*\(\s*([a-zA-Z])\s*\))?/gi;

const ARTICLE_CLAUSE_PATTERN =
  /\b(?:articles?|art\.?)\s*(\d+[a-zA-Z]?)\s+clause\s+(\d+)/gi;

const MULTI_ARTICLE_PATTERN =
  /\barticles?\s+((?:\d+[a-zA-Z]?\s*,?\s*(?:and\s*)?)+)/gi;

function referenceKey(ref: ArticleReference): string {
  return `${ref.articleNumber}:${ref.clause ?? ""}:${ref.subClause ?? ""}`;
}

function addReference(
  refs: Map<string, ArticleReference>,
  articleNumber: string,
  clause?: string,
  subClause?: string,
): void {
  const ref: ArticleReference = {
    articleNumber: normalizeArticleNumber(articleNumber),
    clause,
    subClause: subClause?.toLowerCase(),
  };
  refs.set(referenceKey(ref), ref);
}

export function detectAllArticleReferences(query: string): ArticleReference[] {
  const refs = new Map<string, ArticleReference>();

  let match: RegExpExecArray | null;

  SINGLE_ARTICLE_PATTERN.lastIndex = 0;
  while ((match = SINGLE_ARTICLE_PATTERN.exec(query)) !== null) {
    const [, articleNumber, clause, subClause] = match;
    addReference(refs, articleNumber, clause ?? undefined, subClause);
  }

  ARTICLE_CLAUSE_PATTERN.lastIndex = 0;
  while ((match = ARTICLE_CLAUSE_PATTERN.exec(query)) !== null) {
    const [, articleNumber, clause] = match;
    addReference(refs, articleNumber, clause);
  }

  MULTI_ARTICLE_PATTERN.lastIndex = 0;
  while ((match = MULTI_ARTICLE_PATTERN.exec(query)) !== null) {
    const articleList = match[1];
    const numbers = articleList.match(/\d+[a-zA-Z]?/g) ?? [];
    for (const articleNumber of numbers) {
      addReference(refs, articleNumber);
    }
  }

  return [...refs.values()];
}

export function extractDetectedClauses(references: ArticleReference[]): string[] {
  const clauses = new Set<string>();
  for (const ref of references) {
    if (ref.clause) {
      clauses.add(ref.clause);
    }
  }
  return [...clauses];
}

export function extractDetectedArticles(references: ArticleReference[]): string[] {
  const articles = new Set<string>();
  for (const ref of references) {
    articles.add(ref.articleNumber);
  }
  return [...articles];
}
