import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { checkAdmin, adminDenialStatus } from '@/lib/admin-auth';
import User from '@/lib/models/User';
import Payment from '@/lib/models/Payment';
import Event from '@/lib/models/Event';
import { FREE_MESSAGE_LIMIT } from '@/lib/plans';

// 'message_limit_hit' is the historical name; 'trial_limit_hit' is what the
// chat route emits now. Count both so the figure spans all of time.
const LIMIT_HIT_EVENT_TYPES = ['trial_limit_hit', 'message_limit_hit'];

type Lean = Record<string, unknown> & { _id: unknown };

function serialise(doc: Lean, dateFields: string[]) {
  const out: Record<string, unknown> = { ...doc, _id: String(doc._id) };
  for (const field of dateFields) {
    const value = doc[field];
    out[field] = value instanceof Date ? value.toISOString() : null;
  }
  return out;
}

export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin.ok) {
      return new NextResponse(admin.reason === 'unauthenticated' ? 'Unauthorized' : 'Forbidden', {
        status: adminDenialStatus(admin.reason),
      });
    }

    await connectToDatabase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      proUsers,
      newTodayUsers,
      messageSumResult,
      birthChartsGenerated,
      trialHitsCount,
      voiceSessionsResult,
      recentUsers,
      recentPayments,
      recentEvents,
      eventCounts,
      revenueResult,
      usersWhoMessaged,
      usersWhoExhaustedFree,
      payingClerkIds,
      ordersCreated,
      paymentsCompleted,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isPro: true }),
      User.countDocuments({ createdAt: { $gte: today } }),
      // messageCount is the original field tracking messages since day 1 (free users)
      // totalChatMessages is the post-P0 field for all users — take the max per user
      User.aggregate([{
        $group: { _id: null, total: { $sum: { $max: ['$totalChatMessages', '$messageCount'] } } }
      }]),
      User.countDocuments({ birthDate: { $exists: true, $ne: null } }),
      Event.countDocuments({ type: { $in: LIMIT_HIT_EVENT_TYPES } }),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$voiceSessionCount' } } }]),
      User.find()
        .sort({ createdAt: -1 })
        .limit(25)
        .select('email firstName lastName isPro messageCount totalChatMessages voiceBalanceInSeconds voiceSessionCount lastActiveAt createdAt')
        .lean(),
      Payment.find().sort({ createdAt: -1 }).limit(25).lean(),
      Event.find().sort({ createdAt: -1 }).limit(60).lean(),
      Event.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      // `amount` holds the plan's USD list price; `amountInr` is what was
      // actually charged at that day's FX rate (absent on pre-fix records).
      Payment.aggregate([{
        $group: {
          _id: null,
          totalUsd: { $sum: '$amount' },
          totalInr: { $sum: { $ifNull: ['$amountInr', 0] } },
        }
      }]),
      // Funnel: how far each signup actually got.
      User.countDocuments({
        $or: [{ messageCount: { $gt: 0 } }, { totalChatMessages: { $gt: 0 } }],
      }),
      User.countDocuments({ messageCount: { $gte: FREE_MESSAGE_LIMIT } }),
      Payment.distinct('clerkId'),
      // Checkout health: orders opened vs payments that actually landed.
      Event.countDocuments({ type: 'order_created' }),
      Payment.countDocuments(),
    ]);

    const eventCountsMap: Record<string, number> = {};
    for (const e of eventCounts as { _id: string; count: number }[]) {
      eventCountsMap[e._id] = e.count;
    }

    const revenue = revenueResult[0] as { totalUsd?: number; totalInr?: number } | undefined;

    return NextResponse.json({
      stats: {
        totalUsers,
        proUsers,
        newTodayUsers,
        totalMessages: (messageSumResult[0] as { total?: number } | undefined)?.total ?? 0,
        birthChartsGenerated,
        // Kept as a misspelled alias so an already-deployed dashboard doesn't break.
        birtChartsGenerated: birthChartsGenerated,
        trialLimitHits: trialHitsCount,
        voiceSessions: (voiceSessionsResult[0] as { total?: number } | undefined)?.total ?? 0,
        totalRevenueUsd: revenue?.totalUsd ?? 0,
        totalRevenueInr: revenue?.totalInr ?? 0,
      },
      funnel: {
        signedUp: totalUsers,
        enteredBirthDetails: birthChartsGenerated,
        sentAMessage: usersWhoMessaged,
        usedAllFree: usersWhoExhaustedFree,
        paid: (payingClerkIds as string[]).length,
      },
      checkout: {
        ordersCreated,
        paymentsCompleted,
        // The gap between these two is what a broken checkout looks like.
        completionRate: ordersCreated > 0 ? paymentsCompleted / ordersCreated : null,
      },
      freeMessageLimit: FREE_MESSAGE_LIMIT,
      eventCounts: eventCountsMap,
      recentUsers: (recentUsers as unknown as Lean[]).map(u => serialise(u, ['createdAt', 'lastActiveAt'])),
      recentPayments: (recentPayments as unknown as Lean[]).map(p => serialise(p, ['date', 'createdAt'])),
      recentEvents: (recentEvents as unknown as Lean[]).map(e => serialise(e, ['createdAt'])),
    });
  } catch (error) {
    console.error('[admin/stats]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
