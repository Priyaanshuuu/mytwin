'use client';

import { useState } from 'react';

export default function Home() {
  const [connected, setConnected] = useState(false);

  return (
    <main>
      <h1>My Digital Twin</h1>

      <p>
        Ask me about my experience, skills, and projects.
      </p>

      <button onClick={() => setConnected(!connected)}>
        {connected ? 'Disconnect' : 'Start Conversation'}
      </button>

      <p>
        Status: {connected ? 'Connected' : 'Disconnected'}
      </p>
    </main>
  );
}