# 4. Fixed Architecture — Do Not Change Mid-Project

This file is the implementation contract.

## Stack

- Next.js
- TypeScript
- LiveKit Agents for Node.js
- Neon PostgreSQL
- Prisma
- pgvector
- Embeddings API/model
- LLM
- LiveKit-compatible STT/TTS

## Application boundaries

```text
web/
  Next.js UI
  LiveKit connection/token route
  Citation display

agent/
  LiveKit TypeScript agent
  Retrieval tool/service
  Grounded answer generation

prisma/
  Schema
  Migrations
```

## Runtime flow

```text
Browser
  ↓
Next.js token route
  ↓
LiveKit room
  ↓
LiveKit TypeScript Agent
  ↓
Retrieve relevant DocumentChunk rows
  ↓
LLM receives only relevant grounded context
  ↓
Answer + source metadata
  ↓
Agent speaks answer
  ↓
Frontend displays citations
```

## Non-negotiable constraints

- Do not introduce Python.
- Do not replace Neon.
- Do not replace Prisma.
- Do not introduce Pinecone/Qdrant.
- Do not replace LiveKit.
- Do not turn this into a generic chatbot.
- Do not allow unsupported factual answers when the knowledge base has no evidence.
- Do not move the project to a different architecture during implementation.

Enhancement means improving the implementation, UX, validation, error handling, styling, and reliability **inside this architecture**.
