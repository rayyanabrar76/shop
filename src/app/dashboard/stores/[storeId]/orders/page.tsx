import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import OrdersClient from './OrdersClient'

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } } })
  if (!store) notFound()

  const orders = await prisma.order.findMany({
    where: { storeId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: { product: true },
      },
    },
  })

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.status === 'PAID').length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    revenue: orders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + o.total, 0),
  }

  return <OrdersClient storeId={storeId} orders={orders} stats={stats} />
}