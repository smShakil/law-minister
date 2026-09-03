import "server-only";

import { query } from "@/lib/db/client";

import { createEmbeddingProvider } from "../embeddings/createEmbeddingProvider";
import type { ProcessedQuery } from "../query/processQuery";
import type { RetrievalResult } from "./types";

interface VectorSearchRow {
  source_id: string;
  article_number: string;
  article_title: string | null;
  part_number: string | null;
  part_title: string | null;
  clause: string | null;
  sub_clause: string | null;
  title: string | null;
  text: string;
  semantic_score: number;
}

function formatEmbedding(values: number[]): string {
  return `[${values.join(",")}]`;
}

export async function vectorRetrieve(
  processedQuery: ProcessedQuery,
  topK: number,
): Promise<Array<Omit<RetrievalResult, "lexicalScore" | "referenceBoost" | "hybridScore">>> {
  const embeddingProvider = createEmbeddingProvider();
  const queryEmbedding = await embeddingProvider.embed(processedQuery.normalizedQuery);

  const rows = await query<VectorSearchRow>(
    `
      SELECT
        source_id,
        article_number,
        article_title,
        part_number,
        part_title,
        clause,
        sub_clause,
        title,
        text,
        1 - (embedding <=> $1::vector) AS semantic_score
      FROM constitution_documents
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `,
    [formatEmbedding(queryEmbedding), topK],
  );

  return rows.map((row) => ({
    sourceId: row.source_id,
    articleNumber: row.article_number,
    articleTitle: row.article_title ?? undefined,
    partNumber: row.part_number ?? undefined,
    partTitle: row.part_title ?? undefined,
    clause: row.clause ?? undefined,
    subClause: row.sub_clause ?? undefined,
    title: row.title ?? undefined,
    text: row.text,
    semanticScore: Number(row.semantic_score),
  }));
}
