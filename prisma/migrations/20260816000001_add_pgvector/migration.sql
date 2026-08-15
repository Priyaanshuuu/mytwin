-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to DocumentChunk (1536 dims for text-embedding-3-small / ada-002)
ALTER TABLE "DocumentChunk" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

-- Index for cosine similarity search
CREATE INDEX IF NOT EXISTS "DocumentChunk_embedding_idx"
  ON "DocumentChunk" USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);
