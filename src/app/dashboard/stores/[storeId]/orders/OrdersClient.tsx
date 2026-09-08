'use client'

import { useState } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/dashboard/PageHeader'
import {
  HiShoppingBag, HiCheckCircle,
  HiClock, HiXCircle, HiRefresh, HiCheck,
} from 'react-icons/hi'
import { useDashboardPrice } from '@/components/CurrencyProvider'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: { title: string; imageUrl: string | null } | null
}

interface Order {
  id: string
  total: number
  status: string
  createdAt: Date
  paymentMethod: string | null
  customerName: string | null
  customerEmail: string | null
  customerCity: string | null
  items: OrderItem[]
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    PAID:      { label: 'Paid',      color: '#10b981', bg: '#f0fdf4', icon: HiCheckCircle },
    PENDING:   { label: 'Pending',   color: '#f59e0b', bg: '#fffbeb', icon: HiClock },
    CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: '#fef2f2', icon: HiXCircle },
    REFUNDED:  { label: 'Refunded',  color: '#8b5cf6', bg: '#f5f3ff', icon: HiRefresh },
  }
  const c = config[status] ?? { label: status, color: '#71717a', bg: '#f4f4f5', icon: HiClock }
  const Icon = c.icon
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: c.bg, color: c.color }}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  )
}

export default function OrdersClient({ storeId, orders: initial, stats }: {
  storeId: string
  orders: Order[]
  stats: { total: number; paid: number; pending: number; revenue: number }
}) {
  const price = useDashboardPrice()
  const [orders, setOrders] = useState<Order[]>(initial)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  async function markAsPaid(orderId: string) {
    setMarkingPaid(orderId)
    try {
      const res = await fetch(`/api/stores/${storeId}/orders/${orderId}/mark-paid`, { method: 'POST' })
      if (res.ok) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'PAID' } : o))
    } finally {
      setMarkingPaid(null)
    }
  }

  return (
    <div className="min-h-full bg-(--admin-page)">
      {/* Header */}
      <PageHeader
        storeId={storeId}
        icon={<HiShoppingBag className="w-5 h-5" />}
        title="Orders"
        count={orders.length}
        action={
          <a
            href={`/api/stores/${storeId}/orders/export`}
            download
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-(--admin-border) bg-(--admin-card) px-3 text-[11.5px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 hover:border-(--admin-field-border) transition-colors"
          >
            Export CSV
          </a>
        }
      />

      <div className="max-w-6xl mx-auto px-6 pb-10 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: stats.total,                                  color: '#6c47ff' },
            { label: 'Paid',         value: stats.paid,                                   color: '#10b981' },
            { label: 'Pending',      value: stats.pending,                                color: '#f59e0b' },
            { label: 'Revenue',      value: price(stats.revenue),       color: '#3b82f6' },
          ].map(stat => (
            <div key={stat.label} className="bg-(--admin-card) rounded-2xl border border-(--admin-border) px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 border-b border-(--admin-edge) bg-zinc-50/60 dark:bg-zinc-800/60">
            {['Order', 'Customer', 'Items', 'Total', 'Status', 'Action'].map((h, i) => (
              <div key={h} className={`${i === 0 ? 'col-span-2' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-2' : i === 3 ? 'col-span-1' : i === 4 ? 'col-span-2' : 'col-span-2'} text-[11px] font-bold uppercase tracking-widest text-zinc-500`}>{h}</div>
            ))}
          </div>

          {orders.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <HiShoppingBag className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
              </div>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">No orders yet</p>
              <p className="text-xs text-zinc-500">Orders will appear here when customers purchase.</p>
            </div>
          ) : (
            <div className="divide-y divide-(--admin-edge)">
              {orders.map(order => (
                <div key={order.id} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <Link href={`/dashboard/stores/${storeId}/orders/${order.id}`} className="col-span-2 -my-4 py-4 hover:underline">
                    <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      {order.id.slice(0, 10)}...
                    </span>
                    <p className="text-[10px] text-zinc-500 mt-1 capitalize">{order.paymentMethod ?? '-'}</p>
                  </Link>
                  <div className="col-span-3 min-w-0">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{order.customerName ?? '-'}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{order.customerEmail ?? ''}</p>
                    {order.customerCity && <p className="text-[10px] text-zinc-500">{order.customerCity}</p>}
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {order.items.length === 1 ? order.items[0]?.product?.title ?? 'Item' : `${order.items.length} items`}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{price(order.total)}</span>
                  </div>
                  <div className="col-span-2">
                    <StatusBadge status={order.status} />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="col-span-2">
                    {order.status === 'PENDING' ? (
                      <button
                        onClick={() => markAsPaid(order.id)}
                        disabled={markingPaid === order.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <HiCheck className="w-3 h-3" />
                        {markingPaid === order.id ? 'Saving...' : 'Mark Paid'}
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-300 dark:text-zinc-600">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {orders.length > 0 && (
            <div className="px-5 py-3 border-t border-(--admin-edge) bg-zinc-50/60 dark:bg-zinc-800/60">
              <p className="text-xs text-zinc-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
