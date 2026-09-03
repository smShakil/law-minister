import type { AnswerResponse, Citation } from "../llm/LLMProvider";
import type { RetrievalResult } from "../retrieval/types";

export function validateCitations(
  response: AnswerResponse,
  retrievedSources: RetrievalResult[],
): AnswerResponse {
  const allowedSourceIds = new Set(retrievedSources.map((source) => source.sourceId));
  const sourceById = new Map(
    retrievedSources.map((source) => [source.sourceId, source]),
  );

  const validCitations: Citation[] = [];

  for (const citation of response.citations) {
    if (!allowedSourceIds.has(citation.sourceId)) {
      continue;
    }

    const source = sourceById.get(citation.sourceId);
    if (!source) {
      continue;
    }

    validCitations.push({
      sourceId: citation.sourceId,
      articleNumber: source.articleNumber,
      clause: source.clause,
    });
  }

  return {
    ...response,
    citations: validCitations,
  };
}
