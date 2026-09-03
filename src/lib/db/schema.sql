-- Constitution retrieval index schema (PostgreSQL + pgvector)
-- Run once against your database before indexing.

CREATE EXTENSION IF NOT EXISTS vector;

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
);

CREATE INDEX IF NOT EXISTS idx_constitution_documents_article
  ON constitution_documents (article_number);

CREATE INDEX IF NOT EXISTS idx_constitution_documents_search_vector
  ON constitution_documents USING gin (search_vector);

CREATE INDEX IF NOT EXISTS idx_constitution_documents_embedding
  ON constitution_documents USING hnsw (embedding vector_cosine_ops);
