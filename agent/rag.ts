import { prisma } from '../lib/prisma';

export type Source = {
  documentId: string;
  title: string;
  section?: string;
};

export type RetrievedContext = {
  content: string;
  source: Source;
};

async function embed(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'models/gemini-embedding-001', content: { parts: [{ text }] } }),
    }
  );

  if (!res.ok) throw new Error(`Embedding API error: ${res.status}`);
  const data = await res.json();
  return data.embedding.values as number[];
}

export async function retrieveContext(query: string, topK = 5): Promise<RetrievedContext[]> {
  const vector = await embed(query);
  const vectorLiteral = `[${vector.join(',')}]`;

  const rows = await prisma.$queryRaw<
    Array<{ id: string; content: string; section: string | null; documentId: string; title: string }>
  >`
    SELECT dc.id, dc.content, dc.section, dc."documentId", kd.title
    FROM "DocumentChunk" dc
    JOIN "KnowledgeDocument" kd ON kd.id = dc."documentId"
    WHERE dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> ${vectorLiteral}::vector
    LIMIT ${topK}
  `;

  return rows.map((row: { id: string; content: string; section: string | null; documentId: string; title: string }) => ({
    content: row.content,
    source: {
      documentId: row.documentId,
      title: row.title,
      section: row.section ?? undefined,
    },
  }));
}
