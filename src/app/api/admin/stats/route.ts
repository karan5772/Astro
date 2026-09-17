import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import Payment from '@/lib/models/Payment';
import Event from '@/lib/models/Event';

// No default: an unset ADMIN_EMAILS locks the dashboard rather than quietly
// granting access to whatever address happens to be baked into the source.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

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
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    if (ADMIN_EMAILS.length === 0) {
      console.error('[admin/stats] ADMIN_EMAILS is not configured');
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Authorise against Clerk's copy of the email, not our mirror of it —
    // the identity provider is the source of truth.
    type ClerkEmail = { id: string; emailAddress: string };
    const clerkUser = await currentUser();
    const addresses: ClerkEmail[] = clerkUser?.emailAddresses ?? [];
    const email =
      addresses.find(a => a.id === clerkUser?.primaryEmailAddressId)?.emailAddress ??
      addresses[0]?.emailAddress;

    if (!email || !ADMIN_EMAILS.includes(email.toLowerCase())) {
      return new NextResponse('Forbidden', { status: 403 });
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
