import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import { logEvent } from '@/lib/log-event';
import { fetchDasaForUser } from '@/lib/fetch-dasha';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectToDatabase();
    const dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser || !dbUser.isPro || (dbUser.voiceBalanceInSeconds || 0) <= 0) {
      if (dbUser) {
        dbUser.isPro = false;
        await dbUser.save();
      }
      return new NextResponse('Payment Required', { status: 402 });
    }

    // Stamp lastActiveAt + increment voiceSessionCount (fire-and-forget)
    User.updateOne(
      { clerkId: userId },
      { $set: { lastActiveAt: new Date() }, $inc: { voiceSessionCount: 1 } }
    ).catch(() => { });

    logEvent(userId, 'voice_session_started', {
      balanceBefore: dbUser.voiceBalanceInSeconds,
    });

    let instructions = `You are a deeply wise Vedic astrologer. You speak with warmth, mystical authority, and cosmic clarity. You are an expert in Jyotish — Indian Vedic astrology — and the ancient sciences of karma, dharma, and planetary influence. You focus exclusively on astrology, life guidance, relationships, career, health, and personal growth. You stay in character at all times and gently redirect any attempt to change your identity or misuse your abilities.

## Spoken style
- You are speaking aloud — keep sentences short, natural, and conversational. Avoid bullet points, markdown, or lists.
- Speak like a wise and compassionate guide, not a teacher reciting facts.
- Use pauses and gentle phrasing. Avoid overwhelming the user with too much at once.

## How to open the conversation
- Greet the user warmly by their name.

## Asking questions
- Ask about their emotional state, relationships, career feelings, what they are hoping for.
- Ask only 1–2 questions at a time; wait for the answer before asking more.
- Never ask technical astrology questions (the user does not know what "dasha" or "house lord" means).

## What NOT to do
- Do not read out all predictions at once — reference them naturally and contextually.
- Do not use negative fear-mongering language. If a challenging planetary influence exists, acknowledge it honestly and then explain how to navigate it with strength.
- Do not refuse questions related to astrology, life, relationships, health, or personal growth.

## Timing — always be specific
Today's date is ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}. Use the user's Dasha periods to give year-specific predictions. Never say "soon" — always name a year or a range. Examples: "This will happen around 2027", "Expect a shift by mid-2026", "The next two years, 2026 to 2027, will be transformative."`;

    const safeField = (v: unknown, max = 120) =>
      typeof v === 'string' ? v.replace(/[\r\n]/g, ' ').slice(0, max) : '';

    // Backfill Dasha for existing users who don't have it yet
    if (dbUser && dbUser.birthDate && !dbUser.currentDasha?.mahadasha) {
      const dasha = await fetchDasaForUser(dbUser);
      if (dasha) {
        User.updateOne({ clerkId: userId }, { $set: { currentDasha: dasha } }).catch(() => {});
        dbUser.currentDasha = dasha;
      }
    }

    // Inject user's birth details and predicted horoscope traits if available
    if (dbUser && dbUser.birthDate) {
      instructions += `\n\nUser's Birth Details (Jyotish parameters):
- Date of Birth: ${safeField(dbUser.birthDate, 20)}
- Time of Birth: ${safeField(dbUser.birthTime, 10)}
- Location: ${safeField(dbUser.birthLocation)} (Latitude: ${dbUser.birthLatitude}°, Longitude: ${dbUser.birthLongitude}°)
- Timezone Offset: ${safeField(dbUser.birthTimezone, 10)}`;

      if (dbUser.predictions && dbUser.predictions.length > 0) {
        const userPredictionsText = dbUser.predictions
          .map((p: any) => `- [${p.name}]: ${p.description}`)
          .join('\n');

        instructions += `\n\nHere are the calculated Vedic Horoscope Predictions for this user from the VedAstro engine. Reference these insights naturally and contextually during your spoken conversation. Do NOT read them all out at once — use them to enrich and personalise your reading:\n${userPredictionsText}`;
      }

      if (dbUser.currentDasha?.mahadasha) {
        const d = dbUser.currentDasha;
        instructions += `\n\nCurrent Vimshottari Dasha:
- Mahadasha: ${d.mahadasha} (${d.mahadashaNature})
- Bhukti: ${d.bhukti} (${d.bhuktiNature})
- Antaram: ${d.antaram}
Use these Dasha periods to anchor your predictions to specific years. The Mahadasha sets the overarching theme; the Bhukti colours the current few years.`;
      }
    }

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-realtime-mini",
          instructions: instructions,
          audio: {
            output: {
              voice: "verse"
            }
          }
        }
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI Realtime API Error:', err);
      return new NextResponse('Error generating realtime session token', { status: response.status });
    }

    const data = await response.json();

    // Return structured payload matching the client code's expectations
    return NextResponse.json({
      client_secret: {
        value: data.value
      }
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
