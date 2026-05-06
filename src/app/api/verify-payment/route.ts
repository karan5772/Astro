import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = body;

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
    
    const dbUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { 
        $set: { isPro: true },
        $push: { 
          payments: { 
            paymentId: razorpay_payment_id, 
            orderId: razorpay_order_id, 
            amount: amount || 999 
          } 
        } 
      },
      { new: true }
    );

    if (!dbUser) {
      return new NextResponse('User not found in DB', { status: 404 });
    }

    return NextResponse.json({ success: true, isPro: dbUser.isPro });
  } catch (error) {
    console.error('Payment verification error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
