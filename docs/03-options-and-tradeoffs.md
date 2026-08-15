# 3. Options and Tradeoffs

The architecture is intentionally fixed for this assignment. The alternatives below are documented to explain design decisions, not to change the implementation plan.

## Vector database options

### Option A — Neon PostgreSQL + pgvector (chosen)

**Pros**
- One database for relational data and vectors.
- Works naturally with the existing Neon + Prisma plan.
- Fewer services to deploy and configure.
- PostgreSQL metadata filtering remains available.

**Tradeoff**
- Prisma does not treat the pgvector type like a normal built-in scalar, so vector operations require SQL/typed SQL at the database boundary.

### Option B — Pinecone

**Pros**
- Dedicated managed vector database.
- Purpose-built vector search.

**Tradeoff**
- Adds another external service.
- More infrastructure and credentials.
- Relational application data would still live elsewhere.

### Option C — Qdrant

**Pros**
- Strong vector-search-focused system.
- Can be self-hosted or managed.

**Tradeoff**
- Another service to operate.
- More moving parts for a small assignment.

For this project, the extra service is not justified.

## Voice agent implementation options

### Node.js/TypeScript LiveKit Agent (chosen)

This matches the project's TypeScript-only constraint and uses LiveKit's Node.js Agents SDK.

### Python LiveKit Agent

Python is supported by LiveKit and is a valid alternative, but it would introduce a second language without providing a requirement-driven benefit for this project.

## Database access options

### Prisma + SQL for vector operations (chosen)

Use Prisma for normal application queries and SQL where PostgreSQL's vector type/operations require it.

### A separate vector SDK

This would be appropriate if we selected Pinecone/Qdrant, but that would change the database architecture.

## Retrieval strategy

### Semantic retrieval (chosen)

Question → embedding → pgvector similarity search → relevant chunks.

This handles questions that use different wording from the source.

### Keyword-only search

Simpler, but less robust when the user's wording differs from the wording in the resume/project documents.

### Hybrid search

Could combine keyword and vector retrieval. It can improve recall, but adds complexity that is not necessary for the first version of this assignment.

## Agent response strategy

### Grounded answer + citations (chosen)

The model receives retrieved source content and source metadata and generates an answer tied to those sources.

### Free-form LLM answer

Simpler, but it does not satisfy the assignment's citation/grounding requirement reliably.

## UX tradeoff

A minimal interface is faster to build, but the assignment explicitly evaluates UX. Therefore the final UI should clearly communicate:

- connection state
- listening/speaking state
- transcript
- current answer
- citations

The implementation should remain simple underneath while making the interaction feel polished.
