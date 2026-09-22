import crypto from 'crypto';
import Razorpay from 'razorpay';

/**
 * Razorpay client + signature helpers.
 *
 * Every getter throws when its secret is missing rather than falling back to a
 * placeholder — a silently mis-keyed payment integration is worse than a 500.
 */

export function getRazorpayKeySecret(): string {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('RAZORPAY_KEY_SECRET is not set');
  return secret;
}

export function getRazorpayWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET is not set');
  return secret;
}

export function getRazorpayClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  if (!key_id) throw new Error('RAZORPAY_KEY_ID is not set');
  return new Razorpay({ key_id, key_secret: getRazorpayKeySecret() });
}

/** Constant-time compare so signature checks don't leak timing information. */
export function safeEqualHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

/** Checkout handler signature: HMAC-SHA256 of "<order_id>|<payment_id>". */
export function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac('sha256', getRazorpayKeySecret())
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC-SHA256 over the exact raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', getRazorpayWebhookSecret())
    .update(rawBody)
    .digest('hex');
  return safeEqualHex(expected, signature);
}

/**
 * The trusted description of a purchase, taken from the order Razorpay holds —
 * never from the client. `notes` is written by us at order-creation time.
 */
export type TrustedOrder = {
  orderId: string;
  clerkId: string;
  planId: string;
  /** Rupees, as charged. */
  amount: number;
  status: string;
};

/**
 * Returns null when the order is permanently unusable (unknown id, malformed
 * id, missing notes) and throws when the lookup failed for a reason worth
 * retrying. Callers use that distinction to decide whether to tell Razorpay's
 * webhook to redeliver: a 4xx from their API will never succeed on a retry,
 * while a network blip or a 5xx will.
 */
export async function fetchTrustedOrder(orderId: string): Promise<TrustedOrder | null> {
  if (typeof orderId !== 'string' || !/^order_[A-Za-z0-9]+$/.test(orderId)) return null;

  let order;
  try {
    order = await getRazorpayClient().orders.fetch(orderId);
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (typeof status === 'number' && status >= 400 && status < 500) {
      console.error('[razorpay] order lookup rejected', { orderId, status });
      return null;
    }
    throw err;
  }

  const notes = (order.notes ?? {}) as Record<string, string | number>;

  const clerkId = String(notes.userId ?? '');
  const planId = String(notes.plan ?? '');
  if (!clerkId || !planId) return null;

  return {
    orderId: order.id,
    clerkId,
    planId,
    // Taken from the order itself rather than the notes: this is the figure
    // Razorpay actually billed.
    amount: Number(order.amount) / 100,
    status: order.status,
  };
}
