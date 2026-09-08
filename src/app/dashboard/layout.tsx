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
    // The store's own mark lives on its theme, not on the store, so the
    // sidebar can only show it if the theme comes along for the ride.
    include: { theme: { select: { faviconUrl: true } } },
  })

  const currencies = Object.fromEntries(stores.map(s => [s.id, s.currency]))

  return (
    <AdminThemeProvider initialMode={(dbUser.adminTheme as AdminThemeMode) ?? 'system'}>
      <div
        className="admin-shell min-h-screen"
        style={{ background: "var(--admin-canvas)" }}
      >
        <div className="flex">
          <Sidebar
            stores={stores.map(s => ({
              ...s,
              // Favicon only, never the header logo: that is the square
              // mark by definition, and the chip it fills is 20px across.
              markUrl: s.theme?.faviconUrl || null,
            }))}
            firstName={user?.firstName ?? ''}
            lastName={user?.lastName ?? ''}
            email={email}
            imageUrl={user?.imageUrl ?? ''}
          />
          {/* pt-15 clears the fixed mobile header; the desktop sidebar is beside
              the content rather than above it, so it needs no offset. */}
          <main className="flex-1 md:ml-60 min-w-0 pt-15">
            {/* The content sits on its own panel, rounded where it meets the
                header so the admin reads as a surface laid under the bar
                rather than a region that merely starts there. The sidebar
                carries the matching left corner; on a phone, where there is
                no sidebar in flow, this panel carries both.

                On a wide screen this panel is also the thing that scrolls --
                see .admin-scroll, so its scrollbar belongs to the panel and
                a sticky sub-header inside sticks just under the header. */}
            <div
              className="admin-scroll rounded-t-2xl md:rounded-tl-none"
              style={{
                background: "var(--admin-page)",
                minHeight: "calc(100vh - 3.75rem)",
              }}
            >
              <DashboardCurrencyProvider currencies={currencies}>{children}</DashboardCurrencyProvider>
            </div>
          </main>
        </div>
      </div>
    </AdminThemeProvider>
  )
}
