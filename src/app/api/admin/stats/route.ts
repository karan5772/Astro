import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { checkAdmin, adminDenialStatus } from '@/lib/admin-auth';
import User from '@/lib/models/User';
import Payment from '@/lib/models/Payment';
import Event from '@/lib/models/Event';


// The event has been renamed twice as the free tier changed shape; count all
// three so the all-time figure is not split across the renames.
const LIMIT_HIT_EVENT_TYPES = ['paywall_hit', 'trial_limit_hit', 'message_limit_hit'];

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
      // `amount` is rupees for every row; the handful of legacy USD records
      // were converted by scripts/migrate-pricing-to-inr.ts.
      Payment.aggregate([{ $group: { _id: null, totalInr: { $sum: '$amount' } } }]),
      // Funnel: how far each signup actually got.
      User.countDocuments({
        $or: [{ messageCount: { $gt: 0 } }, { totalChatMessages: { $gt: 0 } }],
      }),
      Payment.distinct('clerkId'),
      // Checkout health: orders opened vs payments that actually landed.
      Event.countDocuments({ type: 'order_created' }),
      Payment.countDocuments(),
    ]);

    const eventCountsMap: Record<string, number> = {};
    for (const e of eventCounts as { _id: string; count: number }[]) {
      eventCountsMap[e._id] = e.count;
    }

    const revenue = revenueResult[0] as { totalInr?: number } | undefined;

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
        totalRevenueInr: revenue?.totalInr ?? 0,
      },
      funnel: {
        signedUp: totalUsers,
        enteredBirthDetails: birthChartsGenerated,
        sentAMessage: usersWhoMessaged,
        paid: (payingClerkIds as string[]).length,
      },
      checkout: {
        ordersCreated,
        paymentsCompleted,
        // The gap between these two is what a broken checkout looks like.
        completionRate: ordersCreated > 0 ? paymentsCompleted / ordersCreated : null,
      },
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
