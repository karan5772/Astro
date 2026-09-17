import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import { logEvent } from '@/lib/log-event';
import { FREE_MESSAGE_LIMIT } from '@/lib/plans';
import { buildBirthContext, currentMonthYear } from '@/lib/astro-context';
import { rateLimit, tooManyRequests } from '@/lib/rate-limit';

export const maxDuration = 30;

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const limit = rateLimit(`reading:${userId}`, 5, 60_000);
    if (!limit.ok) return tooManyRequests(limit);

    await connectToDatabase();

    // Atomic gate: only succeeds when ALL of these are true:
    //   1. User has exhausted free messages (messageCount >= FREE_MESSAGE_LIMIT)
    //   2. User has no paid balance remaining (messageBalance <= 0 or absent)
    //   3. Reading has never been claimed before (limitReadingClaimedAt unset)
    // Stamps limitReadingClaimedAt so the gate can never open again.
    const claimed = await User.findOneAndUpdate(
      {
        clerkId: userId,
        messageCount: { $gte: FREE_MESSAGE_LIMIT },
        $or: [{ messageBalance: { $lte: 0 } }, { messageBalance: { $exists: false } }],
        limitReadingClaimedAt: { $exists: false },
      },
      { $set: { limitReadingClaimedAt: new Date() } },
      { returnDocument: 'after' },
    );

    if (!claimed) {
      // Either the user still has credits, or the reading was already claimed.
      return new Response('NOT_ELIGIBLE', { status: 403 });
    }

    logEvent(userId, 'limit_reading_generated', {
      messageCount: claimed.messageCount,
      messageBalance: claimed.messageBalance,
    });

    let systemPrompt = `You are Astraeus, a wise Vedic astrologer AI. Write a rich, deeply personalised cosmic reading — a synthesis of everything the user's birth chart reveals.

This reading must:
- Be 50–100 words — a teaser
- Cover at least 2 life areas (career/finances, relationships, timing of change, spiritual growth — pick what their chart highlights most)

- Weave in 3–5 specific predictions from their chart data — naturally, as if you already knew

- Do NOT mention message limits, upgrades, pricing, or credits — this is purely an astrological reading
- Do mention that pay more to unlock more messeges.
- Do NOT ask questions — this is a monologue from the stars
- Tone: mystical, warm, specific — like a master astrologer who has studied their chart for days
- Structure : IT MUST BE A tableless markdown as output with points.
- Today's date: ${currentMonthYear()}`;

    systemPrompt += buildBirthContext(claimed, {
      includeDashaDescriptions: true,
      includeRashi: true,
    });

    const result = streamText({
      model: openai.chat('gpt-4.1-nano'),
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Please give me my complete cosmic reading.' }],
      onError: ({ error }) => {
        console.error('[chat/reading] stream error', error);
        // Let them claim it again — the reading never arrived.
        User.updateOne(
          { clerkId: userId },
          { $unset: { limitReadingClaimedAt: '' } }
        ).catch(err => console.error('[chat/reading] reclaim reset failed', err));
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[chat/reading]', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
