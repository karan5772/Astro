import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import Payment from '@/lib/models/Payment';
import Event from '@/lib/models/Event';
import { checkAdmin, adminDenialStatus } from '@/lib/admin-auth';

/**
 * Daily counts for the dashboard's charts.
 *
 * Every series is bucketed in UTC so a reload never shifts a bar between days,
 * and the range is filled in with zeroes — a day with no signups has to plot as
 * a gap at zero rather than vanish and compress the axis.
 */
const MAX_DAYS = 180;
const DEFAULT_DAYS = 30;

type Row = { _id: string; n: number; amount?: number };

/** Groups a collection by UTC day over the window. */
function dailyStage(from: Date, match: Record<string, unknown> = {}) {
  return [
    { $match: { createdAt: { $gte: from }, ...match } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
        n: { $sum: 1 },
        amount: { $sum: { $ifNull: ['$amount', 0] } },
      },
    },
  ];
}

function toMap(rows: Row[]): Map<string, Row> {
  return new Map(rows.map(r => [r._id, r]));
}

export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin.ok) {
      return new NextResponse(admin.reason === 'unauthenticated' ? 'Unauthorized' : 'Forbidden', {
        status: adminDenialStatus(admin.reason),
      });
    }

    const requested = Number(req.nextUrl.searchParams.get('days'));
    const days = Number.isFinite(requested)
      ? Math.min(MAX_DAYS, Math.max(1, Math.trunc(requested)))
      : DEFAULT_DAYS;

    await connectToDatabase();

    const from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    from.setUTCDate(from.getUTCDate() - (days - 1));

    const [signups, payments, messages, orders] = await Promise.all([
      User.aggregate(dailyStage(from)),
      Payment.aggregate(dailyStage(from)),
      Event.aggregate(dailyStage(from, { type: 'chat_message_sent' })),
      Event.aggregate(dailyStage(from, { type: 'order_created' })),
    ]);

    const signupMap = toMap(signups as Row[]);
    const paymentMap = toMap(payments as Row[]);
    const messageMap = toMap(messages as Row[]);
    const orderMap = toMap(orders as Row[]);

    const series: {
      date: string; signups: number; payments: number;
      revenueInr: number; messages: number; orders: number;
    }[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setUTCDate(from.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      series.push({
        date: key,
        signups: signupMap.get(key)?.n ?? 0,
        payments: paymentMap.get(key)?.n ?? 0,
        revenueInr: paymentMap.get(key)?.amount ?? 0,
        messages: messageMap.get(key)?.n ?? 0,
        orders: orderMap.get(key)?.n ?? 0,
      });
    }

    return NextResponse.json({ days, from: from.toISOString(), series });
  } catch (error) {
    console.error('[admin/stats/timeseries]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
