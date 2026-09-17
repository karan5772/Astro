import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import { grantCreditsForPayment } from '@/lib/grant-credits';
import { fetchTrustedOrder, verifyCheckoutSignature } from '@/lib/razorpay';
import { rateLimit, tooManyRequests } from '@/lib/rate-limit';

/**
 * Confirms a checkout the browser just completed.
 *
 * Nothing about *what was bought* is read from the request body: the signature
 * only covers "<order_id>|<payment_id>", so a valid signature for a cheap order
 * would otherwise be replayable against an expensive plan. The plan, price and
 * owning account all come back from Razorpay's copy of the order.
 *
 * This endpoint is a latency optimisation. The webhook at
 * /api/webhooks/razorpay is the authoritative path and will grant the same
 * credits if the browser never gets here.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const limit = rateLimit(`verify:${userId}`, 20, 60_000);
    if (!limit.ok) return tooManyRequests(limit);

    const body = await req.json().catch(() => null);
    const paymentId = typeof body?.razorpay_payment_id === 'string' ? body.razorpay_payment_id : '';
    const orderId = typeof body?.razorpay_order_id === 'string' ? body.razorpay_order_id : '';
    const signature = typeof body?.razorpay_signature === 'string' ? body.razorpay_signature : '';

    if (!paymentId || !orderId || !signature) {
      return new NextResponse('Missing payment parameters', { status: 400 });
    }

    if (!verifyCheckoutSignature(orderId, paymentId, signature)) {
      return new NextResponse('Invalid signature', { status: 400 });
    }

    const order = await fetchTrustedOrder(orderId);
    if (!order) return new NextResponse('Unknown order', { status: 400 });

    // The order must belong to the caller, and must actually be paid.
    if (order.clerkId !== userId) {
      console.warn('[verify-payment] order/user mismatch', { orderId, userId });
      return new NextResponse('Order does not belong to this account', { status: 403 });
    }
    if (order.status !== 'paid') {
      return new NextResponse('Order is not paid', { status: 409 });
    }

    const result = await grantCreditsForPayment({ order, paymentId, source: 'checkout' });

    if (result.status === 'unknown_plan') {
      return new NextResponse('Unknown plan on order', { status: 400 });
    }
    if (result.status === 'user_not_found') {
      return new NextResponse('User not found', { status: 404 });
    }

    await connectToDatabase();
    const dbUser = await User.findOne({ clerkId: userId });

    return NextResponse.json({
      success: true,
      alreadyProcessed: result.status === 'already_processed',
      isPro: dbUser?.isPro ?? false,
      messageBalance: dbUser?.messageBalance ?? 0,
      voiceBalanceInSeconds: dbUser?.voiceBalanceInSeconds ?? 0,
    });
  } catch (error) {
    console.error('[verify-payment]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
