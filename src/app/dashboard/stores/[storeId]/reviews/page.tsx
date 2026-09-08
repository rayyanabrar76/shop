import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import ReviewsClient from './ReviewsClient'

export const metadata = { title: 'Reviews' }

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({
    where: { id: storeId, owner: { clerkId } },
    select: { id: true },
  })
  if (!store) notFound()

  const reviews = await prisma.productReview.findMany({
    where: { storeId },
    // Pending first: they are the only ones asking for a decision.
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { product: { select: { id: true, title: true, imageUrl: true } } },
    take: 200,
  })

  return (
    <div className="min-h-full bg-(--admin-page)">
      <ReviewsClient
        storeId={storeId}
        reviews={reviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))}
      />
    </div>
  )
}
