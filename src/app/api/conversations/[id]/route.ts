import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Conversation from '@/lib/models/Conversation';

async function getOwned(userId: string, id: string) {
  await connectToDatabase();
  return Conversation.findOne({ _id: id, clerkId: userId });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json([], { status: 401 });
  const { id } = await params;
  const conv = await getOwned(userId, id);
  if (!conv) return NextResponse.json([], { status: 404 });
  return NextResponse.json(conv.messages);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { messages, title } = await req.json();
  const conv = await getOwned(userId, id);
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (messages !== undefined) conv.messages = messages;
  if (title !== undefined) conv.title = title;
  await conv.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await Conversation.deleteOne({ _id: id, clerkId: userId });
  return NextResponse.json({ ok: true });
}
