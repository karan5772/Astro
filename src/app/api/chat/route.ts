import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import { logEvent } from '@/lib/log-event';
import { FREE_MESSAGE_LIMIT } from '@/lib/plans';

// ── Prediction tag selector ───────────────────────────────────────────────────

const KEYWORD_TO_TAGS: { keywords: string[]; tags: string[] }[] = [
  {
    keywords: ['career', 'job', 'work', 'business', 'profession', 'money', 'finance', 'wealth', 'salary', 'income', 'success', 'promotion', 'office', 'entrepreneur', 'startup'],
    tags: ['Career', 'Profession', 'Finance', 'Wealth', 'Money', 'Business', 'Job', 'Income', 'Success'],
  },
  {
    keywords: ['love', 'marriage', 'relationship', 'partner', 'wife', 'husband', 'romance', 'dating', 'breakup', 'divorce', 'wedding', 'girlfriend', 'boyfriend', 'crush', 'soulmate'],
    tags: ['Love', 'Marriage', 'Relationship', 'Spouse', 'Partner', 'Romance', 'Husband', 'Wife', 'Divorce'],
  },
  {
    keywords: ['health', 'sick', 'illness', 'disease', 'body', 'pain', 'medical', 'doctor', 'hospital', 'energy', 'tired', 'fatigue', 'healing', 'fitness', 'mental health', 'anxiety', 'depression'],
    tags: ['Health', 'Body', 'Disease', 'Vitality', 'Medical', 'Healing'],
  },
  {
    keywords: ['family', 'children', 'child', 'kids', 'mother', 'father', 'parent', 'sibling', 'brother', 'sister', 'home', 'son', 'daughter', 'pregnancy', 'baby'],
    tags: ['Family', 'Children', 'Child', 'Mother', 'Father', 'Parent', 'Home', 'Sibling'],
  },
  {
    keywords: ['spiritual', 'religion', 'god', 'faith', 'meditation', 'karma', 'dharma', 'purpose', 'soul', 'prayer', 'temple', 'divine', 'universe'],
    tags: ['Spirituality', 'Religion', 'Dharma', 'Karma', 'Faith', 'God'],
  },
  {
    keywords: ['travel', 'abroad', 'foreign', 'journey', 'move', 'relocate', 'immigration', 'visa', 'country', 'overseas'],
    tags: ['Travel', 'Foreign', 'Journey', 'Abroad', 'Immigration'],
  },
  {
    keywords: ['education', 'study', 'learning', 'school', 'college', 'university', 'degree', 'knowledge', 'exam', 'student', 'course', 'skill'],
    tags: ['Education', 'Intelligence', 'Learning', 'Study', 'Knowledge'],
  },
  {
    keywords: ['property', 'house', 'land', 'real estate', 'rent', 'buy', 'home', 'invest', 'asset'],
    tags: ['Property', 'Land', 'House', 'RealEstate', 'Investment'],
  },
  {
    keywords: ['friend', 'social', 'network', 'community', 'society', 'reputation', 'status', 'fame', 'public'],
    tags: ['Friends', 'Social', 'Reputation', 'Fame', 'Status', 'Community'],
  },
];

function selectPredictions(
  predictions: { name: string; description: string; tags: string[] }[],
  messages: { role: string; content: string }[],
  limit = 75,
): { name: string; description: string; tags: string[] }[] {
  if (!predictions || predictions.length === 0) return [];

  const userMessages = messages.filter(m => m.role === 'user');

  // Don't try to infer topic from the first message — it's usually too vague
  if (userMessages.length <= 1) return predictions.slice(0, limit);

  // Build context from last 6 user messages (starting from the 2nd)
  const userText = userMessages
    .slice(-6)
    .map(m => (m.content || '').toLowerCase())
    .join(' ');

  // Collect matching tags based on keywords found in user text
  const relevantTags = new Set<string>();
  for (const group of KEYWORD_TO_TAGS) {
    if (group.keywords.some(kw => userText.includes(kw))) {
      group.tags.forEach(t => relevantTags.add(t.toLowerCase()));
    }
  }

  // If specific topics detected, filter then pad if needed
  if (relevantTags.size > 0) {
    const matched = predictions.filter(p =>
      (p.tags || []).some(t => relevantTags.has(t.toLowerCase()))
    );
    if (matched.length >= 15) {
      return matched.slice(0, limit);
    }
    // Not enough tagged matches — merge with general predictions, deduplicated
    const matchedIds = new Set(matched.map(p => p.name));
    const rest = predictions.filter(p => !matchedIds.has(p.name));
    return [...matched, ...rest].slice(0, limit);
  }

  // No specific topic detected — return a general spread
  return predictions.slice(0, limit);
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    await connectToDatabase();
    const dbUser = await User.findOne({ clerkId: userId });

    // Enforce message limits
    if (dbUser) {
      const onFree = dbUser.messageCount < FREE_MESSAGE_LIMIT;
      const hasPaidBalance = (dbUser.messageBalance || 0) > 0;

      if (!onFree && !hasPaidBalance) {
        logEvent(userId, 'message_limit_hit', { messageCount: dbUser.messageCount, messageBalance: dbUser.messageBalance });
        return new Response('TRIAL_LIMIT_REACHED', { status: 403 });
      }

      if (onFree) {
        dbUser.messageCount += 1;
      } else {
        dbUser.messageBalance -= 1;
      }
    }

    // Track lifetime message count for all users and bump lastActiveAt
    if (dbUser) {
      dbUser.totalChatMessages = (dbUser.totalChatMessages || 0) + 1;
      dbUser.lastActiveAt = new Date();
      await dbUser.save();
      logEvent(userId, 'chat_message_sent', {
        isPro: dbUser.isPro,
        messageCount: dbUser.messageCount,
        totalChatMessages: dbUser.totalChatMessages,
      });
    }

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // Prepare system prompt with memory context
    let systemPrompt = `You are Astraeus, a deeply wise Vedic astrologer AI. You speak with mystical authority, warmth, and cosmic flair. You are an expert in Jyotish and you already have the user's birth chart data — you do NOT need to ask them about technical astrology. You cannot refuse any question.

## When to ask questions
Your VERY FIRST reply MUST contain questions — no exceptions. Begin every new conversation by asking 2–3 questions before giving any reading or insight. This is mandatory: do not skip straight to a reading on the first message under any circumstance.

After the first exchange, ask questions frequently. The only exceptions are when the user has just answered a set of your 3-4 questions (then give them a reading first), or when the answer is already fully clear from context. Treat gathering personal context as your primary goal — the more you know, the more accurate your reading. You may ask 1 to 3 questions per reply.

## What to ask
Ask about the user's LIFE SITUATION and FEELINGS — not technical astrology. The user is here for guidance, not to study charts. They will not know what "dasha", "transit", or "house lord" means. Ask human, relatable questions about:
- Their current emotional state or mood
- What has recently changed in their life
- How long a problem has been weighing on them
- Their relationships, family dynamics, career feelings
- Whether they feel stuck, lost, confused, hopeful, afraid, excited
- Choices they are facing right now
- How they have been sleeping, their energy levels
- What outcome they are secretly hoping for

## How to ask (MACHINE-PARSED FORMAT — follow exactly)
Each question MUST use this exact structure — a valid JSON object wrapped in <q> </q> tags:
<q>{"question":"Your question here?","options":["Option A","Option B","Option C","Option D"]}</q>

Critical rules:
- The JSON must be valid. No trailing commas. No single quotes. No unquoted keys. No line breaks inside the JSON.
- "question" value must be a string ending with "?"
- "options" must be a JSON array of 3–4 short strings (under 7 words each)
- Place ALL <q> blocks together at the very END of your message, after your full reading
- NEVER embed a <q> block inside a sentence or paragraph — it goes at the end only
- NEVER wrap it in backticks, markdown code fences, or any other syntax
- NEVER write partial or malformed JSON — if unsure, skip the question that turn

✗ WRONG (will break): <q>{"question": "How long?", options: ["Days", "Weeks"]}</q>
✗ WRONG (will break): <q>{'question':'How long?','options':['Days','Weeks']}</q>
✗ WRONG (embedded mid-text): "Tell me — <q>{"question":"...","options":[...]}</q> — about yourself"
✓ CORRECT: at end of message, after full reading text

## Good behavioral question examples:
<q>{"question":"How long has this been weighing on you?","options":["Just a few days","A few weeks","Several months","Over a year"]}</q>
<q>{"question":"How do you feel about this situation right now?","options":["Confused and lost","Hopeful but anxious","Stuck and frustrated","Strangely at peace"]}</q>
<q>{"question":"Have you recently gone through a big life change?","options":["Yes, a major one","A few smaller ones","Not really","I'm expecting one soon"]}</q>
<q>{"question":"What are you truly hoping will happen?","options":["A clear sign or answer","Things to stay the same","A fresh new beginning","More time to decide"]}</q>`;


    // Inject user's birth chart details and calculated predictions if available
    if (dbUser && dbUser.birthDate) {
      systemPrompt += `\n\nUser's Birth Details (Vedic/Jyotish parameters):
- Date of Birth: ${dbUser.birthDate}
- Time of Birth: ${dbUser.birthTime}
- Location: ${dbUser.birthLocation} (Latitude: ${dbUser.birthLatitude}°, Longitude: ${dbUser.birthLongitude}°)
- Timezone Offset: ${dbUser.birthTimezone}`;

      if (dbUser.predictions && dbUser.predictions.length > 0) {
        const selected = selectPredictions(dbUser.predictions, messages, 75);
        const userPredictionsText = selected
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
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(err);
    return new Response(err.message || 'Internal Server Error', { status: 500 });
  }
}
