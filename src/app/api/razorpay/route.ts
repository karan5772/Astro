import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { amount, plan } = body;

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
    });

    // Convert USD to INR (approximate exchange rate)
    const EXCHANGE_RATE = 83;
    const amountInInr = amount * EXCHANGE_RATE;

    const options = {
      amount: Math.round(amountInInr * 100).toString(), // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: `rcpt_${Math.random().toString(36).substring(7)}`,
      notes: {
        plan,
        userId: userId || 'anonymous',
      }
    };

    const order = await razorpay.orders.create(options);

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
