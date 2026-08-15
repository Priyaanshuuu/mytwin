import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

export async function POST() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !livekitUrl) {
    return NextResponse.json(
      { error: 'LiveKit is not configured' },
      { status: 500 }
    );
  }

  const room = `digital-twin-${crypto.randomUUID()}`;
  const identity = `user-${crypto.randomUUID()}`;

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
  });

  token.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return NextResponse.json({
    token: await token.toJwt(),
    url: livekitUrl,
    room,
  });
}