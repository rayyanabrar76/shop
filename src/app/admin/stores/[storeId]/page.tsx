import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/currency'
import { storeUrl } from '@/lib/config'
import { PageTitle, Figure, Figures, Panel, Empty, Avatar, Pill, Row, ago } from '../../ui'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

/**
 * One shop, in full: what it sells, who bought, and how it is set up.
 *
 * Read-only. Everything here has a merchant-facing screen that owns it; this
 * is for answering "what does this shop actually look like" without asking
 * the person who runs it.
 */
export default async function PlatformStore({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      id: true, name: true, subdomain: true, customDomain: true, domainVerified: true,
      currency: true, country: true, plan: true, createdAt: true,
      subscriptionStatus: true, trialEndsAt: true, currentPeriodEnd: true, storageUsed: true,
      owner: { select: { id: true, email: true, createdAt: true } },
      theme: { select: { faviconUrl: true, primaryColor: true } },
      payment: { select: { stripeEnabled: true, codEnabled: true, taxEnabled: true } },
      _count: {
        select: {
          products: true, orders: true, categories: true, customers: true,
          reviews: true, pages: true, discountCodes: true, subscribers: true,
        },
      },
    },
  })
  if (!store) notFound()

  const [paid, recentOrders, topProducts] = await Promise.all([
    prisma.order.aggregate({ where: { storeId, status: 'PAID' }, _sum: { total: true }, _count: true }),
    prisma.order.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, total: true, status: true, createdAt: true,
        customerName: true, customerEmail: true, paymentMethod: true,
      },
    }),
    prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, title: true, price: true, inventory: true, status: true, imageUrl: true },
    }),
  ])

  const revenue = paid._sum.total ?? 0
  const live = store.customDomain ?? storeUrl(store.subdomain).replace(/^https?:\/\//, '')

  return (
    <div className="max-w-6xl px-3.5 md:px-6 pt-4 md:pt-6 pb-10">
      <Link
        href="/admin/stores"
        className="inline-flex items-center gap-1.5 mb-3 text-[11.5px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Stores
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <Avatar src={store.theme?.faviconUrl || null} name={store.name} size={40} />
        <div className="min-w-0 flex-1">
          <PageTitle
            title={store.name}
            meta={`${live} · owned by ${store.owner.email} · created ${ago(store.createdAt)}`}
            action={
              <a
                href={storeUrl(store.subdomain, '?customerView=1')}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-(--admin-border) bg-(--admin-card) px-2.5 text-[11.5px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Visit</span>
              </a>
            }
          />
        </div>
      </div>

      <Figures>
        <Figure label="Paid revenue" value={formatPrice(revenue, store.currency)} note={`${paid._count} paid orders`} />
        <Figure label="Orders" value={store._count.orders} />
        <Figure label="Products" value={store._count.products} note={`${store._count.categories} categories`} />
        <Figure label="Customers" value={store._count.customers} note={`${store._count.subscribers} subscribers`} />
      </Figures>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-3 items-start">
        <div className="space-y-2.5 lg:space-y-3">
          <Panel title="Recent orders" meta={store._count.orders > 10 ? `latest 10 of ${store._count.orders}` : `${store._count.orders}`}>
            {recentOrders.length === 0 ? (
              <Empty title="No orders yet" />
            ) : (
              <ul className="divide-y divide-(--admin-edge)">
                {recentOrders.map(o => (
                  <li key={o.id} className="flex items-center gap-2.5 px-3 sm:px-3.5 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                        {o.customerName ?? o.customerEmail ?? 'Guest'}
                      </span>
                      <span className="block text-[10.5px] text-zinc-500 truncate">
                        {ago(o.createdAt)}{o.paymentMethod ? ` · ${o.paymentMethod}` : ''}
                      </span>
                    </span>
                    <Pill tone={o.status === 'PAID' ? 'green' : o.status === 'PENDING' ? 'amber' : 'zinc'}>
                      {o.status.charAt(0) + o.status.slice(1).toLowerCase()}
                    </Pill>
                    <span className="shrink-0 text-[12px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatPrice(o.total, store.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Products" meta={store._count.products > 8 ? `newest 8 of ${store._count.products}` : `${store._count.products}`}>
            {topProducts.length === 0 ? (
              <Empty title="No products" />
            ) : (
              <ul className="divide-y divide-(--admin-edge)">
                {topProducts.map(p => (
                  <li key={p.id} className="flex items-center gap-2.5 px-3 sm:px-3.5 py-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-(--admin-bg-muted)">
                      {p.imageUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                        : <span className="text-[9px] text-zinc-400">—</span>}
                    </span>
                    <span className="min-w-0 flex-1 text-[12px] font-medium text-zinc-800 dark:text-zinc-100 truncate">{p.title}</span>
                    {p.status !== 'active' && <Pill tone="amber">Draft</Pill>}
                    <span className={`shrink-0 text-[10.5px] tabular-nums ${p.inventory <= 0 ? 'text-red-500 font-semibold' : 'text-zinc-500'}`}>
                      {p.inventory} left
                    </span>
                    <span className="shrink-0 text-[12px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatPrice(p.price, store.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-2.5 lg:space-y-3">
          <Panel title="Setup">
            <dl className="divide-y divide-(--admin-edge)">
              <Field label="Plan" value={store.plan} />
              <Field label="Subscription" value={store.subscriptionStatus ?? 'none'} />
              <Field label="Currency" value={store.currency} />
              <Field label="Country" value={store.country || 'not set'} />
              <Field label="Domain" value={store.customDomain ? `${store.customDomain}${store.domainVerified ? ' (verified)' : ' (unverified)'}` : 'subdomain only'} />
              <Field label="Stripe" value={store.payment?.stripeEnabled ? 'enabled' : 'off'} />
              <Field label="Cash on delivery" value={store.payment?.codEnabled ? 'enabled' : 'off'} />
              <Field label="Tax" value={store.payment?.taxEnabled ? 'enabled' : 'off'} />
              <Field label="Storage used" value={`${(Number(store.storageUsed) / 1024 / 1024).toFixed(1)} MB`} />
            </dl>
          </Panel>

          <Panel title="Content">
            <dl className="divide-y divide-(--admin-edge)">
              <Field label="Categories" value={String(store._count.categories)} />
              <Field label="Pages" value={String(store._count.pages)} />
              <Field label="Reviews" value={String(store._count.reviews)} />
              <Field label="Discount codes" value={String(store._count.discountCodes)} />
              <Field label="Subscribers" value={String(store._count.subscribers)} />
            </dl>
          </Panel>

          <Panel title="Owner">
            <ul>
              <Row href={`/admin/users/${store.owner.id}`}>
                <Avatar name={store.owner.email} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-zinc-900 dark:text-zinc-50 truncate">{store.owner.email}</span>
                  <span className="block text-[10.5px] text-zinc-500">joined {ago(store.owner.createdAt)}</span>
                </span>
              </Row>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3 px-3 sm:px-3.5 py-1.5">
      <dt className="w-32 shrink-0 text-[10.5px] font-semibold uppercase tracking-widest text-zinc-500">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-[11.5px] text-zinc-800 dark:text-zinc-100">{value}</dd>
    </div>
  )
}
