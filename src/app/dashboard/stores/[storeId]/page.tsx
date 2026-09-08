import Link from 'next/link'
import { storeUrl } from '@/lib/config'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/currency'
import {
  Eye, ArrowUpRight, ArrowRight, Check, Package, ShoppingCart,
  Paintbrush, Star, CreditCard, Globe, Share2, AlertTriangle,
  TrendingUp, Sparkles, Inbox,
} from 'lucide-react'

export const metadata = { title: 'Home' }

/** The last 30 days, which is what "this month" means on a dashboard. */
const WINDOW_DAYS = 30
const DAY = 24 * 60 * 60 * 1000

/** The window and the one before it, from a single reading of the clock. */
function windowBounds() {
  const now = Date.now()
  return {
    since: new Date(now - WINDOW_DAYS * DAY),
    previous: new Date(now - 2 * WINDOW_DAYS * DAY),
  }
}

export default async function StoreDashboardPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({
    where: { id: storeId, owner: { clerkId } },
    include: {
      _count: { select: { products: true, orders: true, categories: true } },
      payment: true,
    },
  })
  if (!store) return <div className="p-10 text-zinc-900 dark:text-zinc-50">Store not found</div>

  // Taken once, outside the component body: Date.now() during render is a
  // fresh value on every pass, which the compiler treats as impure and which
  // would let the two windows drift apart mid-render.
  const { since, previous } = windowBounds()

  // Everything the page needs, in one round trip. Each of these was a number
  // the old page either invented ("Active Theme: Modern") or did not show.
  const [
    paidNow, paidBefore, pendingOrders, pendingReviews,
    outOfStock, lowStock, draftProducts, recentOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { storeId, status: 'PAID', createdAt: { gte: since } },
      _sum: { total: true }, _count: true,
    }),
    prisma.order.aggregate({
      where: { storeId, status: 'PAID', createdAt: { gte: previous, lt: since } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { storeId, status: 'PENDING' } }),
    prisma.productReview.count({ where: { storeId, status: 'PENDING' } }),
    prisma.product.count({ where: { storeId, inventory: { lte: 0 } } }),
    prisma.product.count({ where: { storeId, inventory: { gt: 0, lte: 5 } } }),
    prisma.product.count({ where: { storeId, status: { not: 'active' } } }),
    prisma.order.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, total: true, status: true, customerName: true, customerEmail: true, createdAt: true },
    }),
  ])

  const revenue = paidNow._sum.total ?? 0
  const revenueBefore = paidBefore._sum.total ?? 0
  // Only claim a trend when there is something to compare against. "+100%"
  // against a month with no sales is noise dressed as a result.
  const trend = revenueBefore > 0 ? Math.round(((revenue - revenueBefore) / revenueBefore) * 100) : null
  const at = (p: string) => `/dashboard/stores/${storeId}${p}`

  const setup = [
    { id: 'product',  label: 'Add your first product',  hint: 'Nothing to sell until there is one', done: store._count.products > 0,        href: at('/products'), icon: Package },
    { id: 'theme',    label: 'Customise your storefront', hint: 'Colours, logo, sections',           done: store._count.categories > 0,      href: at('/theme'),    icon: Paintbrush },
    { id: 'payment',  label: 'Connect Stripe',           hint: 'Take card payments',                 done: !!store.payment?.stripeEnabled,   href: at('/settings/payments'), icon: CreditCard },
    { id: 'domain',   label: 'Connect a domain',         hint: 'Optional, but it looks the part',    done: !!store.customDomain,             href: at('/settings/domain'), icon: Globe },
    { id: 'launch',   label: 'Share your store link',    hint: 'The first order comes from someone you told', done: store._count.orders > 0, href: storeUrl(store.subdomain), icon: Share2 },
  ]
  const doneCount = setup.filter(s => s.done).length
  const showSetup = doneCount < setup.length

  // Only what actually wants doing. An empty list is the good outcome and is
  // shown as such rather than as a heading with nothing under it.
  const attention = [
    pendingOrders > 0 && { key: 'orders', label: `${pendingOrders} order${pendingOrders === 1 ? '' : 's'} awaiting payment`, href: at('/orders'), icon: ShoppingCart, tone: 'amber' as const },
    pendingReviews > 0 && { key: 'reviews', label: `${pendingReviews} review${pendingReviews === 1 ? '' : 's'} to approve`, href: at('/reviews'), icon: Star, tone: 'amber' as const },
    outOfStock > 0 && { key: 'oos', label: `${outOfStock} product${outOfStock === 1 ? '' : 's'} out of stock`, href: at('/products'), icon: AlertTriangle, tone: 'red' as const },
    lowStock > 0 && { key: 'low', label: `${lowStock} product${lowStock === 1 ? '' : 's'} low on stock`, href: at('/products'), icon: Package, tone: 'amber' as const },
    draftProducts > 0 && { key: 'draft', label: `${draftProducts} product${draftProducts === 1 ? '' : 's'} still a draft`, href: at('/products'), icon: Package, tone: 'zinc' as const },
  ].filter(Boolean) as { key: string; label: string; href: string; icon: typeof Package; tone: 'amber' | 'red' | 'zinc' }[]

  return (
    <div className="max-w-6xl px-3.5 md:px-6 pt-4 md:pt-7 pb-10">
      {/* ── Who and where ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          {/* The shop's name set as a wordmark rather than a page heading:
              a serif at a heavier weight, which reads as a name on a sign
              instead of the title of a settings screen. The system serif, so
              nothing extra is loaded for one line of text. */}
          <h1 className="font-serif text-[18px] md:text-[28px] font-semibold tracking-[-0.015em] text-zinc-900 dark:text-zinc-50 truncate">
            {store.name}
          </h1>
          <a
            href={storeUrl(store.subdomain, '?customerView=1')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 mt-0.5 text-[11px] sm:text-[12.5px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping [animation-duration:2.4s]" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            {storeUrl(store.subdomain).replace(/^https?:\/\//, '')}
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        {/* Hidden on a phone: the admin header already carries an eye for
            this, and the address under the name is a link to the same place. */}
        <Link
          href={storeUrl(store.subdomain, '?owner=1')}
          target="_blank"
          className="hidden sm:flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-(--admin-border) bg-(--admin-card) px-3 text-[12px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-(--admin-field-border) transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          View storefront
        </Link>
      </div>

      {/* ── The numbers ───────────────────────────────────────────────────
          Revenue leads because it is the one number a shop is actually run
          on. The rest are counts, and each is a link to the thing it counts. */}
      <section className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-0.5 mb-2.5 *:snap-start *:shrink-0 *:w-[44%] sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-3 sm:mb-3 sm:overflow-visible sm:*:w-auto">
        <div className="rounded-xl sm:rounded-2xl border border-(--admin-border) bg-(--admin-card) px-2.5 py-2 sm:px-3 sm:py-2 sm:col-span-2 lg:col-span-1">
          <p className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Revenue · {WINDOW_DAYS} days
          </p>
          <p className="mt-0.5 text-[14px] sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
            {formatPrice(revenue, store.currency)}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-500">
            {trend !== null && (
              <span className={`inline-flex items-center gap-0.5 font-semibold ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            )}
            {paidNow._count} paid order{paidNow._count === 1 ? '' : 's'}
          </p>
        </div>

        <StatTile href={at('/orders')}   icon={ShoppingCart} label="Orders"   value={store._count.orders} note={pendingOrders > 0 ? `${pendingOrders} pending` : 'all settled'} />
        <StatTile href={at('/products')} icon={Package}      label="Products" value={store._count.products} note={outOfStock > 0 ? `${outOfStock} out of stock` : 'all in stock'} warn={outOfStock > 0} />
        <StatTile href={at('/reviews')}  icon={Star}         label="Reviews"  value={pendingReviews} note={pendingReviews > 0 ? 'waiting on you' : 'nothing waiting'} warn={pendingReviews > 0} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 lg:gap-3 items-start">
        {/* ── The left column: what to do, then what happened ──────────── */}
        <div className="lg:col-span-2 space-y-2.5 lg:space-y-3">
          {showSetup && (
            <section className="rounded-xl sm:rounded-2xl border border-(--admin-border) bg-(--admin-card) overflow-hidden">
              <div className="flex items-center gap-3 px-3 sm:px-3.5 pt-2.5 pb-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[12px] font-bold text-zinc-900 dark:text-zinc-50">Get your store ready</h2>
                  <p className="text-[10.5px] text-zinc-500 mt-0.5">{doneCount} of {setup.length} done</p>
                </div>
                {/* A ring rather than a bar: it sits beside the heading
                    instead of taking a row of its own. */}
                <div className="relative h-6.5 w-6.5 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-6.5 w-6.5 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3.5" className="stroke-zinc-100 dark:stroke-zinc-800" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none" strokeWidth="3.5" strokeLinecap="round"
                      className="stroke-emerald-500"
                      strokeDasharray={`${(doneCount / setup.length) * 97.4} 97.4`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-zinc-600 dark:text-zinc-300 tabular-nums">
                    {Math.round((doneCount / setup.length) * 100)}
                  </span>
                </div>
              </div>
              <ul className="pb-2">
                {setup.map(step => {
                  const Icon = step.icon
                  return (
                    <li key={step.id}>
                      <Link
                        href={step.href}
                        {...(step.id === 'launch' ? { target: '_blank' } : {})}
                        className="group flex items-center gap-3 mx-1 px-2 py-1.5 sm:py-2 rounded-lg hover:bg-(--admin-bg-muted) transition-colors"
                      >
                        <span className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full transition-colors ${
                          step.done
                            ? 'bg-emerald-500 text-white'
                            : 'bg-(--admin-bg-muted) text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-100'
                        }`}>
                          {step.done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <Icon className="w-3.5 h-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[11.5px] sm:text-[12px] font-semibold truncate ${step.done ? 'text-zinc-400 dark:text-zinc-500 line-through' : 'text-zinc-900 dark:text-zinc-50'}`}>
                            {step.label}
                          </span>
                          {!step.done && <span className="block text-[10px] sm:text-[10.5px] text-zinc-500 truncate">{step.hint}</span>}
                        </span>
                        {!step.done && (
                          <ArrowRight className="w-4 h-4 shrink-0 text-zinc-300 dark:text-zinc-600 -translate-x-1 opacity-60 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-zinc-500 transition-[opacity,transform,color]" />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* ── Recent orders ─────────────────────────────────────────── */}
          <section className="rounded-xl sm:rounded-2xl border border-(--admin-border) bg-(--admin-card) overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-3 sm:px-3.5 py-2 border-b border-(--admin-edge) bg-zinc-50/60 dark:bg-zinc-800/60">
              <h2 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-zinc-500">Recent orders</h2>
              {recentOrders.length > 0 && (
                <Link href={at('/orders')} className="flex items-center gap-1 text-[11.5px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                  All orders <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-7 sm:py-8 text-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--admin-bg-muted) text-zinc-400">
                  <Inbox className="w-4 h-4" />
                </span>
                <p className="mt-2.5 text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">No orders yet</p>
                <p className="mt-0.5 text-[11px] text-zinc-500 max-w-[16rem]">
                  They will appear here the moment someone buys. Sharing your store link is usually what starts it.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-(--admin-edge)">
                {recentOrders.map(o => (
                  <li key={o.id}>
                    <Link href={at(`/orders`)} className="group flex items-center gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 hover:bg-(--admin-bg-muted) transition-colors">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--admin-bg-muted) text-[9.5px] sm:text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase">
                        {(o.customerName ?? o.customerEmail ?? '?').slice(0, 2)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] sm:text-[12px] font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                          {o.customerName ?? o.customerEmail ?? 'Guest'}
                        </span>
                        <span className="block text-[11px] text-zinc-500">
                          {o.createdAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </span>
                      </span>
                      <OrderBadge status={o.status} />
                      <span className="shrink-0 text-[11.5px] sm:text-[12px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                        {formatPrice(o.total, store.currency)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ── The right column: what wants doing, and the ways in ──────── */}
        <div className="space-y-2.5 lg:space-y-3">
          <section className="rounded-xl sm:rounded-2xl border border-(--admin-border) bg-(--admin-card) overflow-hidden">
            <div className="px-3 sm:px-3.5 py-2 flex items-center border-b border-(--admin-edge) bg-zinc-50/60 dark:bg-zinc-800/60">
              <h2 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-zinc-500">Needs attention</h2>
            </div>
            {attention.length === 0 ? (
              <div className="flex items-center gap-3 px-3 sm:px-3.5 py-2.5">
                <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                </span>
                <p className="text-[11.5px] text-zinc-500">Nothing waiting. All caught up.</p>
              </div>
            ) : (
              <ul className="py-1.5">
                {attention.map(a => {
                  const Icon = a.icon
                  const tone =
                    a.tone === 'red' ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                    : a.tone === 'amber' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                    : 'bg-(--admin-bg-muted) text-zinc-500'
                  return (
                    <li key={a.key}>
                      <Link href={a.href} className="group flex items-center gap-3 mx-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl hover:bg-(--admin-bg-muted) transition-colors">
                        <span className={`flex h-5.5 w-5.5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full ${tone}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 text-[11px] sm:text-[12px] font-medium text-zinc-800 dark:text-zinc-100">{a.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 text-zinc-300 dark:text-zinc-600 -translate-x-1 opacity-60 group-hover:translate-x-0 group-hover:opacity-100 transition-[opacity,transform]" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl sm:rounded-2xl border border-(--admin-border) bg-(--admin-card) overflow-hidden">
            <div className="px-3 sm:px-3.5 py-2 flex items-center border-b border-(--admin-edge) bg-zinc-50/60 dark:bg-zinc-800/60">
              <h2 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-zinc-500">Jump to</h2>
            </div>
            <ul className="py-1.5">
              {[
                { href: at('/products'), icon: Package, label: 'Products', note: `${store._count.products}` },
                { href: at('/orders'), icon: ShoppingCart, label: 'Orders', note: `${store._count.orders}` },
                { href: at('/theme'), icon: Paintbrush, label: 'Customization', note: 'Storefront' },
                { href: at('/discounts'), icon: Sparkles, label: 'Discounts & shipping', note: '' },
                { href: at('/settings'), icon: CreditCard, label: 'Settings', note: '' },
              ].map(l => {
                const Icon = l.icon
                return (
                  <li key={l.href}>
                    <Link href={l.href} className="group flex items-center gap-3 mx-1 px-2 py-1 rounded-lg hover:bg-(--admin-bg-muted) transition-colors">
                      <Icon className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
                      <span className="min-w-0 flex-1 text-[11px] sm:text-[12px] font-medium text-zinc-800 dark:text-zinc-100 truncate">{l.label}</span>
                      {l.note && <span className="shrink-0 text-[11.5px] tabular-nums text-zinc-400">{l.note}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

function StatTile({
  href, icon: Icon, label, value, note, warn = false,
}: {
  href: string; icon: typeof Package; label: string; value: number; note: string; warn?: boolean
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl sm:rounded-2xl border border-(--admin-border) bg-(--admin-card) px-2.5 py-2 sm:px-3 sm:py-2 hover:border-(--admin-field-border) transition-colors"
    >
      <p className="flex items-center gap-1 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className="mt-0.5 text-[14px] sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
        {value}
      </p>
      <p className={`mt-0.5 text-[10px] truncate ${warn ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500'}`}>
        {note}
      </p>
    </Link>
  )
}

function OrderBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    PENDING: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    CANCELLED: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
    REFUNDED: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
  }
  return (
    <span className={`hidden sm:inline-flex shrink-0 items-center h-5 px-2 rounded-full text-[10.5px] font-semibold ${map[status] ?? map.CANCELLED}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}
