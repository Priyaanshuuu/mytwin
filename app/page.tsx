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
      <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
        <h1 className="text-4xl font-bold tracking-tight">My Digital Twin</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 text-center max-w-md">
          Ask me about my experience, skills, and projects.
        </p>
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
        <button
          onClick={connect}
          disabled={isConnecting}
          className="px-8 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
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

  useDataChannel('lk-chat-topic', (msg) => {
    try {
      const text = new TextDecoder().decode(msg.payload);
      const parsed = JSON.parse(text);
      if (parsed.type === 'citations' && Array.isArray(parsed.citations)) {
        setCitations(parsed.citations);
      }
    } catch {
      // ignore non-JSON messages
    }
  });

  const agentText = agentTranscriptions
    .filter((t) => t.final)
    .map((t) => t.text)
    .join(' ')
    .trim();

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
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 p-8">
      <h1 className="text-3xl font-bold tracking-tight">My Digital Twin</h1>

      <div className="flex flex-col items-center gap-4 w-full max-w-xl">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          {stateLabel[state] ?? state}
        </div>

        <div className="w-full h-24">
          <BarVisualizer
            state={state}
            track={audioTrack}
            barCount={30}
            className="w-full h-full"
          />
        </div>

        <div className="flex gap-4 items-center">
          <TrackToggle source={Track.Source.Microphone} className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition" />
          <DisconnectButton
            onClick={onDisconnect}
            className="px-4 py-2 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition"
          >
            End conversation
          </DisconnectButton>
        </div>
      </div>

      {agentText && (
        <div className="w-full max-w-xl rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Response</p>
          <p className="text-base leading-relaxed">{agentText}</p>
        </div>
      )}

      {citations.length > 0 && (
        <div className="w-full max-w-xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Sources</p>
          {citations.map((c, i) => (
            <div
              key={`${c.documentId}-${i}`}
              className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3"
            >
              <span className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{c.title}</p>
                {c.section && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{c.section}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
