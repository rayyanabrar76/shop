import { notFound } from 'next/navigation'
import Link from 'next/link'
import { platformAdmin } from '@/lib/platform-admin'
import { AdminThemeProvider } from '@/components/dashboard/AdminThemeProvider'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

export const metadata = { title: 'ShopFlow admin' }

/**
 * ShopFlow's own back office.
 *
 * Deliberately not under /dashboard: that whole tree is scoped to a store the
 * signed-in user owns, and this is the opposite — every account on the
 * instance, read-only. Keeping it on its own path means none of the merchant
 * pages can be reached with platform privileges by accident.
 *
 * notFound() rather than a redirect for anyone else, so the route does not
 * confirm it exists to someone poking at it.
 */
export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await platformAdmin()
  if (!admin) notFound()

  return (
    <AdminThemeProvider initialMode="system">
      <div className="admin-shell min-h-screen" style={{ background: 'var(--admin-canvas)' }}>
        {/* One bar, no sidebar. There are four pages here, and a rail of them
            beside a table is more chrome than the thing it frames. */}
        <header
          className="sticky top-0 z-40 h-14 flex items-center gap-2 px-3 sm:px-5"
          style={{
            background: 'linear-gradient(to bottom, color-mix(in srgb, var(--admin-header) 93%, white), var(--admin-header) 70%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 1px 0 rgba(0,0,0,0.65)',
          }}
        >
          <Link href="/admin" className="flex items-center gap-2 shrink-0 mr-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
              <ShieldCheck className="w-4 h-4" style={{ color: 'var(--admin-header-text)' }} />
            </span>
            <span className="text-[14px] font-black tracking-tight" style={{ color: 'var(--admin-header-text)' }}>
              Shopflow<span className="opacity-50">/admin</span>
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 min-w-0 overflow-x-auto hide-scrollbar">
            {[
              { href: '/admin', label: 'Overview' },
              { href: '/admin/users', label: 'Users' },
              { href: '/admin/stores', label: 'Stores' },
            ].map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-(--admin-header-hover)"
                style={{ color: 'var(--admin-header-text-2)' }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <span className="flex-1" />

          <Link
            href="/dashboard"
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[11.5px] font-semibold transition-colors hover:bg-(--admin-header-hover)"
            style={{ color: 'var(--admin-header-text-2)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to my stores</span>
          </Link>
        </header>

        <main className="min-h-[calc(100vh-3.5rem)]" style={{ background: 'var(--admin-page)' }}>
          {children}
        </main>
      </div>
    </AdminThemeProvider>
  )
}
