/**
 * Fixed-window, in-memory rate limiter.
 *
 * Scope is a single server instance — on serverless each cold instance keeps its
 * own counters, so treat these as soft ceilings that blunt abuse and runaway
 * loops rather than a hard guarantee. Move to Redis/Upstash if you need exact
 * limits across instances.
 */

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();
let lastSweep = Date.now();

// Drop expired windows occasionally so the map can't grow without bound.
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, win] of buckets) {
    if (win.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return { ok: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/** 429 response with a Retry-After header, for when `rateLimit` says no. */
export function tooManyRequests(result: RateLimitResult): Response {
  return new Response('Too many requests', {
    status: 429,
    headers: { 'Retry-After': String(result.retryAfterSeconds) },
  });
}
