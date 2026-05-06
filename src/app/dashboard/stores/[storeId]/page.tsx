import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Eye, Package, ShoppingCart, Palette, ArrowUpRight } from 'lucide-react'

export default async function StoreDashboardPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { _count: { select: { products: true, orders: true } } },
  })

  if (!store) return <div className="p-10 text-zinc-900 dark:text-zinc-50">Store not found</div>

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{store.name}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Manage your store inventory, orders, and appearance.</p>
        </div>
        <Link
          target="_blank"
          className="flex items-center gap-2 rounded-xl bg-black dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-sm w-fit"
          href={`/store/${store.subdomain}`}
        >
          <Eye className="w-4 h-4" />
          View storefront
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="Total Products" value={store._count.products} icon={<Package className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />} />
        <StatCard title="Total Orders"   value={store._count.orders}   icon={<ShoppingCart className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />} />
        <StatCard title="Active Theme"   value="Modern"                icon={<Palette className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />} />
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
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">{icon}</div>
      </div>
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
      <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{value}</h3>
    </div>
  )
}

function DashboardLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="group p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-black dark:hover:border-zinc-400 transition-all bg-white dark:bg-zinc-900 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-zinc-900 dark:text-zinc-50">{title}</h4>
          <ArrowUpRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-black dark:group-hover:text-zinc-300 transition-colors" />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{description}</p>
      </div>
    </Link>
  )
}
