'use client'

import { useState } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/dashboard/PageHeader'
import { TrendingUp, ShoppingBag, Users, DollarSign, BarChart2, Package } from 'lucide-react'
import { useDashboardPrice } from '@/components/CurrencyProvider'

interface Props {
  store: { id: string; name: string }
  stats: {
    totalRevenue: number; totalOrders: number; totalCustomers: number
    avgOrderValue: number; revenueThisMonth: number; statusBreakdown: Record<string, number>
  }
  revenueChart: { date: string; revenue: number }[]
  customerChart: { date: string; count: number }[]
  topProducts: { id: string; title: string; unitsSold: number; revenue: number }[]
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function LineChart({ data, valueKey, color = '#6c47ff', height = 80 }: { data: Record<string, number | string>[]; valueKey: string; color?: string; height?: number }) {
  const values = data.map(d => Number(d[valueKey]))
  const max = Math.max(...values, 1); const min = Math.min(...values); const range = max - min || 1
  const w = 600; const h = height; const pad = 4
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (w - pad * 2) + pad
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })
  const area = [`M ${points[0]}`, ...points.slice(1).map(p => `L ${p}`), `L ${w - pad},${h}`, `L ${pad},${h}`, 'Z'].join(' ')
  const line = [`M ${points[0]}`, ...points.slice(1).map(p => `L ${p}`)].join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${valueKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${valueKey})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BarChart({ data, valueKey, color = '#6c47ff' }: { data: Record<string, number | string>[]; valueKey: string; color?: string }) {
  const values = data.map(d => Number(d[valueKey]))
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-px h-16 w-full">
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all hover:opacity-80" style={{ height: `${Math.max((v / max) * 100, v > 0 ? 4 : 0)}%`, backgroundColor: v > 0 ? color : 'rgba(128,128,128,0.15)', minHeight: 2 }} title={`${data[i]['date']}: ${v}`} />
      ))}
    </div>
  )
}

export default function AnalyticsClient({ store, stats, revenueChart, customerChart, topProducts }: Props) {
  const fmt = useDashboardPrice()
  const [activeChart, setActiveChart] = useState<'revenue' | 'customers'>('revenue')

  const statCards = [
    { label: 'Total Revenue',    value: fmt(stats.totalRevenue),         sub: `${fmt(stats.revenueThisMonth)} this month`, icon: DollarSign,  color: '#10b981' },
    { label: 'Total Orders',     value: stats.totalOrders.toString(),    sub: `${stats.statusBreakdown.PAID ?? 0} paid`,   icon: ShoppingBag, color: '#6c47ff' },
    { label: 'Customers',        value: stats.totalCustomers.toString(), sub: 'all time',                                  icon: Users,       color: '#f59e0b' },
    { label: 'Avg. Order Value', value: fmt(stats.avgOrderValue),        sub: 'per paid order',                            icon: TrendingUp,  color: '#3b82f6' },
  ]

  return (
    <div className="min-h-full bg-(--admin-page)">
      {/* Header */}
      <PageHeader
        storeId={store.id}
        icon={<BarChart2 size={20} strokeWidth={1.75} />}
        title="Analytics"
        meta="Last 30 days"
      />

      <div className="max-w-6xl px-6 pb-10 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <div key={card.label} className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{card.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}15` }}>
                  <card.icon size={14} style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{card.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Main chart */}
        <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-zinc-800 dark:text-zinc-100">{activeChart === 'revenue' ? 'Revenue' : 'New Customers'}</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Daily breakdown · last 30 days</p>
            </div>
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg gap-1">
              {(['revenue', 'customers'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveChart(tab)} className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all"
                  style={{ backgroundColor: activeChart === tab ? 'var(--admin-bg)' : 'transparent', color: activeChart === tab ? 'var(--admin-text)' : 'var(--admin-text-3)', boxShadow: activeChart === tab ? 'var(--admin-shadow)' : 'none' }}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-2">
            <LineChart data={activeChart === 'revenue' ? revenueChart : customerChart} valueKey={activeChart === 'revenue' ? 'revenue' : 'count'} color={activeChart === 'revenue' ? '#10b981' : '#6c47ff'} height={140} />
          </div>
          <div className="flex justify-between mt-2">
            {revenueChart.filter((_, i) => i % 5 === 0 || i === revenueChart.length - 1).map(d => (
              <span key={d.date} className="text-[10px] text-zinc-500">{fmtDate(d.date)}</span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order status */}
          <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-6">
            <h2 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-1">Order Status</h2>
            <p className="text-xs text-zinc-500 mb-5">Breakdown of all orders</p>
            <div className="space-y-3">
              {Object.entries(stats.statusBreakdown).map(([status, count]) => {
                const total = stats.totalOrders || 1; const pct = Math.round((count / total) * 100)
                const colors: Record<string, string> = { PAID: '#10b981', PENDING: '#f59e0b', CANCELLED: '#ef4444', REFUNDED: '#8b5cf6' }
                const color = colors[status] ?? '#d1d5db'
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold capitalize text-zinc-600 dark:text-zinc-300">{status.charAt(0) + status.slice(1).toLowerCase()}</span>
                      <span className="text-xs text-zinc-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                )
              })}
              {stats.totalOrders === 0 && <p className="text-sm text-zinc-500 text-center py-4">No orders yet</p>}
            </div>
          </div>

          {/* Top products */}
          <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-6">
            <h2 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-1">Top Products</h2>
            <p className="text-xs text-zinc-500 mb-5">By units sold</p>
            {topProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package size={28} className="mx-auto text-zinc-200 dark:text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-500">No sales yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => {
                  const maxUnits = topProducts[0]?.unitsSold || 1; const pct = Math.round((p.unitsSold / maxUnits) * 100)
                  return (
                    <div key={p.id}>
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 w-4 shrink-0">#{i + 1}</span>
                          <Link href={`/dashboard/stores/${store.id}/products/${p.id}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors truncate">{p.title}</Link>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{p.unitsSold} sold</span>
                          <span className="text-[10px] text-zinc-500 ml-1">· {fmt(p.revenue)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-zinc-800 dark:bg-zinc-300 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Daily revenue bars */}
        <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-6">
          <h2 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-1">Daily Revenue Bars</h2>
          <p className="text-xs text-zinc-500 mb-5">Each bar = one day</p>
          <BarChart data={revenueChart} valueKey="revenue" color="#10b981" />
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-zinc-500">{fmtDate(revenueChart[0]?.date ?? '')}</span>
            <span className="text-[10px] text-zinc-500">{fmtDate(revenueChart[revenueChart.length - 1]?.date ?? '')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
