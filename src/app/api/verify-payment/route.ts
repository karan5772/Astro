import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import Payment from '@/lib/models/Payment';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount, durationInMinutes = 10 } = body;

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

    // Create the payment record in the separate payments collection
    await Payment.create({
      clerkId: userId,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: amount || 999,
      durationInMinutes
    });

    const dbUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { 
        $set: { isPro: true },
        $inc: { voiceBalanceInSeconds: durationInMinutes * 60 }
      },
      { new: true }
    );

    return NextResponse.json({ success: true, isPro: dbUser.isPro, voiceBalanceInSeconds: dbUser.voiceBalanceInSeconds });
  } catch (error) {
    console.error('Payment verification error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
