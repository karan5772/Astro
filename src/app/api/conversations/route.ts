import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Conversation from '@/lib/models/Conversation';
import { logEvent } from '@/lib/log-event';
import { rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { MAX_TITLE_LENGTH, MAX_CONVERSATIONS_PER_USER } from '@/lib/conversation-limits';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json([], { status: 401 });

    await connectToDatabase();
    const convs = await Conversation.find({ clerkId: userId })
      .select('_id title updatedAt')
      .sort({ updatedAt: -1 })
      .limit(MAX_CONVERSATIONS_PER_USER)
      .lean();

    return NextResponse.json(
      convs.map(c => ({
        id: String(c._id),
        title: c.title,
        updatedAt: c.updatedAt?.toISOString() ?? new Date(0).toISOString(),
      }))
    );
  } catch (error) {
    console.error('[conversations:GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const limit = rateLimit(`conv-create:${userId}`, 30, 60_000);
    if (!limit.ok) return tooManyRequests(limit);

    const body = await req.json().catch(() => null);
    const rawTitle = typeof body?.title === 'string' ? body.title.trim() : '';
    const title = (rawTitle || 'New Reading').slice(0, MAX_TITLE_LENGTH);

    await connectToDatabase();

    // Bound how many conversations one account can hold.
    const count = await Conversation.countDocuments({ clerkId: userId });
    if (count >= MAX_CONVERSATIONS_PER_USER) {
      return NextResponse.json(
        { error: `Conversation limit of ${MAX_CONVERSATIONS_PER_USER} reached. Delete one to continue.` },
        { status: 409 }
      );
    }

    const conv = await Conversation.create({ clerkId: userId, title, messages: [] });

    logEvent(userId, 'conversation_created', {
      conversationId: conv._id.toString(),
      title: conv.title,
    });

    return NextResponse.json({
      id: conv._id.toString(),
      title: conv.title,
      updatedAt: conv.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[conversations:POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
