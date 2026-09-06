import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import { AdminThemeProvider, type AdminThemeMode } from '@/components/dashboard/AdminThemeProvider'
import { DashboardCurrencyProvider } from '@/components/CurrencyProvider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) redirect('/sign-in')

  const dbUser =
    (await prisma.user.findUnique({ where: { clerkId: userId } })) ??
    (await prisma.user.create({ data: { clerkId: userId, email } }))

  const stores = await prisma.store.findMany({
    where: { ownerId: dbUser.id },
    orderBy: { createdAt: 'desc' },
  })

  const currencies = Object.fromEntries(stores.map(s => [s.id, s.currency]))

  return (
    <AdminThemeProvider initialMode={(dbUser.adminTheme as AdminThemeMode) ?? 'system'}>
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <div className="flex">
          <Sidebar
            stores={stores}
            firstName={user?.firstName ?? ''}
            lastName={user?.lastName ?? ''}
            email={email}
            imageUrl={user?.imageUrl ?? ''}
          />
          <main className="flex-1 md:ml-60 min-w-0"><DashboardCurrencyProvider currencies={currencies}>{children}</DashboardCurrencyProvider></main>
        </div>
      </div>
    </AdminThemeProvider>
  )
}
