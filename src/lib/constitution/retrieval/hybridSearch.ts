import "server-only";

import {
  DEFAULT_RETRIEVAL_MIN_SCORE,
  DEFAULT_RETRIEVAL_TOP_K,
  DEFAULT_RETRIEVAL_WEIGHTS,
} from "../config";
import type { ProcessedQuery } from "../query/processQuery";
import { lexicalRetrieve } from "./lexicalSearch";
import {
  hasSufficientRetrieval,
  mergeRetrievalResults,
} from "./rankResults";
import type {
  HybridSearchDebugInfo,
  HybridSearchOptions,
  RetrievalResult,
  RetrievalWeights,
} from "./types";
import { vectorRetrieve } from "./vectorSearch";

function resolveWeights(
  overrides?: Partial<RetrievalWeights>,
): RetrievalWeights {
  return {
    lexical: overrides?.lexical ?? DEFAULT_RETRIEVAL_WEIGHTS.lexical,
    semantic: overrides?.semantic ?? DEFAULT_RETRIEVAL_WEIGHTS.semantic,
    reference: overrides?.reference ?? DEFAULT_RETRIEVAL_WEIGHTS.reference,
  };
}

function buildDebugInfo(
  processedQuery: ProcessedQuery,
  lexicalResults: Array<{ sourceId: string; articleNumber: string; lexicalScore: number }>,
  semanticResults: Array<{ sourceId: string; articleNumber: string; semanticScore: number }>,
  finalResults: RetrievalResult[],
): HybridSearchDebugInfo {
  return {
    originalQuery: processedQuery.originalQuery,
    normalizedQuery: processedQuery.normalizedQuery,
    detectedArticles: processedQuery.detectedArticles,
    detectedClauses: processedQuery.detectedClauses,
    searchTerms: processedQuery.searchTerms,
    lexicalCandidates: lexicalResults.map((result) => ({
      sourceId: result.sourceId,
      articleNumber: result.articleNumber,
      lexicalScore: result.lexicalScore,
    })),
    semanticCandidates: semanticResults.map((result) => ({
      sourceId: result.sourceId,
      articleNumber: result.articleNumber,
      semanticScore: result.semanticScore,
    })),
    finalRanked: finalResults.map((result) => ({
      sourceId: result.sourceId,
      articleNumber: result.articleNumber,
      lexicalScore: result.lexicalScore,
      semanticScore: result.semanticScore,
      referenceBoost: result.referenceBoost,
      hybridScore: result.hybridScore,
    })),
  };
}

export interface HybridSearchResponse {
  results: RetrievalResult[];
  sufficient: boolean;
  debug?: HybridSearchDebugInfo;
}

export async function hybridSearch(
  processedQuery: ProcessedQuery,
  options: HybridSearchOptions = {},
): Promise<HybridSearchResponse> {
  const lexicalTopK = options.lexicalTopK ?? DEFAULT_RETRIEVAL_TOP_K.lexical;
  const semanticTopK = options.semanticTopK ?? DEFAULT_RETRIEVAL_TOP_K.semantic;
  const finalTopK = options.finalTopK ?? DEFAULT_RETRIEVAL_TOP_K.final;
  const minScore = options.minScore ?? DEFAULT_RETRIEVAL_MIN_SCORE;
  const weights = resolveWeights(options.weights);

  const [lexicalResults, semanticResults] = await Promise.all([
    Promise.resolve(lexicalRetrieve(processedQuery, lexicalTopK)),
    vectorRetrieve(processedQuery, semanticTopK),
  ]);

  const ranked = mergeRetrievalResults(
    lexicalResults,
    semanticResults,
    processedQuery,
    weights,
  );

  const finalResults = ranked.slice(0, finalTopK);
  const sufficient = hasSufficientRetrieval(finalResults, minScore, processedQuery);

  return {
    results: finalResults,
    sufficient,
    debug: buildDebugInfo(processedQuery, lexicalResults, semanticResults, finalResults),
  };
}
