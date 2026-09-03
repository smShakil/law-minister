import type { RetrievalResult } from "../retrieval/types";

export interface ContextBlock {
  sourceId: string;
  articleNumber: string;
  clause?: string;
  subClause?: string;
  label: string;
  text: string;
}

export function formatSourceLabel(result: RetrievalResult): string {
  let label = `Article ${result.articleNumber}`;
  if (result.clause) {
    label += `(${result.clause})`;
  }
  if (result.subClause) {
    label += `(${result.subClause})`;
  }
  return label;
}

export function buildContext(results: RetrievalResult[]): ContextBlock[] {
  return results.map((result) => ({
    sourceId: result.sourceId,
    articleNumber: result.articleNumber,
    clause: result.clause,
    subClause: result.subClause,
    label: formatSourceLabel(result),
    text: result.text,
  }));
}

export function buildContextPrompt(context: ContextBlock[]): string {
  return context
    .map(
      (block) =>
        `Source: ${block.label} [${block.sourceId}]\n\n${block.text}`,
    )
    .join("\n\n---\n\n");
}
