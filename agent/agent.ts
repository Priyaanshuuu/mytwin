import {
  cli,
  defineAgent,
  WorkerOptions,
  voice,
} from '@livekit/agents';

const agent = defineAgent({
  entry: async (ctx) => {
    const session = new voice.AgentSession();

    const digitalTwin = voice.Agent.create({
      instructions: `
You are a digital twin of the candidate.

Answer questions only using verified information
from the candidate's knowledge base.

Do not invent information.

If the information is unavailable, say that you
do not have verified information about it.
      `.trim(),
    });

    await session.start({
      room: ctx.room,
      agent: digitalTwin,
    });
  },
});

cli.runApp(
  new WorkerOptions({
    agent: './agent/agent.ts',
  })
);