'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  BarVisualizer,
  DisconnectButton,
  TrackToggle,
  useVoiceAssistant,
  useDataChannel,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

type Source = {
  documentId: string;
  title: string;
  section?: string;
};

type ConnectionDetails = {
  token: string;
  url: string;
  room: string;
};

export default function Home() {
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const res = await fetch('/api/livekit/token', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to get token');
      const data = await res.json();
      setConnectionDetails(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnectionDetails(null);
    setError(null);
  }, []);

  if (!connectionDetails) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <h1 className="text-5xl md:text-6xl font-alfa-slab text-gray-900 dark:text-white tracking-tight">
          My Digital Twin
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-md">
          Ask me about my experience, skills, and projects.
        </p>
        {error && (
          <p className="text-red-500 text-sm font-medium">{error}</p>
        )}
        <button
          onClick={connect}
          disabled={isConnecting}
          className="px-10 py-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          {isConnecting ? 'Connecting…' : 'Start Conversation'}
        </button>
      </main>
    );
  }

  return (
    <LiveKitRoom
      token={connectionDetails.token}
      serverUrl={connectionDetails.url}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={disconnect}
      className="flex flex-col min-h-screen"
    >
      <RoomAudioRenderer />
      <VoiceUI onDisconnect={disconnect} />
    </LiveKitRoom>
  );
}

function VoiceUI({ onDisconnect }: { onDisconnect: () => void }) {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const [userTranscript, setUserTranscript] = useState('');
  const [citations, setCitations] = useState<Source[]>([]);
  const [agentResponse, setAgentResponse] = useState('');

  useDataChannel('lk-chat-topic', (msg) => {
    try {
      const text = new TextDecoder().decode(msg.payload);
      const parsed = JSON.parse(text);
      if (parsed.type === 'citations' && Array.isArray(parsed.citations)) {
        setCitations(parsed.citations);
      } else if (parsed.type === 'agent_response' && typeof parsed.text === 'string') {
        setAgentResponse(parsed.text);
      }
    } catch {
      // ignore non-JSON messages
    }
  });

  // Show both interim and final transcriptions, or fall back to agent response
  const agentText = agentTranscriptions
    .map((t) => t.text)
    .join(' ')
    .trim() || agentResponse;

  const stateLabel: Record<string, string> = {
    disconnected: 'Disconnected',
    connecting: 'Connecting…',
    'pre-connect-buffering': 'Getting ready…',
    initializing: 'Initializing…',
    idle: 'Ready',
    listening: 'Listening',
    thinking: 'Thinking…',
    speaking: 'Speaking',
    failed: 'Connection failed',
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <h1 className="text-4xl md:text-5xl font-alfa-slab text-gray-900 dark:text-white tracking-tight">
        My Digital Twin
      </h1>

      <div className="flex flex-col items-center gap-4 w-full max-w-xl">
        <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
          {stateLabel[state] ?? state}
        </div>

        <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
          <BarVisualizer
            state={state}
            track={audioTrack}
            barCount={30}
            className="w-full h-full"
          />
        </div>

        <div className="flex gap-4 items-center">
          <TrackToggle
            source={Track.Source.Microphone}
            className="px-5 py-2.5 rounded-full bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-md hover:shadow-lg"
          />
          <DisconnectButton
            onClick={onDisconnect}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg"
          >
            End conversation
          </DisconnectButton>
        </div>
      </div>

      {agentText && (
        <div className="w-full max-w-2xl rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 p-6 space-y-3 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Response
          </p>
          <p className="text-base leading-relaxed text-gray-800 dark:text-gray-100">
            {agentText}
          </p>
        </div>
      )}

      {citations.length > 0 && (
        <div className="w-full max-w-2xl space-y-3">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300">
            Sources
          </p>
          <div className="grid gap-3">
            {citations.map((c, i) => (
              <div
                key={`${c.documentId}-${i}`}
                className="flex items-start gap-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-4 shadow-md hover:shadow-lg transition-shadow"
              >
                <span className="mt-1 flex-shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm flex items-center justify-center font-bold shadow-md">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {c.title}
                  </p>
                  {c.section && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {c.section}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
