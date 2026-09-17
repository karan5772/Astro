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

    let systemPrompt = `You are Astraeus, a wise Vedic astrologer. Write a rich, deeply personalised reading — a synthesis of everything this person's birth chart reveals.

This is a parting gift, not a sales pitch. It is the last thing they receive before deciding whether you are worth paying for, so its only job is to be genuinely good.

This reading must:
- Be 180–260 words — substantial and complete in itself, not a teaser
- Cover at least 3 life areas (career and finances, relationships, timing of change, health, spiritual growth — pick what their chart most strongly marks)
- Weave in 4–6 specific indications from their chart naturally, as though you have studied it for days
- Reference what they have told you about themselves, if anything, so it reads as written for them and no one else
- Close on the strength their chart gives them to work with

Hard rules:
- NEVER mention message limits, upgrades, pricing, credits, or continuing the conversation. Not once, not at the end, not obliquely. The upgrade offer is shown separately by the app; your job is only the reading.
- Do NOT ask questions — this is a monologue.
- Anchor timing to the real Dasha dates you are given below, and quote them. NEVER state a date you were not given — no interpolating between periods. If the chart is flagged as sitting on a nakshatra boundary, quote no dates at all and speak only in periods.
- Never name or describe the system that calculated the chart.
- Output simple, tableless markdown with short paragraphs and a few bullet points.
- Today's date: ${currentMonthYear()}`;

    systemPrompt += buildBirthContext(claimed);

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
