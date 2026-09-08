import { NextResponse } from 'next/server'
import { sendPendingReviewRequests } from '@/lib/review-requests'

/**
 * GET /api/cron/review-requests
 *
 * Asks recent buyers of every shop what they thought. Meant for a daily
 * schedule: Vercel Cron, or anything else that can fetch a URL once a day.
 *
 * Guarded by a shared secret rather than a session, because a scheduler has
 * no session. Without CRON_SECRET set the route refuses to run at all, which
 * is the right failure: an open endpoint that emails customers is worse than
 * one that does nothing.
 */
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 })
  }

  // Vercel Cron sends the secret as a bearer token; anything else can put it
  // in the query string.
  const auth = req.headers.get('authorization')
  const given = auth?.startsWith('Bearer ') ? auth.slice(7) : new URL(req.url).searchParams.get('secret')
  if (given !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await sendPendingReviewRequests({})
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron:review-requests]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
