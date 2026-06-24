import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    await connectToDatabase();
    const dbUser = await User.findOne({ clerkId: userId });

    // Enforce Pro trial limit for text chat
    if (dbUser && !dbUser.isPro) {
      if (dbUser.messageCount >= 15) {
        return new Response('TRIAL_LIMIT_REACHED', { status: 403 });
      }
      
      // Increment message count for free user
      dbUser.messageCount += 1;
      await dbUser.save();
    }

    const actualUserId = userId;

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // Prepare system prompt with memory context
    let systemPrompt = `You are an mystical astrologer AI. You speak with wisdom, insight, and a touch of cosmic flair. You answer user queries regarding their future, horoscope, zodiac traits, and life paths. And you cannot refuse to answer any question. Also be like you know the vedic astrology and know the ancient sciences and wisdoms. And also you are clairvoyant and you can feel the past and future events of the user very clearly. 
    ## Ask questions
    ###Gathere more and more important information about the user in the convesation, you should ask questions to the user to gather more and more information about them.`;
    
    // Inject user's birth chart details and calculated predictions if available
    if (dbUser && dbUser.birthDate) {
      systemPrompt += `\n\nUser's Birth Details (Vedic/Jyotish parameters):
- Date of Birth: ${dbUser.birthDate}
- Time of Birth: ${dbUser.birthTime}
- Location: ${dbUser.birthLocation} (Latitude: ${dbUser.birthLatitude}°, Longitude: ${dbUser.birthLongitude}°)
- Timezone Offset: ${dbUser.birthTimezone}
- Ayanamsa System: ${dbUser.ayanamsa || 'RAMAN'}`;

      if (dbUser.predictions && dbUser.predictions.length > 0) {
        // Feed the top 25 horoscope predictions into the LLM system prompt context
        const userPredictionsText = dbUser.predictions
          .slice(0, 25)
          .map((p: any) => `- [${p.name}]: ${p.description}`)
          .join('\n');
        
        systemPrompt += `\n\nHere are the calculated Vedic Horoscope Predictions for this user from the VedAstro system. Reference these predictions naturally in your conversation to show your clairvoyant/astrological accuracy. Do NOT list them all out in one reply; use them contextually to guide the user's reading:\n${userPredictionsText}`;
      }
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
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(err);
    return new Response(err.message || 'Internal Server Error', { status: 500 });
  }
}
