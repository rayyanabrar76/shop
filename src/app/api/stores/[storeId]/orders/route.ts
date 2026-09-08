import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/stores/[storeId]/orders
 *
 * The newest orders, trimmed to what a list needs: who ordered, what, for
 * how much, and where it stands. The admin search indexes this so an order
 * can be found by the customer's name, their email, its id, or a product in
 * it. Capped at 300: the search is for finding a recent order fast, and the
 * orders page still has the full history.
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

  const orders = await prisma.order.findMany({
    where: { storeId },
    orderBy: { createdAt: 'desc' },
    take: 300,
    select: {
      id: true, total: true, status: true, createdAt: true,
      customerName: true, customerEmail: true,
      items: { select: { quantity: true, product: { select: { title: true } } } },
    },
  })

  return NextResponse.json(
    orders.map(o => ({
      id: o.id,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
      itemTitles: o.items.map(i => i.product.title),
    })),
  )
}
