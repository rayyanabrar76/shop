import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/currency'
import { storeUrl } from '@/lib/config'
import { PageTitle, Figure, Figures, Panel, Empty, Avatar, Pill, Row, ago } from '../../ui'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

/**
 * One account, and everything it has built.
 *
 * Read-only on purpose. A back office that can edit a merchant's shop is a
 * back office that can break one by accident, and nothing here needs writing:
 * the question this page answers is "who is this and what do they have".
 */
export default async function PlatformUser({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, clerkId: true, createdAt: true, adminTheme: true,
      stores: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, subdomain: true, customDomain: true, currency: true,
          plan: true, createdAt: true, subscriptionStatus: true,
          theme: { select: { faviconUrl: true } },
          _count: { select: { products: true, orders: true, customers: true, categories: true } },
        },
      },
    },
  })
  if (!user) notFound()

  const storeIds = user.stores.map(s => s.id)
  const [paid, recentOrders] = await Promise.all([
    storeIds.length
      ? prisma.order.groupBy({
          by: ['storeId'],
          where: { storeId: { in: storeIds }, status: 'PAID' },
          _sum: { total: true },
        })
      : Promise.resolve([]),
    storeIds.length
      ? prisma.order.findMany({
          where: { storeId: { in: storeIds } },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true, total: true, status: true, createdAt: true,
            customerName: true, customerEmail: true,
            store: { select: { id: true, name: true, currency: true } },
          },
        })
      : Promise.resolve([]),
  ])
  const revenueOf = new Map(paid.map(p => [p.storeId, p._sum.total ?? 0]))

  const products = user.stores.reduce((n, s) => n + s._count.products, 0)
  const orders = user.stores.reduce((n, s) => n + s._count.orders, 0)
  const customers = user.stores.reduce((n, s) => n + s._count.customers, 0)

  return (
    <div className="max-w-6xl px-3.5 md:px-6 pt-4 md:pt-6 pb-10">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 mb-3 text-[11.5px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Accounts
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <Avatar name={user.email} size={40} />
        <div className="min-w-0 flex-1">
          <PageTitle
            title={user.email}
            meta={`Joined ${user.createdAt.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} · ${ago(user.createdAt)}`}
          />
        </div>
      </div>

      <Figures>
        <Figure label="Stores" value={user.stores.length} />
        <Figure label="Products" value={products} />
        <Figure label="Orders" value={orders} />
        <Figure label="Their customers" value={customers} />
      </Figures>

      <div className="space-y-2.5 md:space-y-3">
        <Panel title="Stores" meta={`${user.stores.length}`}>
          {user.stores.length === 0 ? (
            <Empty title="No stores" note="This account signed up but never created a shop." />
          ) : (
            <ul className="divide-y divide-(--admin-edge)">
              {user.stores.map(s => (
                <Row key={s.id} href={`/admin/stores/${s.id}`}>
                  <Avatar src={s.theme?.faviconUrl || null} name={s.name} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-50 truncate">{s.name}</span>
                      {s.plan !== 'FREE' && <Pill tone="violet">{s.plan}</Pill>}
                    </span>
                    <span className="block text-[10.5px] text-zinc-500 truncate">
                      {s.customDomain ?? storeUrl(s.subdomain).replace(/^https?:\/\//, '')} · created {ago(s.createdAt)}
                    </span>
                  </span>
                  <span className="hidden sm:flex shrink-0 items-center gap-3 text-[10.5px] tabular-nums text-zinc-500">
                    <span>{s._count.products} <span className="text-zinc-400">products</span></span>
                    <span>{s._count.orders} <span className="text-zinc-400">orders</span></span>
                    <span className={(revenueOf.get(s.id) ?? 0) > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
                      {formatPrice(revenueOf.get(s.id) ?? 0, s.currency)}
                    </span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-zinc-300 dark:text-zinc-600 -translate-x-1 opacity-60 group-hover:translate-x-0 group-hover:opacity-100 transition-[opacity,transform]" />
                </Row>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent orders across their stores" meta={orders > 10 ? `latest 10 of ${orders}` : `${orders}`}>
          {recentOrders.length === 0 ? (
            <Empty title="No orders yet" />
          ) : (
            <ul className="divide-y divide-(--admin-edge)">
              {recentOrders.map(o => (
                <Row key={o.id} href={`/admin/stores/${o.store.id}`}>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                      {o.customerName ?? o.customerEmail ?? 'Guest'}
                    </span>
                    <span className="block text-[10.5px] text-zinc-500 truncate">
                      {o.store.name} · {ago(o.createdAt)}
                    </span>
                  </span>
                  <Pill tone={o.status === 'PAID' ? 'green' : o.status === 'PENDING' ? 'amber' : 'zinc'}>
                    {o.status.charAt(0) + o.status.slice(1).toLowerCase()}
                  </Pill>
                  <span className="shrink-0 text-[12px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {formatPrice(o.total, o.store.currency)}
                  </span>
                </Row>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Account">
          <dl className="divide-y divide-(--admin-edge)">
            <Field label="Email" value={user.email} />
            <Field label="Clerk ID" value={user.clerkId} mono />
            <Field label="Database ID" value={user.id} mono />
            <Field label="Admin theme" value={user.adminTheme} />
            <Field label="Signed up" value={user.createdAt.toLocaleString()} />
          </dl>
        </Panel>
      </div>
    </div>
  )
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 px-3 sm:px-3.5 py-2">
      <dt className="w-28 shrink-0 text-[10.5px] font-semibold uppercase tracking-widest text-zinc-500">{label}</dt>
      <dd className={`min-w-0 flex-1 truncate text-[11.5px] text-zinc-800 dark:text-zinc-100 ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value}
      </dd>
    </div>
  )
}
