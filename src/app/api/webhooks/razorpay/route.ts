import { NextRequest, NextResponse } from 'next/server';
import { fetchTrustedOrder, verifyWebhookSignature } from '@/lib/razorpay';
import { grantCreditsForPayment } from '@/lib/grant-credits';

/**
 * Authoritative payment path.
 *
 * The checkout callback in the browser is best-effort — a closed tab or a
 * dropped connection between "paid" and "credited" would otherwise take the
 * customer's money and give them nothing. Razorpay retries this endpoint until
 * it gets a 2xx, so credits land even when the browser never comes back.
 *
 * Unauthenticated by design: the caller is Razorpay, not a signed-in user.
 * Authenticity comes from the HMAC over the raw body, which is why the body is
 * read as text and never re-serialised. Keep this path out of the Clerk
 * protected-route matcher in src/proxy.ts.
 */
export async function POST(req: NextRequest) {
  let event: string | undefined;
  try {
    const signature = req.headers.get('x-razorpay-signature') ?? '';
    const rawBody = await req.text();

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      console.warn('[webhooks/razorpay] rejected: bad signature');
      return new NextResponse('Invalid signature', { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    event = payload?.event;

    // Only captured payments move money. `payment.authorized` is not settled,
    // and `payment.failed` has nothing to grant.
    if (event !== 'payment.captured') {
      return NextResponse.json({ received: true, ignored: event });
    }

    const entity = payload?.payload?.payment?.entity;
    const paymentId: string = entity?.id ?? '';
    const orderId: string = entity?.order_id ?? '';

    if (!paymentId || !orderId) {
      console.error('[webhooks/razorpay] captured event without ids', { event });
      // 200 so Razorpay stops retrying something we can never process.
      return NextResponse.json({ received: true, error: 'missing ids' });
    }

    const order = await fetchTrustedOrder(orderId);
    if (!order) {
      console.error('[webhooks/razorpay] order missing required notes', { orderId });
      return NextResponse.json({ received: true, error: 'unusable order' });
    }

    const result = await grantCreditsForPayment({ order, paymentId, source: 'webhook' });
    console.log('[webhooks/razorpay]', { paymentId, orderId, result: result.status });

    return NextResponse.json({ received: true, result: result.status });
  } catch (error) {
    // A 500 tells Razorpay to retry, which is what we want for transient
    // failures such as the database being briefly unreachable.
    console.error('[webhooks/razorpay]', event, error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}
