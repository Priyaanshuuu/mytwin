import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function embed(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });

  if (!res.ok) throw new Error(`Embedding API error: ${res.status}`);
  const data = await res.json();
  return data.data[0].embedding as number[];
}

type DocumentInput = {
  title: string;
  type: string;
  chunks: Array<{ section?: string; content: string }>;
};

const documents: DocumentInput[] = [
  {
    title: 'Resume',
    type: 'resume',
    chunks: [
      // --- Replace with your real resume content ---
      {
        section: 'Summary',
        content: 'Replace this with your actual professional summary.',
      },
      {
        section: 'Experience',
        content: 'Replace this with your actual work experience details.',
      },
      {
        section: 'Education',
        content: 'Replace this with your actual education history.',
      },
      {
        section: 'Skills',
        content: 'Replace this with your actual skills list.',
      },
    ],
  },
  {
    title: 'Projects',
    type: 'projects',
    chunks: [
      // --- Replace with your real project content ---
      {
        section: 'Project 1',
        content: 'Replace this with your actual project description.',
      },
    ],
  },
];

async function main() {
  console.log('Clearing existing knowledge base...');
  await prisma.documentChunk.deleteMany();
  await prisma.knowledgeDocument.deleteMany();

  for (const doc of documents) {
    console.log(`Ingesting: ${doc.title}`);

    const created = await prisma.knowledgeDocument.create({
      data: { title: doc.title, type: doc.type },
    });

    for (const chunk of doc.chunks) {
      const vector = await embed(chunk.content);
      const vectorLiteral = `[${vector.join(',')}]`;

      await prisma.$executeRaw`
        INSERT INTO "DocumentChunk" (id, content, section, "documentId", embedding, "createdAt")
        VALUES (gen_random_uuid()::text, ${chunk.content}, ${chunk.section ?? null}, ${created.id}, ${vectorLiteral}::vector, NOW())
      `;

      console.log(`  Embedded chunk: ${chunk.section ?? '(no section)'}`);
    }
  }

  console.log('Done.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
