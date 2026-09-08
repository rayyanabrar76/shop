import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/currency'
import { storeUrl } from '@/lib/config'
import { PageTitle, Panel, Empty, Avatar, Pill, Row, ago } from '../ui'
import { ArrowRight } from 'lucide-react'

export const metadata = { title: 'Stores · ShopFlow admin' }
export const dynamic = 'force-dynamic'

/**
 * Every shop on the instance, with what it has taken.
 *
 * Revenue is summed per shop rather than across them: each shop trades in its
 * own currency, so one grand total would be adding rupees to dollars.
 */
export default async function PlatformStores() {
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, subdomain: true, customDomain: true, currency: true,
      plan: true, createdAt: true,
      owner: { select: { email: true } },
      theme: { select: { faviconUrl: true } },
      _count: { select: { products: true, orders: true, customers: true } },
    },
  })

  // One aggregate for the paid totals, then matched back to each shop, rather
  // than a query per row.
  const paid = await prisma.order.groupBy({
    by: ['storeId'],
    where: { status: 'PAID' },
    _sum: { total: true },
  })
  const revenueOf = new Map(paid.map(p => [p.storeId, p._sum.total ?? 0]))

  const selling = stores.filter(s => s._count.orders > 0).length

  return (
    <div className="max-w-6xl px-3.5 md:px-6 pt-4 md:pt-6 pb-10">
      <PageTitle
        title="Stores"
        meta={`${stores.length} created · ${selling} have taken an order`}
      />

      <Panel title="All stores" meta={`${stores.length}`}>
        {stores.length === 0 ? (
          <Empty title="No stores yet" note="They appear here the moment someone creates one." />
        ) : (
          <ul className="divide-y divide-(--admin-edge)">
            {stores.map(s => {
              const revenue = revenueOf.get(s.id) ?? 0
              return (
                <Row key={s.id} href={`/admin/stores/${s.id}`}>
                  <Avatar src={s.theme?.faviconUrl || null} name={s.name} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-50 truncate">{s.name}</span>
                      {s.plan !== 'FREE' && <Pill tone="violet">{s.plan}</Pill>}
                      {s.customDomain && <Pill tone="green">Domain</Pill>}
                    </span>
                    <span className="block text-[10.5px] text-zinc-500 truncate">
                      {s.customDomain ?? storeUrl(s.subdomain).replace(/^https?:\/\//, '')}
                      {' · '}{s.owner.email}
                    </span>
                  </span>

                  <span className="hidden sm:flex shrink-0 items-center gap-3 text-[10.5px] tabular-nums text-zinc-500">
                    <span>{s._count.products} <span className="text-zinc-400">products</span></span>
                    <span>{s._count.customers} <span className="text-zinc-400">customers</span></span>
                    <span className={revenue > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
                      {formatPrice(revenue, s.currency)}
                    </span>
                  </span>

                  <span className="hidden lg:block shrink-0 text-[10.5px] text-zinc-400 w-16 text-right">
                    {ago(s.createdAt)}
                  </span>

                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-zinc-300 dark:text-zinc-600 -translate-x-1 opacity-60 group-hover:translate-x-0 group-hover:opacity-100 transition-[opacity,transform]" />
                </Row>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
