import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import Payment from '@/lib/models/Payment';
import Event from '@/lib/models/Event';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'karankumar8239@gmail.com')
  .split(',')
  .map(e => e.trim());

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    await connectToDatabase();

    const requestingUser = await User.findOne({ clerkId: userId }).select('email').lean() as { email?: string } | null;
    if (!requestingUser || !ADMIN_EMAILS.includes(requestingUser.email ?? '')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      proUsers,
      newTodayUsers,
      messageSumResult,
      birtChartsGenerated,
      trialHitsCount,
      voiceSessionsResult,
      recentUsers,
      recentPayments,
      recentEvents,
      eventCounts,
      revenueResult,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isPro: true }),
      User.countDocuments({ createdAt: { $gte: today } }),
      // messageCount is the original field tracking messages since day 1 (free users)
      // totalChatMessages is the post-P0 field for all users — sum both and deduplicate via max per user
      User.aggregate([{
        $group: {
          _id: null,
          total: { $sum: { $max: ['$totalChatMessages', '$messageCount'] } }
        }
      }]),
      // birthDate field exists on all onboarded users since the beginning
      User.countDocuments({ birthDate: { $exists: true, $ne: null } }),
      Event.countDocuments({ type: 'trial_limit_hit' }),
      // voiceSessionCount on User model is the historical source
      User.aggregate([{ $group: { _id: null, total: { $sum: '$voiceSessionCount' } } }]),
      User.find()
        .sort({ createdAt: -1 })
        .limit(25)
        .select('email firstName lastName isPro messageCount totalChatMessages voiceBalanceInSeconds voiceSessionCount lastActiveAt createdAt')
        .lean(),
      Payment.find()
        .sort({ createdAt: -1 })
        .limit(25)
        .lean(),
      Event.find()
        .sort({ createdAt: -1 })
        .limit(60)
        .lean(),
      Event.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    const eventCountsMap: Record<string, number> = {};
    for (const e of eventCounts) {
      eventCountsMap[e._id] = e.count;
    }

    return NextResponse.json({
      stats: {
        totalUsers,
        proUsers,
        newTodayUsers,
        totalMessages: (messageSumResult[0] as { total?: number } | undefined)?.total ?? 0,
        birtChartsGenerated,
        trialLimitHits: trialHitsCount,
        voiceSessions: (voiceSessionsResult[0] as { total?: number } | undefined)?.total ?? 0,
        totalRevenueInr: (revenueResult[0] as { total?: number } | undefined)?.total ?? 0,
      },
      eventCounts: eventCountsMap,
      recentUsers: (recentUsers as any[]).map(u => ({
        ...u,
        _id: u._id.toString(),
        createdAt: u.createdAt?.toISOString() ?? null,
        lastActiveAt: u.lastActiveAt?.toISOString() ?? null,
      })),
      recentPayments: (recentPayments as any[]).map(p => ({
        ...p,
        _id: p._id.toString(),
        date: p.date?.toISOString() ?? null,
        createdAt: p.createdAt?.toISOString() ?? null,
      })),
      recentEvents: (recentEvents as any[]).map(e => ({
        ...e,
        _id: e._id.toString(),
        createdAt: e.createdAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error('[admin/stats]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
