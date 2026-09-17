import connectToDatabase from './mongodb';
import User from './models/User';

/**
 * Server-authoritative metering for realtime voice calls.
 *
 * The browser cannot be trusted to report how long it talked, so a session is
 * opened with a server timestamp and every settlement bills the wall-clock time
 * elapsed since then, minus whatever has already been billed. A client that
 * stops sending heartbeats (tab backgrounded, request blocked, laptop closed)
 * simply gets billed the whole span the next time it is seen.
 */

/** Hard ceiling on a single call; also caps what a missing settlement can cost. */
export const MAX_VOICE_SESSION_SECONDS = 60 * 60;

export type VoiceBalance = {
  voiceBalanceInSeconds: number;
  messageBalance: number;
  isPro: boolean;
};

type UserDoc = {
  voiceSessionStartedAt?: Date | null;
  voiceSessionBilledSeconds?: number;
  voiceBalanceInSeconds?: number;
  messageBalance?: number;
  isPro?: boolean;
};

function balanceOf(user: UserDoc): VoiceBalance {
  return {
    voiceBalanceInSeconds: Math.max(0, user.voiceBalanceInSeconds ?? 0),
    messageBalance: Math.max(0, user.messageBalance ?? 0),
    isPro: !!user.isPro,
  };
}

/** Pro means "has some paid balance left", in voice or messages. */
export function derivePro(user: UserDoc): boolean {
  return (user.voiceBalanceInSeconds ?? 0) > 0 || (user.messageBalance ?? 0) > 0;
}

/**
 * Bills any voice time that has elapsed but not yet been charged.
 * Safe to call on a user with no open session — it becomes a plain read.
 */
export async function settleVoiceSession(
  clerkId: string,
  opts: { close?: boolean } = {}
): Promise<VoiceBalance | null> {
  await connectToDatabase();

  const user = await User.findOne({ clerkId });
  if (!user) return null;

  if (user.voiceSessionStartedAt) {
    const elapsed = Math.min(
      MAX_VOICE_SESSION_SECONDS,
      Math.max(0, Math.floor((Date.now() - new Date(user.voiceSessionStartedAt).getTime()) / 1000))
    );
    const alreadyBilled = user.voiceSessionBilledSeconds ?? 0;
    const unbilled = elapsed - alreadyBilled;

    if (unbilled > 0) {
      // The `$lt` guard makes concurrent heartbeats idempotent: only the first
      // one to reach this elapsed mark is allowed to charge for it.
      await User.updateOne(
        { clerkId, voiceSessionBilledSeconds: { $lt: elapsed } },
        {
          $inc: { voiceBalanceInSeconds: -unbilled, totalVoiceSecondsConsumed: unbilled },
          $set: { voiceSessionBilledSeconds: elapsed, lastActiveAt: new Date() },
        }
      );
    }
  }

  const closing = opts.close
    ? { voiceSessionId: null, voiceSessionStartedAt: null, voiceSessionBilledSeconds: 0 }
    : {};

  // Re-read, clamp a balance that overran into the negative, and resync isPro.
  const fresh = await User.findOne({ clerkId });
  if (!fresh) return null;

  const clampedVoice = Math.max(0, fresh.voiceBalanceInSeconds ?? 0);
  const isPro = derivePro({ ...fresh.toObject(), voiceBalanceInSeconds: clampedVoice });

  const updated = await User.findOneAndUpdate(
    { clerkId },
    { $set: { ...closing, voiceBalanceInSeconds: clampedVoice, isPro } },
    { returnDocument: 'after' }
  );

  return updated ? balanceOf(updated) : null;
}

/**
 * Opens a session after settling any previous one that was never closed.
 * Returns null when the user has no voice balance to spend.
 */
export async function openVoiceSession(clerkId: string): Promise<
  { sessionId: string; allowedSeconds: number; voiceBalanceInSeconds: number } | null
> {
  // Settle and close whatever came before, so an abandoned call is paid for
  // before a new one can start.
  const settled = await settleVoiceSession(clerkId, { close: true });
  if (!settled || settled.voiceBalanceInSeconds <= 0) return null;

  const sessionId = crypto.randomUUID();
  const allowedSeconds = Math.min(settled.voiceBalanceInSeconds, MAX_VOICE_SESSION_SECONDS);

  await User.updateOne(
    { clerkId },
    {
      $set: {
        voiceSessionId: sessionId,
        voiceSessionStartedAt: new Date(),
        voiceSessionBilledSeconds: 0,
        lastActiveAt: new Date(),
      },
      $inc: { voiceSessionCount: 1 },
    }
  );

  return { sessionId, allowedSeconds, voiceBalanceInSeconds: settled.voiceBalanceInSeconds };
}
