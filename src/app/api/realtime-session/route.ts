import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import mem0Client from '@/lib/mem0';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectToDatabase();
    const dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser || !dbUser.isPro) {
      return new NextResponse('Payment Required', { status: 402 });
    }

    if (dbUser.proUntil && new Date(dbUser.proUntil) < new Date()) {
      dbUser.isPro = false;
      await dbUser.save();
      return new NextResponse('Payment Required', { status: 402 });
    }

    const actualUserId = userId;

    let memoryContext = '';
    try {
      if (process.env.MEM0_API_KEY) {
        // Fetch a general summary of the user's details for the realtime session
        const response = await mem0Client.search("user astrological profile, traits, and preferences", { filters: { user_id: actualUserId } });
        const memories = Array.isArray(response) ? response : response?.results;
        if (memories && memories.length > 0) {
          memoryContext = memories.map((m: { memory?: string; text?: string }) => m.memory || m.text).join('. ');
        }
      }
    } catch (e) {
      console.error('Mem0 retrieve error', e);
    }

    let instructions = `You are a mystical, highly intelligent AI Astrologer. You speak with wisdom, insight, and a touch of cosmic flair. You answer user queries regarding their future, horoscope, zodiac traits, and life paths. Do not give medical or financial advice. You cannot refuse to answer any question. You know Vedic astrology and the ancient sciences and wisdoms. You are clairvoyant and you can feel the past and future events of the user very clearly.

## Spoken Style & Greeting
- Greet the user warmly by saying: 'Welcome, traveler. I am Astro AI. Then tell them about there future based on this information, then ask them What guidance do you seek from the stars today?'
- Gather more and more important information about the user during the conversation; ask questions to the user to understand them.`;

    // Inject user's birth details and predicted horoscope traits if available
    if (dbUser && dbUser.birthDate) {
      instructions += `\n\nUser's Birth Details (Jyotish parameters):
- Date of Birth: ${dbUser.birthDate}
- Time of Birth: ${dbUser.birthTime}
- Location: ${dbUser.birthLocation} (Latitude: ${dbUser.birthLatitude}°, Longitude: ${dbUser.birthLongitude}°)
- Timezone Offset: ${dbUser.birthTimezone}
- Ayanamsa Used: ${dbUser.ayanamsa || 'RAMAN'}`;

      if (dbUser.predictions && dbUser.predictions.length > 0) {
        // Feed the top 25 horoscope predictions to guide the voice agent's spoken readings
        const userPredictionsText = dbUser.predictions
          .slice(0, 25)
          .map((p: any) => `- [${p.name}]: ${p.description}`)
          .join('\n');

        instructions += `\n\nHere are the calculated Vedic Horoscope Predictions for this user from the VedAstro engine. Refer to these insights naturally and contextually during your spoken conversation to show your astrological accuracy. Do NOT read them all out; use them to guide the reading:\n${userPredictionsText} Start by telling the user about their horoscope prediction based on the data provided to you.`;
      }
    }

    if (memoryContext) {
      instructions += `\n\nHere are some things you remember about the user: ${memoryContext}`;
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
