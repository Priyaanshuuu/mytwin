# 2. Approach and Why

## Fixed architecture

The project uses one language: TypeScript.

- Next.js + TypeScript for the web application and UX.
- LiveKit Agents for the real-time voice agent.
- Neon PostgreSQL for persistent data.
- Prisma for database access and schema management.
- pgvector inside PostgreSQL for semantic retrieval.
- An embedding model/API for creating vectors.
- An LLM for grounded answer generation.
- LiveKit-compatible STT/TTS components for the voice pipeline.

## Architecture

```text
                    Browser
                       |
                       | LiveKit
                       v
              TypeScript LiveKit Agent
                       |
              +--------+--------+
              |                 |
              v                 v
        RAG retrieval          LLM
              |                 |
              v                 |
       Neon PostgreSQL <--------+
          + pgvector
              |
       Resume / Projects /
       Experience / Skills
```

## Why TypeScript everywhere?

The assignment does not require Python. LiveKit currently provides a Node.js/TypeScript Agents SDK, so the voice agent can remain in TypeScript.

Using one language also reduces context switching and keeps the application easier to maintain.

## Why Neon + PostgreSQL?

The application needs normal relational data as well as semantic search.

PostgreSQL can store:

- source documents
- document chunks
- metadata
- conversations
- messages
- embeddings through pgvector

This avoids introducing a second database only for vector search.

## Why pgvector?

The bot needs semantic retrieval. A question such as "Which projects show my backend experience?" may not contain the exact words used in the source document.

Embeddings allow the system to find semantically relevant chunks.

## Why Prisma?

Prisma provides the application-level database model and normal CRUD access.

pgvector's `vector` type is not natively represented as a normal Prisma scalar, so vector-specific migration/query work will use PostgreSQL SQL through Prisma's raw/typed SQL mechanisms where necessary. This is an intentional boundary, not a reason to introduce another database.

## Why RAG instead of putting the entire resume in the system prompt?

RAG gives us:

- source-grounded answers
- citations
- a knowledge base that can grow
- less prompt bloat
- better control over what information the bot can use

## Citation flow

Each retrieved chunk carries its document and section metadata.

The generation step receives the retrieved context and source identifiers.

The application returns:

```text
answer
sources[]
```

The frontend renders those sources next to the answer.

The voice output speaks only the answer; the UI provides the citations visually.

## Source-of-truth rule

The knowledge base is the source of truth.

If the required information cannot be retrieved from the knowledge base, the agent must not invent it.
