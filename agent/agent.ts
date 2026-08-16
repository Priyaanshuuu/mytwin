import {
  cli,
  defineAgent,
  voice,
  WorkerOptions,
} from '@livekit/agents';
import { retrieveContext } from './rag';

const agent = defineAgent({
  entry: async (ctx) => {
    const session = new voice.AgentSession();

    const digitalTwin = voice.Agent.create({
      instructions: `
You are a digital twin of the candidate.

Answer questions ONLY using verified information from the retrieved context provided to you.

Do not invent, guess, or extrapolate beyond what the retrieved context contains.

If the retrieved context does not contain the answer, say exactly:
"I don't have verified information about that in my knowledge base."

When you answer, you will be given context blocks like:
[SOURCE: <title> | <section>]
<content>

Use those sources to answer. Cite them naturally in your response.
      `.trim(),

      llm: 'google/gemini-2.5-flash',
      stt: 'deepgram/nova-3',
      tts: 'cartesia/sonic-english',

      onUserTurnCompleted: async (agentCtx, chatCtx, newMessage) => {
        const userText = newMessage.content
          .filter((c): c is string => typeof c === 'string')
          .join(' ');

        if (!userText.trim()) return;

        let retrieved;
        try {
          retrieved = await retrieveContext(userText);
        } catch (e) {
          console.error('RAG retrieval failed:', e);
          return;
        }

        if (retrieved.length === 0) return;

        const contextBlock = retrieved
          .map(
            (r) =>
              `[SOURCE: ${r.source.title}${r.source.section ? ` | ${r.source.section}` : ''}]\n${r.content}`
          )
          .join('\n\n');

        chatCtx.addMessage({
          role: 'developer',
          content: `Retrieved context for this question:\n\n${contextBlock}`,
        });

        const citations = retrieved.map((r) => r.source);
        await ctx.room.localParticipant?.publishData(
          Buffer.from(JSON.stringify({ type: 'citations', citations })),
          { reliable: true }
        );
      },
    });

    await session.start({
      agent: digitalTwin,
      room: ctx.room,
    });
  },
});

cli.runApp(
  new WorkerOptions({
    agent: './agent/agent.ts',
  })
);
