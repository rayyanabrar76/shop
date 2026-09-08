import { prisma } from '@/lib/prisma'
import { PageTitle, Panel, Empty, Avatar, Pill, Row, ago } from '../ui'
import { ArrowRight } from 'lucide-react'

export const metadata = { title: 'Users · ShopFlow admin' }
export const dynamic = 'force-dynamic'

/**
 * Everyone who has ever signed in to ShopFlow, newest first.
 *
 * The row shows what the account actually amounts to — how many shops, how
 * many products across them, whether anything has ever sold — because "signed
 * up" on its own does not distinguish a real merchant from someone who looked
 * once and left.
 */
export default async function PlatformUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, createdAt: true,
      stores: {
        select: {
          id: true, name: true, plan: true,
          _count: { select: { products: true, orders: true } },
        },
      },
    },
  })

  const active = users.filter(u => u.stores.some(s => s._count.orders > 0)).length
  const withStore = users.filter(u => u.stores.length > 0).length

  return (
    <div className="max-w-6xl px-3.5 md:px-6 pt-4 md:pt-6 pb-10">
      <PageTitle
        title="Accounts"
        meta={`${users.length} signed up · ${withStore} built a store · ${active} have taken an order`}
      />

      <Panel title="All accounts" meta={`${users.length}`}>
        {users.length === 0 ? (
          <Empty title="Nobody has signed up yet" />
        ) : (
          <ul className="divide-y divide-(--admin-edge)">
            {users.map(u => {
              const products = u.stores.reduce((n, s) => n + s._count.products, 0)
              const orders = u.stores.reduce((n, s) => n + s._count.orders, 0)
              const paying = u.stores.some(s => s.plan !== 'FREE')
              return (
                <Row key={u.id} href={`/admin/users/${u.id}`}>
                  <Avatar name={u.email} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-50 truncate">{u.email}</span>
                      {paying && <Pill tone="violet">Paid</Pill>}
                    </span>
                    <span className="block text-[10.5px] text-zinc-500 truncate">
                      joined {ago(u.createdAt)}
                      {u.stores.length > 0 && ` · ${u.stores.map(s => s.name).join(', ')}`}
                    </span>
                  </span>

                  {/* The shape of the account in three numbers, on a desk. On a
                      phone the row is already the name and when they arrived. */}
                  <span className="hidden sm:flex shrink-0 items-center gap-3 text-[10.5px] tabular-nums text-zinc-500">
                    <span>{u.stores.length} <span className="text-zinc-400">shops</span></span>
                    <span>{products} <span className="text-zinc-400">products</span></span>
                    <span className={orders > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
                      {orders} <span className="text-zinc-400 font-normal">orders</span>
                    </span>
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
