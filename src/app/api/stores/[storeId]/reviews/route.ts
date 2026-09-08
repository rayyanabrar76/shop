import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET   /api/stores/[storeId]/reviews        -> the shop's reviews
 * PATCH /api/stores/[storeId]/reviews        { id, status? , reply? } -> publish, hide or answer
 * DELETE /api/stores/[storeId]/reviews?id=   -> remove one
 *
 * Moderation for the owner. Reviews arrive PENDING from the storefront and
 * only count toward the rating Google sees once they are PUBLISHED.
 */

const STATUSES = ['PENDING', 'PUBLISHED', 'HIDDEN'] as const
type Status = (typeof STATUSES)[number]

async function ownedStore(storeId: string) {
  const { userId } = await auth()
  if (!userId) return null
  const store = await prisma.store.findFirst({
    where: { id: storeId, owner: { clerkId: userId } },
    select: { id: true },
  })
  return store
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params
  if (!(await ownedStore(storeId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reviews = await prisma.productReview.findMany({
    where: { storeId },
    // Pending first: they are the ones asking for a decision.
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { product: { select: { id: true, title: true, imageUrl: true } } },
    take: 200,
  })

  return NextResponse.json(reviews)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params
  if (!(await ownedStore(storeId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  const status = body?.status as Status | undefined
  const hasReply = typeof body?.reply === 'string'
  if (!id || (status !== undefined && !STATUSES.includes(status)) || (status === undefined && !hasReply)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  // An empty reply is how a shop takes one back, so it clears the field
  // rather than saving a blank answer under the review.
  const reply = hasReply ? (body.reply as string).trim().slice(0, 1000) : undefined

  // Scoped by storeId so one shop cannot moderate another's reviews.
  const result = await prisma.productReview.updateMany({
    where: { id, storeId },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(reply !== undefined ? { reply: reply || null, repliedAt: reply ? new Date() : null } : {}),
    },
  })
  if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params
  if (!(await ownedStore(storeId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = new URL(req.url).searchParams.get('id') ?? ''
  if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const result = await prisma.productReview.deleteMany({ where: { id, storeId } })
  if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
