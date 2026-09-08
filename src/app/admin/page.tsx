import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/currency'
import { PageTitle, Figure, Figures, Panel, Empty, Avatar, Pill, Row, ago } from './ui'
import { ArrowRight, Store, Users } from 'lucide-react'

export const metadata = { title: 'Overview · ShopFlow admin' }
/** Live numbers, never a cached page: this is a back office, not a shop front. */
export const dynamic = 'force-dynamic'

const DAY = 24 * 60 * 60 * 1000

/** Both windows from one reading of the clock, outside the component: a
 *  Date.now() during render is a fresh value on every pass. */
function windows() {
  const now = Date.now()
  return { week: new Date(now - 7 * DAY), month: new Date(now - 30 * DAY) }
}

export default async function PlatformOverview() {
  const { week, month } = windows()

  const [
    users, stores, products, orders, paid, newUsers, newStores,
    recentUsers, recentStores, byCurrency,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.store.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { total: true }, _count: true }),
    prisma.user.count({ where: { createdAt: { gte: week } } }),
    prisma.store.count({ where: { createdAt: { gte: week } } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, email: true, createdAt: true, _count: { select: { stores: true } } },
    }),
    prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true, name: true, subdomain: true, currency: true, plan: true, createdAt: true,
        owner: { select: { email: true } },
        _count: { select: { products: true, orders: true } },
        theme: { select: { faviconUrl: true } },
      },
    }),
    // Revenue is stored per shop in that shop's own currency, so a single
    // total would be adding rupees to dollars. Grouped instead, and shown as
    // separate figures.
    prisma.store.groupBy({ by: ['currency'], _count: true }),
  ])

  const gmv = paid._sum.total ?? 0
  const mainCurrency = byCurrency.sort((a, b) => b._count - a._count)[0]?.currency ?? 'USD'

  return (
    <div className="max-w-6xl px-3.5 md:px-6 pt-4 md:pt-6 pb-10">
      <PageTitle
        title="Overview"
        meta={`Everything on this instance · ${month.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} onward`}
      />

      <Figures>
        <Figure label="Accounts" value={users} note={newUsers > 0 ? `+${newUsers} this week` : 'none this week'} />
        <Figure label="Stores" value={stores} note={newStores > 0 ? `+${newStores} this week` : 'none this week'} />
        <Figure label="Products" value={products} note={`${orders} order${orders === 1 ? '' : 's'}`} />
        <Figure
          label="Paid volume"
          value={formatPrice(gmv, mainCurrency)}
          note={`${paid._count} paid · mixed currencies`}
        />
      </Figures>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-3 items-start">
        <Panel title="Newest accounts" meta={`${users} total`}>
          {recentUsers.length === 0 ? (
            <Empty title="Nobody has signed up yet" />
          ) : (
            <ul className="divide-y divide-(--admin-edge)">
              {recentUsers.map(u => (
                <Row key={u.id} href={`/admin/users/${u.id}`}>
                  <Avatar name={u.email} size={26} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold text-zinc-900 dark:text-zinc-50 truncate">{u.email}</span>
                    <span className="block text-[10.5px] text-zinc-500">
                      joined {ago(u.createdAt)}
                    </span>
                  </span>
                  <Pill tone={u._count.stores > 0 ? 'green' : 'zinc'}>
                    {u._count.stores} {u._count.stores === 1 ? 'store' : 'stores'}
                  </Pill>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-zinc-300 dark:text-zinc-600 -translate-x-1 opacity-60 group-hover:translate-x-0 group-hover:opacity-100 transition-[opacity,transform]" />
                </Row>
              ))}
            </ul>
          )}
          <FooterLink href="/admin/users" label="All accounts" icon={<Users className="w-3 h-3" />} />
        </Panel>

        <Panel title="Newest stores" meta={`${stores} total`}>
          {recentStores.length === 0 ? (
            <Empty title="No stores yet" />
          ) : (
            <ul className="divide-y divide-(--admin-edge)">
              {recentStores.map(s => (
                <Row key={s.id} href={`/admin/stores/${s.id}`}>
                  <Avatar src={s.theme?.faviconUrl || null} name={s.name} size={26} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold text-zinc-900 dark:text-zinc-50 truncate">{s.name}</span>
                    <span className="block text-[10.5px] text-zinc-500 truncate">{s.owner.email}</span>
                  </span>
                  <span className="hidden sm:block shrink-0 text-[10.5px] text-zinc-500 tabular-nums">
                    {s._count.products}p · {s._count.orders}o
                  </span>
                  <Pill tone={s.plan === 'FREE' ? 'zinc' : 'violet'}>{s.plan}</Pill>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-zinc-300 dark:text-zinc-600 -translate-x-1 opacity-60 group-hover:translate-x-0 group-hover:opacity-100 transition-[opacity,transform]" />
                </Row>
              ))}
            </ul>
          )}
          <FooterLink href="/admin/stores" label="All stores" icon={<Store className="w-3 h-3" />} />
        </Panel>
      </div>
    </div>
  )
}

function FooterLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-1.5 px-3 py-2 border-t border-(--admin-edge) text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-(--admin-bg-muted) transition-colors"
    >
      {icon} {label}
    </Link>
  )
}
