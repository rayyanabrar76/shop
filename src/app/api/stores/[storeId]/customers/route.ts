import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/stores/[storeId]/customers
 *
 * Every customer with how many orders they have placed and what they have
 * spent. Orders are joined to customers by email, since that is the only
 * link the two tables share, and a single grouped query covers all of them.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storeId } = await params
  const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId: userId } }, select: { id: true } })
  if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [customers, orderStats] = await Promise.all([
    prisma.customer.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, createdAt: true },
    }),
    prisma.order.groupBy({
      by: ['customerEmail'],
      where: { storeId, customerEmail: { not: null }, status: { in: ['PAID', 'PENDING'] } },
      _count: { _all: true },
      _sum: { total: true },
    }),
  ])
  const byEmail = new Map(
    orderStats.map(s => [s.customerEmail!.toLowerCase(), { orders: s._count._all, spent: s._sum.total ?? 0 }]),
  )

  return NextResponse.json(
    customers.map(c => {
      const stats = byEmail.get(c.email.toLowerCase())
      return { ...c, orders: stats?.orders ?? 0, spent: stats?.spent ?? 0 }
    }),
  )
}
