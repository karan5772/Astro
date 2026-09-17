import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logEvent } from '@/lib/log-event';
import { PLANS } from '@/lib/plans';
import { getRazorpayClient } from '@/lib/razorpay';
import { rateLimit, tooManyRequests } from '@/lib/rate-limit';

// Sanity bounds on the USD->INR rate. A malformed FX response should never be
// able to charge a customer an absurd amount.
const FX_FALLBACK = 88;
const FX_MIN = 60;
const FX_MAX = 120;

async function getUsdToInrRate(): Promise<number> {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return FX_FALLBACK;
    const data = await res.json();
    const rate = Number(data?.rates?.INR);
    if (!Number.isFinite(rate) || rate < FX_MIN || rate > FX_MAX) return FX_FALLBACK;
    return rate;
  } catch {
    console.warn('[razorpay] FX fetch failed, using fallback rate');
    return FX_FALLBACK;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const limit = rateLimit(`order:${userId}`, 10, 60_000);
    if (!limit.ok) return tooManyRequests(limit);

    const body = await req.json().catch(() => null);
    const plan = typeof body?.plan === 'string' ? body.plan : '';

    // The price is resolved server-side and written into the order's notes, so
    // verification and the webhook can both recover it without trusting anyone.
    const planDef = PLANS.find(p => p.id === plan);
    if (!planDef) return new NextResponse('Invalid plan', { status: 400 });

    const exchangeRate = await getUsdToInrRate();
    const amountInPaise = Math.round(planDef.price * exchangeRate * 100);

    const order = await getRazorpayClient().orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      notes: {
        plan: planDef.id,
        userId,
        amountUsd: String(planDef.price),
        exchangeRate: exchangeRate.toFixed(4),
      },
    });

    logEvent(userId, 'order_created', {
      orderId: order.id,
      plan: planDef.id,
      amountUsd: planDef.price,
      exchangeRate,
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
