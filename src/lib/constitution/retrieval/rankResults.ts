import { articleNumbersMatch } from "../normalize";
import type { ProcessedQuery } from "../query/processQuery";
import type { ArticleReference } from "../types";
import type { RetrievalResult, RetrievalWeights } from "./types";

export function normalizeScore(score: number, maxScore: number): number {
  if (maxScore <= 0) {
    return 0;
  }
  return Math.min(score / maxScore, 1);
}

export function computeReferenceBoost(
  sourceId: string,
  articleNumber: string,
  clause: string | undefined,
  subClause: string | undefined,
  processedQuery: ProcessedQuery,
): number {
  if (processedQuery.detectedArticles.length === 0) {
    return 0;
  }

  for (const reference of processedQuery.detectedReferences) {
    if (!articleNumbersMatch(articleNumber, reference.articleNumber)) {
      continue;
    }

    if (reference.clause) {
      if (clause === reference.clause) {
        if (reference.subClause) {
          return subClause === reference.subClause ? 1 : 0.85;
        }
        return 1;
      }
      return 0.7;
    }

    if (reference.subClause && subClause === reference.subClause) {
      return 0.9;
    }

    const articleLevelId = `article-${reference.articleNumber}`;
    if (sourceId === articleLevelId || sourceId.startsWith(`${articleLevelId}-`)) {
      return 1;
    }

    return 0.95;
  }

  return 0;
}

export function computeHybridScore(
  lexicalScore: number,
  semanticScore: number,
  referenceBoost: number,
  weights: RetrievalWeights,
): number {
  return (
    weights.lexical * lexicalScore +
    weights.semantic * semanticScore +
    weights.reference * referenceBoost
  );
}

function matchesReference(
  articleNumber: string,
  clause: string | undefined,
  reference: ArticleReference,
): boolean {
  if (!articleNumbersMatch(articleNumber, reference.articleNumber)) {
    return false;
  }
  if (reference.clause && clause !== reference.clause) {
    return false;
  }
  return true;
}

export function mergeRetrievalResults(
  lexicalResults: Array<
    Omit<RetrievalResult, "semanticScore" | "referenceBoost" | "hybridScore">
  >,
  semanticResults: Array<
    Omit<RetrievalResult, "lexicalScore" | "referenceBoost" | "hybridScore">
  >,
  processedQuery: ProcessedQuery,
  weights: RetrievalWeights,
): RetrievalResult[] {
  const merged = new Map<string, RetrievalResult>();

  const lexicalMax = Math.max(...lexicalResults.map((r) => r.lexicalScore), 1);
  const semanticMax = Math.max(...semanticResults.map((r) => r.semanticScore), 1);

  for (const result of lexicalResults) {
    merged.set(result.sourceId, {
      ...result,
      lexicalScore: normalizeScore(result.lexicalScore, lexicalMax),
      semanticScore: 0,
      referenceBoost: computeReferenceBoost(
        result.sourceId,
        result.articleNumber,
        result.clause,
        result.subClause,
        processedQuery,
      ),
      hybridScore: 0,
    });
  }

  for (const result of semanticResults) {
    const existing = merged.get(result.sourceId);
    const normalizedSemantic = normalizeScore(result.semanticScore, semanticMax);

    if (existing) {
      existing.semanticScore = normalizedSemantic;
    } else {
      merged.set(result.sourceId, {
        ...result,
        lexicalScore: 0,
        semanticScore: normalizedSemantic,
        referenceBoost: computeReferenceBoost(
          result.sourceId,
          result.articleNumber,
          result.clause,
          result.subClause,
          processedQuery,
        ),
        hybridScore: 0,
      });
    }
  }

  const ranked = [...merged.values()].map((result) => ({
    ...result,
    hybridScore: computeHybridScore(
      result.lexicalScore,
      result.semanticScore,
      result.referenceBoost,
      weights,
    ),
  }));

  ranked.sort((left, right) => {
    if (right.hybridScore !== left.hybridScore) {
      return right.hybridScore - left.hybridScore;
    }

    if (right.referenceBoost !== left.referenceBoost) {
      return right.referenceBoost - left.referenceBoost;
    }

    const leftArticle = Number.parseInt(left.articleNumber, 10);
    const rightArticle = Number.parseInt(right.articleNumber, 10);
    if (!Number.isNaN(leftArticle) && !Number.isNaN(rightArticle)) {
      return leftArticle - rightArticle;
    }

    return left.sourceId.localeCompare(right.sourceId);
  });

  return ranked;
}

export function hasExplicitArticleMatch(
  results: RetrievalResult[],
  processedQuery: ProcessedQuery,
): boolean {
  if (processedQuery.detectedArticles.length === 0) {
    return true;
  }

  return results.some((result) =>
    processedQuery.detectedReferences.some((reference) =>
      matchesReference(result.articleNumber, result.clause, reference),
    ),
  );
}

export function hasSufficientRetrieval(
  results: RetrievalResult[],
  minScore: number,
  processedQuery: ProcessedQuery,
): boolean {
  if (results.length === 0) {
    return false;
  }

  if (processedQuery.detectedArticles.length > 0) {
    return hasExplicitArticleMatch(results, processedQuery);
  }

  return results[0].hybridScore >= minScore;
}
