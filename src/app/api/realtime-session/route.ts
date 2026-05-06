import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import mem0Client from '@/lib/mem0';

export async function GET() {
  try {
    const { userId } = await auth();
    const actualUserId = userId || 'anonymous_user';

    let memoryContext = '';
    try {
      if (process.env.MEM0_API_KEY) {
        // Fetch a general summary of the user's details for the realtime session
        const response = await mem0Client.search("user astrological profile, traits, and preferences", { filters: { user_id: actualUserId } });
        const memories = Array.isArray(response) ? response : response?.results;
        if (memories && memories.length > 0) {
          memoryContext = memories.map((m: any) => m.memory || m.text).join('. ');
        }
      }
    } catch (e) {
      console.error('Mem0 retrieve error', e);
    }

    let instructions = "You are a mystical, highly intelligent AI Astrologer. You speak with wisdom, insight, and a touch of cosmic flair. You answer user queries regarding their future, horoscope, zodiac traits, and life paths. Do not give medical or financial advice.";
    if (memoryContext) {
      instructions += `\n\nHere are some things you remember about the user: ${memoryContext}`;
    }

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-realtime-mini",
        voice: "verse", // Mystical sounding voice
        instructions: instructions
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI Realtime API Error:', err);
      return new NextResponse('Error generating realtime session token', { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating token:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
