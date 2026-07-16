import { createOpenAI } from '@ai-sdk/openai';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import { logEvent } from '@/lib/log-event';
import { FREE_MESSAGE_LIMIT } from '@/lib/plans';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export const maxDuration = 30;

export async function POST(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    await connectToDatabase();

    // Atomic gate: only succeeds when BOTH conditions are true:
    //   1. User has exhausted free messages (messageCount >= FREE_MESSAGE_LIMIT)
    //   2. User has no paid balance remaining (messageBalance <= 0 or absent)
    //   3. Reading has never been claimed before (limitReadingClaimedAt does not exist)
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

    const safeField = (v: unknown, max = 120) =>
      typeof v === 'string' ? v.replace(/[\r\n]/g, ' ').slice(0, max) : '';

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
- Today's date: ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;

    if (claimed.birthDate) {
      systemPrompt += `\n\nUser Birth Details:
- Date: ${safeField(claimed.birthDate, 20)}
- Time: ${safeField(claimed.birthTime, 10)}
- Location: ${safeField(claimed.birthLocation)}
- Timezone: ${safeField(claimed.birthTimezone, 10)}`;

      if (claimed.rashiName) {
        systemPrompt += `\n- Chandra Rashi (Moon Sign): ${safeField(claimed.rashiName, 20)}`;
      }

      if (claimed.currentDasha?.mahadasha) {
        const d = claimed.currentDasha;
        systemPrompt += `\n\nCurrent Vimshottari Dasha:
- Mahadasha: ${d.mahadasha} (${d.mahadashaNature}) — ${d.mahadashaDescription}
- Bhukti: ${d.bhukti} (${d.bhuktiNature}) — ${d.bhuktiDescription}
- Antaram: ${d.antaram}`;
      }

      if (claimed.predictions?.length > 0) {
        const predictionsText = claimed.predictions
          .map((p: any) => `- [${p.name}]: ${p.description}`)
          .join('\n');
        systemPrompt += `\n\nVedic Horoscope Predictions (weave naturally into the reading):\n${predictionsText}`;
      }
    }

    const result = streamText({
      model: openai.chat('gpt-4.1-nano'),
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Please give me my complete cosmic reading.' }],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(err);
    return new Response(err.message || 'Internal Server Error', { status: 500 });
  }
}
