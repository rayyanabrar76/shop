import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params

  const store = await prisma.store.findUnique({ where: { id: storeId } })
  if (!store) notFound()

  // Fetch all orders with items
  const orders = await prisma.order.findMany({
    where: { storeId },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const products = await prisma.product.findMany({
    where: { storeId },
    include: { orderItems: true },
  })

  const customers = await prisma.customer.findMany({
    where: { storeId },
    orderBy: { createdAt: 'asc' },
  })

  // ── Revenue by day (last 30 days) ──────────────────────────────────────────
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const revenueByDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    revenueByDay[key] = 0
  }

  for (const order of orders) {
    if (order.status === 'PAID') {
      const key = new Date(order.createdAt).toISOString().slice(0, 10)
      if (key in revenueByDay) {
        revenueByDay[key] = (revenueByDay[key] ?? 0) + order.total
      }
    }
  }

  const revenueChart = Object.entries(revenueByDay).map(([date, revenue]) => ({
    date,
    revenue,
  }))

  // ── Top products by units sold ─────────────────────────────────────────────
  const topProducts = products
    .map(p => ({
      id: p.id,
      title: p.title,
      unitsSold: p.orderItems.reduce((sum, oi) => sum + oi.quantity, 0),
      revenue: p.orderItems.reduce((sum, oi) => sum + oi.price * oi.quantity, 0),
    }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5)

  // ── Summary stats ──────────────────────────────────────────────────────────
  const paidOrders = orders.filter(o => o.status === 'PAID')
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0)
  const totalOrders = orders.length
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0

  // This month
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const revenueThisMonth = paidOrders
    .filter(o => new Date(o.createdAt) >= thisMonth)
    .reduce((sum, o) => sum + o.total, 0)

  // Order status breakdown
  const statusBreakdown = {
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    PAID: orders.filter(o => o.status === 'PAID').length,
    CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
    REFUNDED: orders.filter(o => o.status === 'REFUNDED').length,
  }

  // Customers over time (last 30 days)
  const customersByDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    customersByDay[d.toISOString().slice(0, 10)] = 0
  }
  for (const c of customers) {
    const key = new Date(c.createdAt).toISOString().slice(0, 10)
    if (key in customersByDay) customersByDay[key]++
  }
  const customerChart = Object.entries(customersByDay).map(([date, count]) => ({ date, count }))

  return (
    <AnalyticsClient
      store={store}
      stats={{
        totalRevenue,
        totalOrders,
        totalCustomers: customers.length,
        avgOrderValue,
        revenueThisMonth,
        statusBreakdown,
      }}
      revenueChart={revenueChart}
      customerChart={customerChart}
      topProducts={topProducts}
    />
  )
}