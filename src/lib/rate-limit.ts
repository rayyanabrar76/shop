// Lightweight in-memory rate limiter. Suitable for a single-process / single-region
// deployment. For multi-region scale, swap to Upstash @upstash/ratelimit.
//
// Each bucket is keyed by `key` and tracks a sliding window via timestamps.

import { NextResponse, type NextRequest } from 'next/server'

const buckets = new Map<string, number[]>()

interface RateLimitOptions {
  windowMs: number
  max: number
}

export function rateLimit(key: string, opts: RateLimitOptions): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const cutoff = now - opts.windowMs
  const list = (buckets.get(key) ?? []).filter((t) => t > cutoff)
  if (list.length >= opts.max) {
    const oldest = list[0]
    return { ok: false, retryAfter: Math.ceil((oldest + opts.windowMs - now) / 1000) }
  }
  list.push(now)
  buckets.set(key, list)
  return { ok: true, retryAfter: 0 }
}

// Sweep stale buckets occasionally to prevent unbounded growth.
let lastSweep = Date.now()
function maybeSweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [k, v] of buckets) {
    if (v.length === 0 || v[v.length - 1] < now - 10 * 60 * 1000) {
      buckets.delete(k)
    }
  }
}

export function getClientIp(req: NextRequest | Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

/**
 * Helper: guard a route by IP+path. Returns a 429 NextResponse if exceeded, else null.
 */
export function guard(
  req: NextRequest | Request,
  scope: string,
  opts: RateLimitOptions,
): NextResponse | null {
  const now = Date.now()
  maybeSweep(now)
  const ip = getClientIp(req)
  const key = `${scope}:${ip}`
  const { ok, retryAfter } = rateLimit(key, opts)
  if (!ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down and try again.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }
  return null
}
