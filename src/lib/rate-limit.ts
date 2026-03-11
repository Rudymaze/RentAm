/**
 * Centralized sliding-window in-memory rate limiter.
 *
 * Suitable for Next.js running in a single server process.
 * For multi-instance / edge deployments, swap the store for Redis / Upstash.
 *
 * Usage:
 *   import { rateLimit, STRICT, applyRateLimit } from '@/lib/rate-limit';
 *
 *   const result = rateLimit(`action:${userId}`, STRICT);
 *   if (!result.allowed) return rateLimitResponse(result);
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Internal store ────────────────────────────────────────────────────────────

interface Entry {
  count: number;
  resetAt: number; // Unix ms
}

/** Singleton Map shared across all imports in the same process. */
const store = new Map<string, Entry>();

/** Periodic cleanup — runs every 5 minutes, removes expired entries. */
let _cleanupStarted = false;
function ensureCleanup() {
  if (_cleanupStarted) return;
  _cleanupStarted = true;
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60_000);
  // Allow the Node.js process to exit even if the timer is pending.
  if (timer.unref) timer.unref();
}

// ── Core check ────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix ms
}

/**
 * Check and increment a rate-limit counter.
 *
 * @param key       Unique string, e.g. `"search:user_abc123"` or `"login:1.2.3.4"`
 * @param limit     Maximum requests allowed in the window.
 * @param windowMs  Window duration in milliseconds (default: 60 s).
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000
): RateLimitResult {
  ensureCleanup();
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { allowed: true, limit, remaining: limit - 1, resetAt: entry.resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, limit, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    limit,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// ── Presets ───────────────────────────────────────────────────────────────────

/** 10 req / 60 s — sensitive mutations: auth, avatar upload, appeal, complaint */
export const STRICT = { limit: 10, windowMs: 60_000 } as const;

/** 20 req / 60 s — write endpoints: profile update, favorites, status change */
export const MODERATE = { limit: 20, windowMs: 60_000 } as const;

/** 30 req / 60 s — standard authenticated reads */
export const STANDARD = { limit: 30, windowMs: 60_000 } as const;

/** 60 req / 60 s — high-frequency reads: search, map, saved-searches list */
export const RELAXED = { limit: 60, windowMs: 60_000 } as const;

/** 10 req / 60 s — endpoints that call external APIs (geocode, reverse-geocode) */
export const EXTERNAL = { limit: 10, windowMs: 60_000 } as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build standard HTTP rate-limit response headers from a result.
 * Sets X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset,
 * and Retry-After (only when not allowed).
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
  if (!result.allowed) {
    headers['Retry-After'] = String(Math.ceil((result.resetAt - Date.now()) / 1000));
  }
  return headers;
}

/**
 * Build a 429 Too Many Requests NextResponse with standard headers.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Too many requests. Please try again later.' },
    { status: 429, headers: rateLimitHeaders(result) }
  );
}

/**
 * Extract the best available client identifier from a request:
 * prefers authenticated user ID, falls back to IP address.
 *
 * Pass `userId` when the caller has already authenticated the request.
 */
export function clientKey(req: NextRequest, userId?: string | null): string {
  if (userId) return userId;
  // Common headers set by Vercel / proxies
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';
  return `ip:${ip}`;
}

/**
 * Convenience: check rate limit and return a 429 response if exceeded.
 * Returns `null` if the request is allowed.
 *
 * Example:
 *   const limited = applyRateLimit(`profile:${user.id}`, STRICT);
 *   if (limited) return limited;
 */
export function applyRateLimit(
  key: string,
  preset: { limit: number; windowMs: number }
): NextResponse | null {
  const result = rateLimit(key, preset.limit, preset.windowMs);
  if (!result.allowed) return rateLimitResponse(result);
  return null;
}
