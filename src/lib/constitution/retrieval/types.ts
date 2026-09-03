export interface RetrievalDocument {
  sourceId: string;
  articleNumber: string;
  articleTitle?: string;
  partNumber?: string;
  partTitle?: string;
  clause?: string;
  subClause?: string;
  title?: string;
  text: string;
  searchableText: string;
}

export interface RetrievalResult {
  sourceId: string;
  articleNumber: string;
  articleTitle?: string;
  partNumber?: string;
  partTitle?: string;
  clause?: string;
  subClause?: string;
  title?: string;
  text: string;
  lexicalScore: number;
  semanticScore: number;
  referenceBoost: number;
  hybridScore: number;
}

export interface RetrievalWeights {
  lexical: number;
  semantic: number;
  reference: number;
}

export interface HybridSearchOptions {
  lexicalTopK?: number;
  semanticTopK?: number;
  finalTopK?: number;
  minScore?: number;
  weights?: Partial<RetrievalWeights>;
}

export interface HybridSearchDebugInfo {
  originalQuery: string;
  normalizedQuery: string;
  detectedArticles: string[];
  detectedClauses: string[];
  searchTerms: string[];
  lexicalCandidates: Array<{
    sourceId: string;
    articleNumber: string;
    lexicalScore: number;
  }>;
  semanticCandidates: Array<{
    sourceId: string;
    articleNumber: string;
    semanticScore: number;
  }>;
  finalRanked: Array<{
    sourceId: string;
    articleNumber: string;
    lexicalScore: number;
    semanticScore: number;
    referenceBoost: number;
    hybridScore: number;
  }>;
}
