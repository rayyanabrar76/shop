import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { verifyCustomerToken, COOKIE_NAME } from '@/lib/store-auth'
import StoreBanner from '../../StoreBanner'
import StoreHeader from '../../StoreHeader'
import StoreFooter from '../../StoreFooter'
import CartSidebar from '../../cart-sidebar'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'
import { formatPrice } from '@/lib/currency'

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) redirect(`/store/${subdomain}/login?redirect=/store/${subdomain}/account/orders`)

  const payload = await verifyCustomerToken(token)
  if (!payload || payload.subdomain !== subdomain) {
    redirect(`/store/${subdomain}/login?redirect=/store/${subdomain}/account/orders`)
  }

  const store = await prisma.store.findUnique({
    where: { subdomain },
    include: { theme: true },
  })
  if (!store) notFound()

  const orders = await prisma.order.findMany({
    where: { storeId: store.id, customerEmail: payload.email },
    include: {
      items: {
        include: { product: { select: { title: true, imageUrl: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const t = store.theme
  const theme = {
    primaryColor:    t?.primaryColor    ?? '#0a0a0a',
    backgroundColor: t?.backgroundColor ?? '#ffffff',
    footerColor:     t?.footerColor     ?? '#f4f4f5',
    accentColor:     t?.accentColor     ?? '#000000',
    textColor:       t?.textColor       ?? '#09090b',
    borderRadius:    t?.borderRadius    ?? '0.75rem',
    buttonStyle:     t?.buttonStyle     ?? 'solid',
    font:            t?.font            ?? 'sans',
    headingFont:     t?.headingFont     ?? 'sans',
    bannerText:      t?.bannerText      ?? '',
    showBanner:      t?.showBanner      ?? false,
    logoUrl:         t?.logoUrl         ?? '',
    logoWidth:       t?.logoWidth       ?? 120,
    logoHeight:       t?.logoHeight       ?? 48,
    headerLayout:       t?.headerLayout       ?? 'left',
    menuPosition: t?.menuPosition ?? 'auto',
    headerWidth: t?.headerWidth ?? 'page',
    headerHeight: t?.headerHeight ?? 'standard',
    headerSticky: t?.headerSticky ?? true,
    headerBorderWidth: t?.headerBorderWidth ?? 1,
    headerBgColor: t?.headerBgColor ?? '',
    headerTextColor: t?.headerTextColor ?? '',
    utilityStyle: t?.utilityStyle ?? 'icons',
    headerTransparent: t?.headerTransparent ?? false,
    headerInverseLogoUrl: t?.headerInverseLogoUrl ?? '',
    headerTransparentText: t?.headerTransparentText ?? '#ffffff',
    footerText:      t?.footerText      ?? '',
    footerLogoUrl:      t?.footerLogoUrl      ?? '',
    footerLogoWidth:      t?.footerLogoWidth      ?? 130,
    footerLogoHeight:      t?.footerLogoHeight      ?? 56,
    instagramHandle: t?.instagramHandle ?? '',
    twitterHandle:   t?.twitterHandle   ?? '',
    facebookUrl:     t?.facebookUrl     ?? '',
    layout:          t?.layout          ?? 'grid',
    cardShadow:      t?.cardShadow      ?? 'none',
    dividerStyle:    t?.dividerStyle    ?? 'none',
    navLinks:    (t?.navLinks as { label: string; href: string }[] | null) ?? null,
    navFontSize: t?.navFontSize ?? 14,
    navCase:     t?.navCase     ?? 'normal',
    navDividers:     t?.navDividers     ?? false,
  }

  const primary = theme.primaryColor

  const statusColors: Record<string, string> = {
    PENDING:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    PAID:      'bg-green-50 text-green-700 border-green-200',
    CANCELLED: 'bg-red-50 text-red-600 border-red-200',
    REFUNDED:  'bg-zinc-100 text-zinc-600 border-zinc-200',
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--store-bg)',
        color: 'var(--store-text)',
        fontFamily: theme.font === 'serif' ? 'serif' : theme.font === 'mono' ? 'monospace' : 'inherit',
      }}
    >
      <StoreBanner theme={theme} />
      <StoreHeader store={store} theme={theme} subdomain={subdomain} />

      <main className="flex-1 px-4 py-12 max-w-3xl mx-auto w-full">
        <div className="mb-8 flex items-center gap-3">
          <Link href={`/store/${subdomain}/account`} className="text-sm opacity-50 hover:opacity-100 transition-opacity flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Account
          </Link>
          <span className="opacity-30">/</span>
          <span className="text-sm font-semibold">Orders</span>
        </div>

        <h1
          className="text-3xl font-black tracking-tight mb-8"
          style={{ fontFamily: theme.headingFont === 'serif' ? 'serif' : 'inherit' }}
        >
          Order History
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-zinc-200 rounded-2xl">
            <Package className="w-10 h-10 mx-auto text-zinc-300 mb-3" />
            <p className="text-zinc-400 text-sm font-medium">No orders yet.</p>
            <Link href={`/store/${subdomain}/products`} className="mt-3 inline-block text-sm font-bold hover:underline" style={{ color: primary }}>
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                {/* Order header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-100 flex-wrap gap-3">
                  <div>
                    <p className="text-xs font-mono text-zinc-400 mb-0.5">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColors[order.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-black">{formatPrice(order.total, store.currency)}</span>
                  </div>
                </div>

                {/* Order items */}
                <div className="divide-y divide-zinc-50">
                  {order.items.map(item => (
                    <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 shrink-0 overflow-hidden">
                        {item.product.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-300">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.product.title}</p>
                        <p className="text-xs text-zinc-400">Qty: {item.quantity} × {formatPrice(item.price, store.currency)}</p>
                      </div>
                      <p className="text-sm font-bold shrink-0">{formatPrice(item.price * item.quantity, store.currency)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <StoreFooter store={store} theme={theme} subdomain={subdomain} />
      <CartSidebar themeStyle={{ primaryColor: primary, borderRadius: theme.borderRadius, buttonStyle: theme.buttonStyle }} subdomain={subdomain} />
    </div>
  )
}
