import type { HybridSearchDebugInfo } from "../retrieval/types";

export interface AskSource {
  sourceId: string;
  articleNumber: string;
  clause?: string;
  subClause?: string;
  title?: string;
  text: string;
}

export interface AskResponse {
  answer: string;
  sources: AskSource[];
  citations: Array<{
    sourceId: string;
    articleNumber: string;
    clause?: string;
  }>;
  insufficientContext: boolean;
  debug?: HybridSearchDebugInfo;
}
