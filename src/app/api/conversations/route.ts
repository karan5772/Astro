import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Conversation from '@/lib/models/Conversation';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json([], { status: 401 });

  await connectToDatabase();
  const convs = await Conversation.find({ clerkId: userId })
    .select('_id title updatedAt')
    .sort({ updatedAt: -1 })
    .lean();

  return NextResponse.json(
    convs.map((c: any) => ({ id: c._id.toString(), title: c.title, updatedAt: c.updatedAt.toISOString() }))
  );
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title = 'New Reading' } = await req.json();
  await connectToDatabase();
  const conv = await Conversation.create({ clerkId: userId, title, messages: [] });

  return NextResponse.json({ id: conv._id.toString(), title: conv.title, updatedAt: conv.updatedAt.toISOString() });
}
