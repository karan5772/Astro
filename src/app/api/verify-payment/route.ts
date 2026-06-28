import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import Payment from '@/lib/models/Payment';
import { logEvent } from '@/lib/log-event';
import { PLANS } from '@/lib/plans';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount, plan } = body;

    // Resolve plan details from shared definition
    const planDef = PLANS.find(p => p.id === plan);
    const messagesGranted = planDef?.messagesGranted ?? 0;
    const durationInMinutes = planDef?.voiceMinutes ?? 0;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is not defined");
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    // Verify signature
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(text.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return new NextResponse('Invalid signature', { status: 400 });
    }

    // Connect to DB and update the user's isPro status & payment details
    await connectToDatabase();

    const currentUserDoc = await User.findOne({ clerkId: userId });
    if (!currentUserDoc) {
      return new NextResponse('User not found in DB', { status: 404 });
    }

    // Prevent replay: reject if this payment ID was already processed
    const existingPayment = await Payment.findOne({ paymentId: razorpay_payment_id });
    if (existingPayment) {
      return new NextResponse('Payment already processed', { status: 409 });
    }

    // Create the payment record in the separate payments collection
    await Payment.create({
      clerkId: userId,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      plan: plan || null,
      amount: amount || 999,
      currency: 'INR',
      messagesGranted,
      durationInMinutes,
    });

    const dbUser = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: { isPro: true, lastActiveAt: new Date() },
        $inc: {
          messageBalance: messagesGranted,
          voiceBalanceInSeconds: durationInMinutes * 60,
        },
      },
      { new: true }
    );

    logEvent(userId, 'payment_completed', {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      plan: plan || null,
      amount: amount || 999,
      durationInMinutes,
    });

    return NextResponse.json({ success: true, isPro: dbUser.isPro, messageBalance: dbUser.messageBalance, voiceBalanceInSeconds: dbUser.voiceBalanceInSeconds });
  } catch (error) {
    console.error('Payment verification error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
