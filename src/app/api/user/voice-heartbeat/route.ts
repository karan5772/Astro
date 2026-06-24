import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectToDatabase();

    const dbUser = await User.findOne({ clerkId: userId });
    if (!dbUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    const decrementSeconds = 10; // Heartbeat interval in seconds
    let newBalance = Math.max(0, (dbUser.voiceBalanceInSeconds || 0) - decrementSeconds);

    dbUser.voiceBalanceInSeconds = newBalance;

    if (newBalance <= 0) {
      dbUser.isPro = false;
    }

    await dbUser.save();

    return NextResponse.json({
      success: newBalance > 0,
      voiceBalanceInSeconds: newBalance,
      isPro: dbUser.isPro,
    });
  } catch (error) {
    console.error('Error in voice-heartbeat:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
