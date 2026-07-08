import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Store as StoreIcon, ArrowRight, Plus } from 'lucide-react'
import { APP_DOMAIN } from '@/lib/config'

export default async function DashboardPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const stores = await prisma.store.findMany({
    where: { owner: { clerkId } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Select a store to manage or create a new one.
          </p>
        </div>
        <Link
          href="/dashboard/create-store"
          className="flex items-center gap-2 rounded-xl bg-black dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all"
        >
          <Plus className="h-4 w-4" />
          Create Store
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <Link
            key={store.id}
            href={`/dashboard/stores/${store.id}`}
            className="group flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 transition-all hover:border-black dark:hover:border-zinc-400 hover:shadow-md"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors">
                <StoreIcon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="mt-4 font-bold text-zinc-900 dark:text-zinc-50">{store.name}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{store.subdomain}.{APP_DOMAIN}</p>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm font-medium">
              <span className="text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-zinc-200">Open Dashboard</span>
              <ArrowRight className="h-4 w-4 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </div>
          </Link>
        ))}

        {stores.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 py-12">
            <StoreIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No stores found.</p>
            <Link href="/dashboard/create-store" className="mt-4 text-xs font-bold underline text-zinc-700 dark:text-zinc-300">
              Create your first store
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
