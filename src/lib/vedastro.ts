/**
 * Client for the upstream Jyotish calculation service.
 *
 * That service allows roughly 5 calls per minute on the free tier, account-wide,
 * and onboarding alone needs three. So calls are metered through a token bucket
 * here and a rate-limited response is retried rather than surfaced: the ceiling
 * is low enough that two people signing up together would otherwise collide.
 *
 * Setting VEDASTRO_API_KEY raises the upstream ceiling and relaxes the bucket,
 * but everything below is designed to work without one.
 */

const BASE = 'https://api.vedastro.org/api/Calculate';

// Stay just under the documented free-tier ceiling.
const FREE_TIER_CALLS = 5;
const PAID_TIER_CALLS = 180;
const WINDOW_MS = 60_000;

// How long a caller will wait for a slot before giving up. Kept well inside the
// route's maxDuration: a clean "try again in a minute" beats a serverless
// timeout, which reaches the user as an opaque 500.
const MAX_QUEUE_WAIT_MS = 14_000;
// A rate-limited response is retried this many times before failing.
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 8_000;

export class RateLimitedError extends Error {
  constructor() {
    super('Astrology calculation service rate limit reached');
    this.name = 'RateLimitedError';
  }
}

function capacity(): number {
  return process.env.VEDASTRO_API_KEY ? PAID_TIER_CALLS : FREE_TIER_CALLS;
}

// Token bucket, refilled continuously. Module scope, so it is shared by every
// request this server instance handles.
type Bucket = { tokens: number; lastRefill: number };
const g = globalThis as unknown as { __vedastroBucket?: Bucket };
g.__vedastroBucket ??= { tokens: capacity(), lastRefill: Date.now() };
const bucket = g.__vedastroBucket;

function refill() {
  const now = Date.now();
  const gained = ((now - bucket.lastRefill) / WINDOW_MS) * capacity();
  if (gained > 0) {
    bucket.tokens = Math.min(capacity(), bucket.tokens + gained);
    bucket.lastRefill = now;
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Waits for a token, or throws once waiting would exceed MAX_QUEUE_WAIT_MS. */
async function acquireSlot(): Promise<void> {
  const deadline = Date.now() + MAX_QUEUE_WAIT_MS;
  for (;;) {
    refill();
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return;
    }
    // Time until the next whole token becomes available.
    const wait = Math.ceil(((1 - bucket.tokens) / capacity()) * WINDOW_MS);
    if (Date.now() + wait > deadline) throw new RateLimitedError();
    await sleep(Math.min(wait, 2000));
  }
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const key = process.env.VEDASTRO_API_KEY;
  return { ...extra, ...(key ? { 'x-api-key': key } : {}) };
}

/** The service answers 200 with a plain-text rate-limit notice in the payload. */
function looksRateLimited(text: string): boolean {
  return text.includes('rate limit exceeded');
}

async function request(path: string, init?: RequestInit): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    await acquireSlot();
    const res = await fetch(`${BASE}/${path}`, init);
    if (!res.ok) throw new Error(`Calculation service returned ${res.status}`);
    const text = await res.text();

    if (!looksRateLimited(text)) return text;

    // Upstream disagreed with our accounting — drain the bucket and back off.
    bucket.tokens = 0;
    bucket.lastRefill = Date.now();
    if (attempt >= MAX_RETRIES) throw new RateLimitedError();
    await sleep(RETRY_DELAY_MS);
  }
}

function unwrap(text: string): unknown {
  const json = JSON.parse(text);
  if (json?.Status !== 'Pass') throw new Error('Calculation service returned a failure status');
  return json.Payload;
}

export async function calcGet(path: string): Promise<unknown> {
  return unwrap(await request(path, { headers: headers() }));
}

export async function calcPost(name: string, body: unknown): Promise<unknown> {
  return unwrap(await request(name, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  }));
}

/** Chart rendering returns raw SVG rather than the usual JSON envelope. */
export async function calcPostRaw(name: string, body: unknown): Promise<string> {
  return request(name, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
}
