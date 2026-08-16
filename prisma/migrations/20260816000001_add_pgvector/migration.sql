-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to DocumentChunk (3072 dims for gemini-embedding-001)
ALTER TABLE "DocumentChunk" ADD COLUMN IF NOT EXISTS "embedding" vector(3072);

-- Index for cosine similarity search
CREATE INDEX IF NOT EXISTS "DocumentChunk_embedding_idx"
  ON "DocumentChunk" USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);
