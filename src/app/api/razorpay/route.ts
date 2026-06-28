import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logEvent } from '@/lib/log-event';
import { PLANS } from '@/lib/plans';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { plan } = body;

    // Resolve plan and price server-side — never trust client-sent amount
    const planDef = PLANS.find(p => p.id === plan);
    if (!planDef) return new NextResponse('Invalid plan', { status: 400 });
    const amount = planDef.price;

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
    });

    // Fetch live USD → INR rate; fall back to 84 if the request fails
    let exchangeRate = 84;
    try {
      const fxRes = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR', {
        next: { revalidate: 3600 }, // cache for 1 hour
      });
      if (fxRes.ok) {
        const fxData = await fxRes.json();
        exchangeRate = fxData.rates?.INR ?? 84;
      }
    } catch {
      console.warn('[razorpay] FX fetch failed, using fallback rate');
    }

    const amountInInr = Math.round(amount * exchangeRate * 100); // paise

    const options = {
      amount: amountInInr.toString(),
      currency: 'INR',
      receipt: `rcpt_${Math.random().toString(36).substring(7)}`,
      notes: {
        plan,
        userId: userId || 'anonymous',
      }
    };

    const order = await razorpay.orders.create(options);

    logEvent(userId, 'order_created', {
      orderId: order.id,
      plan: plan || null,
      amountUsd: amount,
      exchangeRate,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Razorpay Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
