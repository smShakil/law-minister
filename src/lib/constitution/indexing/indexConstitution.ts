import type { PoolClient } from "pg";

import { ensureSchema, getPool, isDatabaseConfigured } from "@/lib/db/client";

import { createEmbeddingProvider } from "../embeddings/createEmbeddingProvider";
import { buildSearchDocuments, loadConstitutionDataset } from "../loader";
import type { RetrievalDocument } from "../retrieval/types";
import {
  buildIndexingText,
  computeContentHash,
  toRetrievalDocument,
} from "./buildDocuments";

interface ExistingDocumentRow {
  source_id: string;
  content_hash: string;
}

function formatEmbedding(values: number[]): string {
  return `[${values.join(",")}]`;
}

async function fetchExistingDocuments(
  client: PoolClient,
): Promise<Map<string, string>> {
  const result = await client.query<ExistingDocumentRow>(
    "SELECT source_id, content_hash FROM constitution_documents",
  );
  const map = new Map<string, string>();
  for (const row of result.rows) {
    map.set(row.source_id, row.content_hash);
  }
  return map;
}

async function upsertDocument(
  client: PoolClient,
  document: RetrievalDocument,
  contentHash: string,
  embedding: number[] | null,
): Promise<void> {
  await client.query(
    `
      INSERT INTO constitution_documents (
        id,
        source_id,
        part_number,
        part_title,
        article_number,
        article_title,
        clause,
        sub_clause,
        title,
        text,
        searchable_text,
        content_hash,
        embedding,
        search_vector,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13::vector,
        to_tsvector('english', $11),
        NOW()
      )
      ON CONFLICT (source_id) DO UPDATE SET
        part_number = EXCLUDED.part_number,
        part_title = EXCLUDED.part_title,
        article_number = EXCLUDED.article_number,
        article_title = EXCLUDED.article_title,
        clause = EXCLUDED.clause,
        sub_clause = EXCLUDED.sub_clause,
        title = EXCLUDED.title,
        text = EXCLUDED.text,
        searchable_text = EXCLUDED.searchable_text,
        content_hash = EXCLUDED.content_hash,
        embedding = COALESCE(EXCLUDED.embedding, constitution_documents.embedding),
        search_vector = EXCLUDED.search_vector,
        updated_at = NOW()
    `,
    [
      document.sourceId,
      document.sourceId,
      document.partNumber ?? null,
      document.partTitle ?? null,
      document.articleNumber,
      document.articleTitle ?? null,
      document.clause ?? null,
      document.subClause ?? null,
      document.title ?? null,
      document.text,
      document.searchableText,
      contentHash,
      embedding ? formatEmbedding(embedding) : null,
    ],
  );
}

export interface IndexConstitutionResult {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  embedded: number;
}

export async function indexConstitution(): Promise<IndexConstitutionResult> {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await ensureSchema();

  const dataset = loadConstitutionDataset();
  const searchDocuments = buildSearchDocuments(dataset);
  const documents = searchDocuments.map(toRetrievalDocument);
  const embeddingProvider = createEmbeddingProvider();

  const client = await getPool().connect();
  const result: IndexConstitutionResult = {
    total: documents.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    embedded: 0,
  };

  try {
    const existing = await fetchExistingDocuments(client);

    for (const document of documents) {
      const contentHash = computeContentHash(document.text);
      const previousHash = existing.get(document.sourceId);
      const isNew = previousHash === undefined;
      const contentChanged = previousHash !== contentHash;

      let embedding: number[] | null = null;

      if (isNew || contentChanged) {
        const indexingText = buildIndexingText(document);
        embedding = await embeddingProvider.embed(indexingText);
        result.embedded += 1;
      } else {
        result.skipped += 1;
      }

      await upsertDocument(client, document, contentHash, embedding);

      if (isNew) {
        result.inserted += 1;
      } else if (contentChanged) {
        result.updated += 1;
      }
    }
  } finally {
    client.release();
  }

  return result;
}
