import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { settleVoiceSession } from '@/lib/voice-session';
import { logEvent } from '@/lib/log-event';

/**
 * Settles the caller's in-flight voice session against the server clock.
 *
 * The client used to decide how much to deduct (a flat 10s per tick), which
 * meant a blocked request or a throttled background timer was free airtime.
 * Now the browser only *asks* for a settlement — the amount is always
 * `now - voiceSessionStartedAt` minus what has already been billed.
 *
 * Send `{ "end": true }` when the call is torn down to close the session.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json().catch(() => null);
    const close = body?.end === true;

    const balance = await settleVoiceSession(userId, { close });
    if (!balance) return new NextResponse('User not found', { status: 404 });

    if (close) {
      logEvent(userId, 'voice_session_ended', {
        voiceBalanceInSeconds: balance.voiceBalanceInSeconds,
      });
    }

    return NextResponse.json({
      success: balance.voiceBalanceInSeconds > 0,
      voiceBalanceInSeconds: balance.voiceBalanceInSeconds,
      isPro: balance.isPro,
    });
  } catch (error) {
    console.error('[voice-heartbeat]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
