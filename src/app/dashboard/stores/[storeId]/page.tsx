import Link from 'next/link'
import { storeUrl } from '@/lib/config'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Eye, Package, ShoppingCart, Palette, ArrowUpRight, Check, Circle } from 'lucide-react'

export default async function StoreDashboardPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } },
    include: {
      _count: { select: { products: true, orders: true } },
      payment: true,
    },
  })

  if (!store) return <div className="p-10 text-zinc-900 dark:text-zinc-50">Store not found</div>

  // Onboarding state
  const onboarding = [
    { id: 'product',  label: 'Add your first product',     done: store._count.products > 0,                     href: `/dashboard/stores/${storeId}/products` },
    { id: 'theme',    label: 'Customize your storefront',  done: false, /* hard to detect, surface it always */href: `/dashboard/stores/${storeId}/theme` },
    { id: 'payment',  label: 'Connect Stripe to take card payments', done: !!store.payment?.stripeEnabled,      href: `/dashboard/stores/${storeId}/settings/payments` },
    { id: 'domain',   label: 'Connect a custom domain (optional)',   done: !!store.customDomain,                href: `/dashboard/stores/${storeId}/settings/domain` },
    { id: 'launch',   label: 'Share your store link',                done: store._count.orders > 0,             href: storeUrl(store.subdomain) },
  ]
  const remaining = onboarding.filter(s => !s.done).length
  const showOnboarding = remaining > 0 && store._count.orders === 0

  return (
    <div className="p-4 pt-5 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-6 md:mb-8">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">{store.name}</h1>
          {/* The subtitle explains the page to someone seeing it for the first
              time and is dead weight on a phone, where the nav is a tap away. */}
          <p className="hidden md:block text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Manage your store inventory, orders, and appearance.
          </p>
        </div>
        <Link
          target="_blank"
          aria-label="View storefront"
          className="hidden shrink-0 items-center gap-2 rounded-xl bg-black dark:bg-white px-3 md:px-4 py-2.5 text-sm font-semibold text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-sm w-fit"
          href={storeUrl(store.subdomain, '?owner=1')}
        >
          <Eye className="w-4 h-4" />
          <span className="hidden md:inline">View storefront</span>
        </Link>
      </div>

      {showOnboarding && (
        <div className="mb-10 rounded-2xl border border-(--admin-border) bg-(--admin-card) p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Get your store ready</h2>
              <p className="text-sm text-zinc-500 mt-0.5">{onboarding.length - remaining} of {onboarding.length} complete</p>
            </div>
            <div className="text-xs font-bold text-zinc-400">
              {Math.round(((onboarding.length - remaining) / onboarding.length) * 100)}%
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-5">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${((onboarding.length - remaining) / onboarding.length) * 100}%` }}
            />
          </div>
          <ul className="space-y-2.5">
            {onboarding.map(step => (
              <li key={step.id}>
                <Link
                  href={step.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    step.done ? 'opacity-50' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {step.done ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" />
                  )}
                  <span className={`flex-1 text-sm font-medium ${step.done ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {step.label}
                  </span>
                  {!step.done && <ArrowUpRight className="w-4 h-4 text-zinc-400" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Three stacked cards pushed everything else off a phone screen, so
          below md they swipe instead, 78% wide, which leaves the edge of the
          next one showing as the cue that there is more. */}
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-1 [&>*]:snap-start [&>*]:shrink-0 [&>*]:w-[78%] mb-6 md:mb-10 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:[&>*]:w-auto">
        <StatCard title="Total Products" value={store._count.products} icon={<Package className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 dark:text-zinc-400" />} />
        <StatCard title="Total Orders"   value={store._count.orders}   icon={<ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 dark:text-zinc-400" />} />
        <StatCard title="Active Theme"   value="Modern"                icon={<Palette className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 dark:text-zinc-400" />} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardLink href={`/dashboard/stores/${storeId}/products`} title="Products"         description="Add, edit, and manage your inventory." />
        <DashboardLink href={`/dashboard/stores/${storeId}/orders`}   title="Orders"           description="Track and fulfill customer purchases." />
        <DashboardLink href={`/dashboard/stores/${storeId}/theme`}    title="Theme Customizer" description="Change colors, fonts, and layouts." />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-(--admin-card) p-4 md:p-6 rounded-2xl border border-(--admin-border) shadow-sm">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="p-1.5 md:p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">{icon}</div>
      </div>
      <p className="text-[13px] md:text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
      <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{value}</h3>
    </div>
  )
}

function DashboardLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="group p-4 md:p-5 rounded-2xl border border-(--admin-border) hover:border-black dark:hover:border-(--admin-field-border) transition-all bg-(--admin-card) flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-[15px] md:text-base font-bold text-zinc-900 dark:text-zinc-50">{title}</h4>
          <ArrowUpRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-black dark:group-hover:text-zinc-300 transition-colors" />
        </div>
        <p className="text-[13px] md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">{description}</p>
      </div>
    </Link>
  )
}
