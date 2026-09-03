import "server-only";

import { Pool, type PoolClient, type QueryResultRow } from "pg";

let pool: Pool | null = null;

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getPool(): Pool {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!pool) {
    pool = new Pool({ connectionString: url });
  }

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function ensureSchema(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS vector");
    await client.query(`
      CREATE TABLE IF NOT EXISTS constitution_documents (
        id              TEXT PRIMARY KEY,
        source_id       TEXT UNIQUE NOT NULL,
        part_number     TEXT,
        part_title      TEXT,
        article_number  TEXT NOT NULL,
        article_title   TEXT,
        clause          TEXT,
        sub_clause      TEXT,
        title           TEXT,
        text            TEXT NOT NULL,
        searchable_text TEXT NOT NULL,
        content_hash    TEXT NOT NULL,
        embedding       vector(1536),
        search_vector   tsvector,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_constitution_documents_article
        ON constitution_documents (article_number)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_constitution_documents_search_vector
        ON constitution_documents USING gin (search_vector)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_constitution_documents_embedding
        ON constitution_documents USING hnsw (embedding vector_cosine_ops)
    `);
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
