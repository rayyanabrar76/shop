'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, MapPin, Mail, Phone, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useDashboardPrice } from '@/components/CurrencyProvider'

interface Item {
  id: string
  title: string
  imageUrl: string | null
  quantity: number
  price: number
  variantLabel: string | null
}

interface Order {
  id: string
  createdAt: string
  status: string
  paymentMethod: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  customerAddress: string | null
  customerCity: string | null
  customerCountry: string | null
  notes: string | null
  discountCode: string | null
  discountAmount: number
  shippingAmount: number
  shippingMethod: string | null
  taxAmount: number
  total: number
  items: Item[]
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  PAID:      { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle2 },
  PENDING:   { bg: 'bg-amber-50 dark:bg-amber-950/30',     text: 'text-amber-700 dark:text-amber-400',     icon: Clock },
  CANCELLED: { bg: 'bg-zinc-100 dark:bg-zinc-800',         text: 'text-zinc-600 dark:text-zinc-400',       icon: XCircle },
  REFUNDED:  { bg: 'bg-violet-50 dark:bg-violet-950/30',   text: 'text-violet-700 dark:text-violet-400',   icon: XCircle },
}

export default function OrderDetailClient({ order, storeId }: { order: Order; storeId: string }) {
  const fmtMoney = useDashboardPrice()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const StatusBadge = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING
  const StatusIcon = StatusBadge.icon

  async function markPaid() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/orders/${order.id}/mark-paid`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed')
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Order #{order.id.slice(-8).toUpperCase()}
            </h1>
            <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 h-[22px] rounded-full text-[11px] font-medium ${StatusBadge.bg} ${StatusBadge.text}`}>
              <StatusIcon className="w-3 h-3" />
              {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
            </span>
          </div>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
            {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            {' · '}
            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card payment'}
          </p>
        </div>

        {order.status === 'PENDING' && order.paymentMethod === 'cod' && (
          <button
            onClick={markPaid}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {busy ? 'Updating…' : 'Mark as paid'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Items */}
        <div className="md:col-span-2 rounded-2xl border border-(--admin-border) bg-(--admin-card)">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 px-5 py-4 border-b border-(--admin-edge)">
            Items
          </h2>
          <ul className="divide-y divide-(--admin-edge)">
            {order.items.map(item => (
              <li key={item.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">{item.title}</p>
                  <p className="text-xs text-zinc-500">
                    {item.variantLabel ? `${item.variantLabel} · ` : ''}
                    {fmtMoney(item.price)} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {fmtMoney(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <div className="px-5 py-4 border-t border-(--admin-edge) space-y-1.5 text-sm">
            <Row label="Subtotal" value={fmtMoney(subtotal)} />
            {order.discountAmount > 0 && (
              <Row label={`Discount${order.discountCode ? ` (${order.discountCode})` : ''}`} value={`-${fmtMoney(order.discountAmount)}`} accent="emerald" />
            )}
            {order.shippingAmount > 0 && (
              <Row label={`Shipping${order.shippingMethod ? ` (${order.shippingMethod})` : ''}`} value={fmtMoney(order.shippingAmount)} />
            )}
            {order.taxAmount > 0 && <Row label="Tax" value={fmtMoney(order.taxAmount)} />}
            <Row label="Total" value={fmtMoney(order.total)} bold />
          </div>
        </div>

        {/* Customer */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-(--admin-border) bg-(--admin-card) p-5">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-3">Customer</h2>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{order.customerName ?? '-'}</p>
            {order.customerEmail && (
              <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> {order.customerEmail}
              </p>
            )}
            {order.customerPhone && (
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> {order.customerPhone}
              </p>
            )}
          </div>

          {(order.customerAddress || order.customerCity) && (
            <div className="rounded-2xl border border-(--admin-border) bg-(--admin-card) p-5">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Shipping to
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {order.customerAddress}<br />
                {order.customerCity}{order.customerCountry ? `, ${order.customerCountry}` : ''}
              </p>
            </div>
          )}

          {order.notes && (
            <div className="rounded-2xl border border-(--admin-border) bg-(--admin-card) p-5">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-2">Notes</h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: 'emerald' }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-zinc-500 ${bold ? 'font-bold text-zinc-900 dark:text-zinc-50' : ''}`}>{label}</span>
      <span className={`${bold ? 'font-bold text-zinc-900 dark:text-zinc-50 text-base' : 'text-zinc-700 dark:text-zinc-300'} ${accent === 'emerald' ? 'text-emerald-600' : ''}`}>
        {value}
      </span>
    </div>
  )
}
