import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPendingReviewRequests } from '@/lib/review-requests'

/**
 * POST /api/stores/[storeId]/reviews/request
 *
 * Sends the review request emails for this shop now, rather than waiting for
 * the daily run. The same job either way, so an order that has already been
 * asked is never asked twice however often this is pressed.
 *
 * The wait is shortened to one day here. A merchant pressing the button has
 * decided their orders have arrived, and the five day default exists for the
 * unattended schedule, which cannot know that.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storeId } = await params
  const store = await prisma.store.findFirst({
    where: { id: storeId, owner: { clerkId: userId } },
    select: { id: true },
  })
  if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const result = await sendPendingReviewRequests({ storeId, waitDays: 1 })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[reviews:request]', err)
    return NextResponse.json({ error: 'Could not send those' }, { status: 500 })
  }
}
