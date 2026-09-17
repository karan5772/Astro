import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Conversation from '@/lib/models/Conversation';
import { MAX_TITLE_LENGTH, parseMessages } from '@/lib/conversation-limits';

/**
 * Loads a conversation only if it belongs to the caller. The id is checked
 * first because Mongoose throws a CastError on a malformed ObjectId, which
 * would otherwise surface as an unhandled 500 on any junk URL.
 */
async function getOwned(userId: string, id: string) {
  if (!isValidObjectId(id)) return null;
  await connectToDatabase();
  return Conversation.findOne({ _id: id, clerkId: userId });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json([], { status: 401 });

    const { id } = await params;
    const conv = await getOwned(userId, id);
    if (!conv) return NextResponse.json([], { status: 404 });

    return NextResponse.json(conv.messages);
  } catch (error) {
    console.error('[conversations/:id:GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { messages, title } = body as { messages?: unknown; title?: unknown };

    let parsedMessages: ReturnType<typeof parseMessages> | null = null;
    if (messages !== undefined) {
      parsedMessages = parseMessages(messages);
      if (!parsedMessages.ok) {
        return NextResponse.json({ error: parsedMessages.error }, { status: 400 });
      }
    }

    if (title !== undefined && typeof title !== 'string') {
      return NextResponse.json({ error: 'title must be a string' }, { status: 400 });
    }

    const conv = await getOwned(userId, id);
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (parsedMessages?.ok) conv.messages = parsedMessages.value;
    if (typeof title === 'string') conv.title = title.trim().slice(0, MAX_TITLE_LENGTH) || 'New Reading';

    await conv.save();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[conversations/:id:PUT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await connectToDatabase();
    await Conversation.deleteOne({ _id: id, clerkId: userId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[conversations/:id:DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
