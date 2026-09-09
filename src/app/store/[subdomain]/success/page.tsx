import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { CheckCircle, Clock, ArrowLeft, CreditCard } from 'lucide-react'
import StoreBanner from '../StoreBanner'
import StoreHeader from '../StoreHeader'
import StoreFooter from '../StoreFooter'
import CartSidebar from '../cart-sidebar'
import ThemeSync from '../ThemeSync'
import { formatPrice } from '@/lib/currency'

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ orderId?: string; method?: string }>
}) {
  const { subdomain } = await params
  const { orderId, method } = await searchParams

  const store = await prisma.store.findUnique({
    where: { subdomain },
    include: { theme: true },
  })

  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } },
      })
    : null

  const t = store?.theme
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
    drawer: t?.drawer ?? null,
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

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--store-bg)',
        color: 'var(--store-text)',
        fontFamily: theme.font === 'serif' ? 'serif' : theme.font === 'mono' ? 'monospace' : 'inherit',
      }}
    >
      <ThemeSync />
      {store && <StoreBanner theme={theme} />}
      {store && <StoreHeader store={store} theme={theme} subdomain={subdomain} />}

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg space-y-5">

          {/* Success card */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Order Placed!</h1>
              <p className="text-sm text-zinc-400 mt-1">Thank you for your purchase.</p>
            </div>
            {order && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg">
                <span className="text-xs text-zinc-500">Order ID:</span>
                <span className="text-xs font-mono text-zinc-700">{order.id.slice(0, 16)}...</span>
              </div>
            )}
          </div>

          {/* COD instructions */}
          {method === 'cod' && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-semibold text-zinc-800">Cash on Delivery</p>
              </div>
              <p className="text-sm text-zinc-500">
                Your order is confirmed. Please have{' '}
                <strong>{formatPrice(order?.total ?? 0, store?.currency)}</strong> ready when your delivery arrives.
              </p>
            </div>
          )}

          {/* Stripe paid confirmation */}
          {method === 'stripe' && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-violet-500" />
                <p className="text-sm font-semibold text-zinc-800">Payment Confirmed</p>
              </div>
              <p className="text-sm text-zinc-500">
                Your card payment of{' '}
                <strong>{formatPrice(order?.total ?? 0, store?.currency)}</strong> was successful.
                Your order is being processed.
              </p>
            </div>
          )}

          {/* Order items */}
          {order && order.items.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Your Items</p>
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.product?.imageUrl && (
                    <img
                      src={item.product.imageUrl}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover bg-zinc-100 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.product?.title}</p>
                    <p className="text-xs text-zinc-400">×{item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold">{formatPrice(item.price * item.quantity, store?.currency)}</p>
                </div>
              ))}
              <div className="pt-3 border-t border-zinc-100 flex justify-between items-center">
                <span className="text-sm text-zinc-500">Total</span>
                <span className="text-lg font-black">{formatPrice(order.total, store?.currency)}</span>
              </div>
            </div>
          )}

          <Link
            href={`/store/${subdomain}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>
      </main>

      {store && <StoreFooter store={store} theme={theme} subdomain={subdomain} />}
      {store && (
        <CartSidebar
          themeStyle={{ primaryColor: theme.primaryColor, borderRadius: theme.borderRadius, buttonStyle: theme.buttonStyle }}
          subdomain={subdomain}
        />
      )}
    </div>
  )
}
