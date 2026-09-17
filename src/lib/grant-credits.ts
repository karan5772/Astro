import connectToDatabase from './mongodb';
import User from './models/User';
import Payment from './models/Payment';
import { logEvent } from './log-event';
import { PLANS } from './plans';
import type { TrustedOrder } from './razorpay';

export type GrantResult =
  | { status: 'granted'; messageBalance: number; voiceBalanceInSeconds: number }
  | { status: 'already_processed' }
  | { status: 'unknown_plan' }
  | { status: 'user_not_found' };

/**
 * Grants a paid plan's credits exactly once for a given Razorpay payment.
 *
 * Idempotency comes from the unique index on `Payment.paymentId`: the insert is
 * attempted *before* any balance is touched, so whichever caller wins the race
 * (checkout callback or webhook) is the only one that credits the account. A
 * duplicate-key error means someone else already did the work.
 */
export async function grantCreditsForPayment(params: {
  order: TrustedOrder;
  paymentId: string;
  source: 'checkout' | 'webhook';
}): Promise<GrantResult> {
  const { order, paymentId, source } = params;

  const planDef = PLANS.find(p => p.id === order.planId);
  if (!planDef) return { status: 'unknown_plan' };

  await connectToDatabase();

  try {
    await Payment.create({
      clerkId: order.clerkId,
      paymentId,
      orderId: order.orderId,
      plan: planDef.id,
      amount: planDef.price,
      amountInr: order.amountInr,
      exchangeRate: order.exchangeRate,
      currency: 'INR',
      messagesGranted: planDef.messagesGranted,
      durationInMinutes: planDef.voiceMinutes,
      source,
    });
  } catch (err) {
    // 11000 = duplicate key, i.e. this payment was already credited.
    if ((err as { code?: number }).code === 11000) return { status: 'already_processed' };
    throw err;
  }

  const dbUser = await User.findOneAndUpdate(
    { clerkId: order.clerkId },
    {
      $set: { isPro: true, lastActiveAt: new Date() },
      $inc: {
        messageBalance: planDef.messagesGranted,
        voiceBalanceInSeconds: planDef.voiceMinutes * 60,
      },
    },
    { returnDocument: 'after' }
  );

  if (!dbUser) {
    // Payment is recorded but there is no account to credit. Loud, because it
    // needs a manual fix rather than a silent drop.
    console.error('[grant-credits] paid order has no matching user', {
      paymentId,
      clerkId: order.clerkId,
    });
    return { status: 'user_not_found' };
  }

  logEvent(order.clerkId, 'payment_completed', {
    paymentId,
    orderId: order.orderId,
    plan: planDef.id,
    amountUsd: planDef.price,
    amountInr: order.amountInr,
    source,
  });

  return {
    status: 'granted',
    messageBalance: dbUser.messageBalance,
    voiceBalanceInSeconds: dbUser.voiceBalanceInSeconds,
  };
}
