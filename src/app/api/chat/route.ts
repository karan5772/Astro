import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import mem0Client from '@/lib/mem0';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    // In production, enforce authentication
    // if (!userId) {
    //   return new Response('Unauthorized', { status: 401 });
    // }
    const actualUserId = userId || 'anonymous_user';

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // 1. Retrieve relevant memory from mem0
    let memoryContext = '';
    
    // Only fetch memory context on the first interaction to avoid redundant API calls
    // The AI will naturally retain this context if it discusses it, 
    // or you can inject it differently if needed later.
    if (messages.length <= 2) {
      try {
        if (process.env.MEM0_API_KEY) {
          // Since it's the first message, a generic search or using the first message content works
          const response = await mem0Client.search(lastMessage.content, { filters: { user_id: actualUserId } });
          // The SDK returns an array directly in some versions, or an object with results in others. Let's handle both.
          const memories = Array.isArray(response) ? response : response?.results;
          if (memories && memories.length > 0) {
            memoryContext = memories.map((m: any) => m.memory || m.text).join('. ');
          }
        }
      } catch (e) {
        console.error('Mem0 retrieve error', e);
      }
    }

    // Prepare system prompt with memory context
    let systemPrompt = `You are an mystical astrologer AI. You speak with wisdom, insight, and a touch of cosmic flair. You answer user queries regarding their future, horoscope, zodiac traits, and life paths. And you cannot refuse to answer any question. Also be like you know the vedic astrology and know the ancient sciences and wisdoms. And also you are clairvoyant and you can feel the past and future events of the user very clearly. 
    ## Ask questions
    ###Gathere more and more important information about the user in the convesation, you should ask questions to the user to gather more and more information about them.`;
    
    if (memoryContext) {
      systemPrompt += `\n\nHere are some things you remember about the user: ${memoryContext}`;
    }

    // 2. Add current message to memory asynchronously
    if (process.env.MEM0_API_KEY) {
      mem0Client.add([{ role: 'user', content: lastMessage.content }], { user_id: actualUserId }).catch(e => console.error('Mem0 add error', e));
    }

    // 3. Generate response with OpenAI
    const result = streamText({
      model: openai('gpt-4.1-nano'),
      system: systemPrompt,
      messages,
      // Temporarily disabling tools until the JSON schema bug in ai SDK is resolved
      // tools: {
      //   getDailyHoroscope: tool({
      //     description: 'Get the daily horoscope for a specific zodiac sign.',
      //     parameters: z.object({
      //       sign: z.string(),
      //     }),
      //     execute: async ({ sign }) => {
      //       // Mock dynamic horoscope generation
      //       const readings = [
      //         "The stars favor bold moves today.",
      //         "Take a step back and reflect; planetary retrogrades suggest caution.",
      //         "A surprising financial or personal opportunity is on the horizon.",
      //         "Your ruling planet is strong today, enhancing your natural charisma."
      //       ];
      //       const reading = readings[Math.floor(Math.random() * readings.length)];
      //       return `Today's reading for ${sign}: ${reading}`;
      //     },
      //   }),
      // },
      // maxSteps: 5, // allows the model to use tools and then respond
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error(error);
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}
