import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

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
      {
        section: 'Contact',
        content:
          'Priyanshu Sinha. Phone: 8317733528. Email: priyanshusinha636@gmail.com. LinkedIn, GitHub, and Portfolio available.',
      },
      {
        section: 'Technical Skills',
        content:
          'Languages: Python, JavaScript (ES6+), TypeScript, C++, Java, SQL. ' +
          'Frontend: ReactJS, Next.js (App Router), Redux Toolkit, Tailwind CSS, Responsive Design, UX-Driven Development. ' +
          'Backend: Python (FastAPI, Django), Node.js, Express.js, Microservices Architecture, RESTful APIs, JWT Auth, NextAuth.js. ' +
          'AI & LLMs: LangChain, OpenAI API, Gemini API, Groq, RAG Pipelines, Vector Databases, Prompt Engineering. ' +
          'Databases: PostgreSQL, MongoDB, VectorDB, PrismaDB. ' +
          'Cloud & DevOps: AWS, Docker, CI/CD Pipelines, Git, Vercel, Postman, WebSockets. ' +
          'Core Practices: Distributed Computing, Security-First Design, Testing & Automation, Solutions Architecture, Agile/DevOps.',
      },
      {
        section: 'Experience',
        content:
          'Fullstack Engineer Intern at Cybersense IT Services (April 2025 – June 2026, Mexico/USA Remote). ' +
          'Shipped end-to-end fullstack features across a microservices-oriented stack using ReactJS, Next.js, and Python, collaborating directly with founders and product leads from design to cloud deployment on AWS. ' +
          'Designed and maintained scalable Python-backed REST APIs with a security-first approach — implementing JWT auth, input validation, and rate limiting. ' +
          'Integrated LLM-driven components that improved automated data processing throughput by approximately 35%. ' +
          'Owned features end-to-end from solutions design and distributed API architecture to frontend delivery, implementing real-time WebSocket features, automated test suites, and performance optimizations including code-splitting and lazy loading.',
      },
      {
        section: 'Education',
        content:
          'Bachelor of Technology in Computer Science from Lakshmi Narain College of Technology, Bhopal, MP. CGPA: 7.8. November 2022 – May 2026.',
      },
      {
        section: 'Achievements',
        content:
          'Open Source: Maintains public Python and TypeScript repositories on GitHub with READMEs, contribution guides, issue tracking, and automated test workflows. Actively contributing to community-driven fullstack and AI/ML tooling projects. ' +
          'Smart India Hackathon: Selected team — built a real-time IoT monitoring platform with a ReactJS frontend and Python backend bridging hardware sensor data to live cloud dashboards, owning the system end-to-end from architecture to demo. ' +
          'Competitive Programming: Solved 500+ DSA problems on LeetCode across arrays, graphs, DP, and system design.',
      },
    ],
  },
  {
    title: 'Projects',
    type: 'projects',
    chunks: [
      {
        section: 'Nexus – AI Collaborative Workspace',
        content:
          'Nexus is an AI Collaborative Workspace built with Next.js, TypeScript, ReactJS, Python, Yjs, Liveblocks, Gemini API, and PostgreSQL. ' +
          'Architected a distributed, real-time collaborative editor using Yjs CRDTs and Liveblocks — stress-tested to support 50+ concurrent editors with sub-100ms conflict resolution latency and live cursor tracking across nodes. ' +
          'Built a Python backend sync processor with microservices-style request queuing and retry logic, ensuring zero data loss during intermittent connectivity. ' +
          'Integrated Gemini API for AI-assisted content generation within editor workflows. ' +
          'Applied security-first design via NextAuth.js RBAC with hierarchical permission scopes across document owners and collaborators, backed by PostgreSQL session management and automated API integration tests. Available on GitHub.',
      },
      {
        section: 'Knowt – Multi-Modal AI Study Companion',
        content:
          'Knowt is a Multi-Modal AI Study Companion built with Next.js, ReactJS, Python, FastAPI, Groq, OpenAI, PostgreSQL, and MongoDB. ' +
          'Designed a cloud-native Python/FastAPI backend with a distributed async job queue handling PDF, video, audio, and web content up to 500MB — cutting summarization latency by approximately 60% over synchronous processing through DevOps-integrated deployment pipelines. ' +
          'Implemented LLM-driven Q&A generation via Groq and OpenAI APIs with RAG pipelines over a Vector Database. ' +
          'Engineered 10+ RESTful APIs with JWT auth, input sanitization, and a PostgreSQL/MongoDB hybrid data layer. ' +
          'Published as an open-source project with full documentation, contribution guides, and automated testing coverage. Available on GitHub.',
      },
      {
        section: 'Reels Pro – High-Performance Video Platform',
        content:
          'Reels Pro is a High-Performance Video Platform built with Next.js 15, ReactJS, TypeScript, Python, MongoDB, and ImageKit CDN. ' +
          'Designed a full-stack video platform with cloud-based CDN delivery via ImageKit and a Python data-processing layer. ' +
          'Leveraged Next.js 15 Server Components to minimize client-side bundle and optimize First Contentful Paint (FCP). ' +
          'Built MongoDB aggregation pipelines for real-time engagement metrics and nested comment feeds. ' +
          'Implemented adaptive bitrate streaming with validated stable 720p playback on throttled 3G. Available on GitHub.',
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
