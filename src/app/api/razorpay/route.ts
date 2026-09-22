import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logEvent } from '@/lib/log-event';
import { PLANS, CURRENCY } from '@/lib/plans';
import { getRazorpayClient } from '@/lib/razorpay';
import { rateLimit, tooManyRequests } from '@/lib/rate-limit';

/**
 * Creates the Razorpay order for a plan.
 *
 * Prices are held in rupees, which is what Razorpay charges, so there is no
 * conversion step and no exchange rate to go stale: the amount shown on the
 * pricing page is the amount debited. The price is resolved from PLANS here
 * and written into the order's notes, so verification and the webhook can both
 * recover what was bought without trusting anything the client sent.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const limit = rateLimit(`order:${userId}`, 10, 60_000);
    if (!limit.ok) return tooManyRequests(limit);

    const body = await req.json().catch(() => null);
    const plan = typeof body?.plan === 'string' ? body.plan : '';

    const planDef = PLANS.find(p => p.id === plan);
    if (!planDef) return new NextResponse('Invalid plan', { status: 400 });

    const order = await getRazorpayClient().orders.create({
      amount: planDef.price * 100,          // Razorpay takes paise
      currency: CURRENCY,
      receipt: `rcpt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      notes: {
        plan: planDef.id,
        userId,
        amount: String(planDef.price),
      },
    });

    logEvent(userId, 'order_created', {
      orderId: order.id,
      plan: planDef.id,
      amount: planDef.price,
      currency: CURRENCY,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('[razorpay/order]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
