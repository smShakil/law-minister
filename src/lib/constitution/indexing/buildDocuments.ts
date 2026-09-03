import { createHash } from "node:crypto";

import type { SearchDocument } from "../types";
import type { RetrievalDocument } from "../retrieval/types";

export function computeContentHash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function toRetrievalDocument(document: SearchDocument): RetrievalDocument {
  return {
    sourceId: document.id,
    articleNumber: document.articleNumber,
    articleTitle: document.articleTitle,
    partNumber: document.part,
    partTitle: document.partTitle,
    clause: document.clause,
    subClause: document.subClause,
    title: document.articleTitle,
    text: document.text,
    searchableText: document.searchableText,
  };
}

export function buildIndexingText(document: RetrievalDocument): string {
  return [
    document.articleTitle,
    document.articleNumber,
    document.clause ? `clause ${document.clause}` : undefined,
    document.subClause ? `sub-clause ${document.subClause}` : undefined,
    document.text,
  ]
    .filter(Boolean)
    .join("\n");
}
