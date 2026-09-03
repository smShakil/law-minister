import { getSearchDocuments } from "../loader";
import { searchConstitution } from "../search";
import type { ProcessedQuery } from "../query/processQuery";
import type { RetrievalResult } from "./types";

export function lexicalRetrieve(
  processedQuery: ProcessedQuery,
  topK: number,
): Array<Omit<RetrievalResult, "semanticScore" | "referenceBoost" | "hybridScore">> {
  const results = searchConstitution(processedQuery.normalizedQuery, {
    limit: topK,
  });
  const documentsById = new Map(
    getSearchDocuments().map((document) => [document.id, document]),
  );

  return results.map((result) => {
    const document = documentsById.get(result.id);
    return {
      sourceId: result.id,
      articleNumber: result.articleNumber,
      articleTitle: result.articleTitle,
      partNumber: result.part,
      partTitle: result.partTitle,
      clause: result.clause,
      subClause: result.subClause,
      title: result.articleTitle,
      text: document?.text ?? result.snippet,
      lexicalScore: result.score,
    };
  });
}
