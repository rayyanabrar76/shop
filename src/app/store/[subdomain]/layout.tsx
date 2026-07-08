import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { CartProvider } from './cart'
import { AuthProvider, type CustomerSession } from './auth-context'
import { verifyCustomerToken, COOKIE_NAME } from '@/lib/store-auth'
import { prisma } from '@/lib/prisma'
import { sanitizeCustomCss, sanitizeCustomHead } from '@/lib/sanitize'
import OwnerPreviewBar from './OwnerPreviewBar'

export async function generateMetadata({
  params,
}: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const { subdomain } = await params
  const store = await prisma.store.findUnique({
    where: { subdomain },
    select: { name: true, theme: { select: { logoUrl: true, footerText: true } } },
  })
  if (!store) return { title: 'Store not found' }

  const description =
    store.theme?.footerText?.slice(0, 160) ??
    `Shop ${store.name} online. Discover products and place orders securely.`

  return {
    title: { default: store.name, template: `%s — ${store.name}` },
    description,
    icons: store.theme?.logoUrl ? { icon: store.theme.logoUrl } : undefined,
    openGraph: {
      title: store.name,
      description,
      type: 'website',
      images: store.theme?.logoUrl ? [{ url: store.theme.logoUrl }] : undefined,
    },
    twitter: {
      card: 'summary',
      title: store.name,
      description,
    },
    robots: { index: true, follow: true },
  }
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  let initialCustomer: CustomerSession | null = null
  if (token) {
    const payload = await verifyCustomerToken(token)
    if (payload && payload.subdomain === subdomain) {
      initialCustomer = {
        customerId: payload.customerId,
        email: payload.email,
        name: payload.name,
      }
    }
  }

  const store = await prisma.store.findUnique({
    where: { subdomain },
    select: {
      id: true,
      ownerId: true,
      theme: { select: { customCss: true, customHead: true, darkMode: true, showDarkToggle: true, backgroundColor: true, textColor: true, footerColor: true, productGridBg: true } },
    },
  })
  const customCss       = sanitizeCustomCss(store?.theme?.customCss ?? '')
  const customHead      = sanitizeCustomHead(store?.theme?.customHead ?? '')
  const darkMode        = store?.theme?.darkMode        ?? false
  const showDarkToggle  = store?.theme?.showDarkToggle  ?? true
  // When darkMode is ON, the DB stores dark colors in backgroundColor/textColor/footerColor.
  // Use hardcoded light defaults so the blocking script sets correct vars when customer prefers light.
  const lightBg         = darkMode ? '#ffffff' : (store?.theme?.backgroundColor ?? '#ffffff')
  const lightText       = darkMode ? '#09090b' : (store?.theme?.textColor       ?? '#09090b')
  const lightFooter     = darkMode ? '#f4f4f5' : (store?.theme?.footerColor     ?? '#f4f4f5')
  const lightPgBg       = darkMode ? '#ffffff' : (store?.theme?.productGridBg   ?? '#ffffff')

  // Runs synchronously before first paint — sets data-dark on <html> AND CSS vars for bg/text.
  // Using CSS vars means the page background is always correct regardless of what color
  // the owner last saved, preventing the "light mode but dark background" inconsistency.
  const DARK_INIT_SCRIPT = `(function(){try{
    var d=${JSON.stringify(darkMode)};
    var t=${JSON.stringify(showDarkToggle)};
    var lbg=${JSON.stringify(lightBg)};
    var ltxt=${JSON.stringify(lightText)};
    var lft=${JSON.stringify(lightFooter)};
    var lpg=${JSON.stringify(lightPgBg)};
    var p=localStorage.getItem(${JSON.stringify(`sf-dark-${subdomain}`)});
    var on=t?(p!==null?p==='true':d):d;
    var el=document.documentElement;
    if(on){
      el.setAttribute('data-dark','true');
      el.style.setProperty('--store-bg','#09090b');
      el.style.setProperty('--store-text','#fafafa');
      el.style.setProperty('--store-footer','#09090b');
      el.style.setProperty('--store-pg-bg','#09090b');
      el.style.setProperty('--store-divider','rgba(255,255,255,0.12)');
      el.style.setProperty('--store-card-border','rgba(255,255,255,0.08)');
    }else{
      el.removeAttribute('data-dark');
      el.style.setProperty('--store-bg',lbg);
      el.style.setProperty('--store-text',ltxt);
      el.style.setProperty('--store-footer',lft);
      el.style.setProperty('--store-pg-bg',lpg);
      el.style.setProperty('--store-divider','rgba(0,0,0,0.08)');
      el.style.setProperty('--store-card-border','#f1f1f1');
    }
  }catch(e){}}())`

  const DARK_MODE_CSS = `
    [data-dark] .bg-white { background-color: #18181b !important; }
    [data-dark] .bg-zinc-50 { background-color: #27272a !important; }
    [data-dark] .bg-zinc-100 { background-color: #3f3f46 !important; }
    [data-dark] .bg-zinc-200 { background-color: #3f3f46 !important; }
    [data-dark] header > div { background-color: rgba(9,9,11,0.95) !important; border-color: rgba(255,255,255,0.06) !important; }
    [data-dark] .border-zinc-200 { border-color: #3f3f46 !important; }
    [data-dark] .border-zinc-100 { border-color: #27272a !important; }
    [data-dark] .text-zinc-900 { color: #fafafa !important; }
    [data-dark] .text-zinc-800 { color: #f4f4f5 !important; }
    [data-dark] .text-zinc-700 { color: #d4d4d8 !important; }
    [data-dark] .text-zinc-600 { color: #a1a1aa !important; }
    [data-dark] .text-zinc-500 { color: #71717a !important; }
    [data-dark] .text-zinc-400 { color: #52525b !important; }
    [data-dark] .text-zinc-300 { color: #3f3f46 !important; }
    [data-dark] input, [data-dark] textarea, [data-dark] select {
      background-color: #27272a !important;
      border-color: #3f3f46 !important;
      color: #fafafa !important;
    }
    [data-dark] input::placeholder, [data-dark] textarea::placeholder { color: #52525b !important; }
    [data-dark] .divide-zinc-100 > * + * { border-color: #27272a !important; }
    [data-dark] aside { background-color: #18181b !important; }
    [data-dark] aside .bg-zinc-50 { background-color: #27272a !important; }
    [data-dark] aside .border-zinc-100 { border-color: #27272a !important; }
    [data-dark] aside .border-zinc-200 { border-color: #3f3f46 !important; }
    [data-dark] aside .text-zinc-900 { color: #fafafa !important; }
    [data-dark] aside .text-zinc-800 { color: #f4f4f5 !important; }
    [data-dark] .hover\\:bg-zinc-50:hover { background-color: #27272a !important; }
    [data-dark] .hover\\:bg-zinc-100:hover { background-color: #3f3f46 !important; }
    [data-dark] section { background-color: #09090b !important; }
    [data-dark] [data-pg] { background-color: #09090b !important; }
    [data-dark] .min-h-screen.bg-zinc-50 { background-color: #09090b !important; }
    [data-dark] .bg-emerald-50 { background-color: #052e16 !important; }
    [data-dark] .border-emerald-100 { border-color: #14532d !important; }
    [data-dark] .text-emerald-700 { color: #34d399 !important; }
    [data-dark] .text-emerald-600 { color: #6ee7b7 !important; }
    [data-dark] .bg-red-50 { background-color: #450a0a !important; }
    [data-dark] .border-red-100 { border-color: #7f1d1d !important; }
    [data-dark] .text-red-600 { color: #f87171 !important; }
    [data-dark] .text-red-500 { color: #fca5a5 !important; }
    [data-dark] .rounded-2xl.bg-white { background-color: #18181b !important; }
    [data-dark] .min-h-screen { background-color: #09090b !important; color: #fafafa !important; }
    [data-dark] footer { background-color: #09090b !important; border-color: rgba(255,255,255,0.08) !important; color: #fafafa !important; }
    [data-dark] [data-btn-type="outline"] { color: rgba(255,255,255,0.92) !important; border-color: rgba(255,255,255,0.55) !important; }
    [data-dark] [data-btn-type="ghost"] { color: rgba(255,255,255,0.92) !important; border: 1px solid rgba(255,255,255,0.18) !important; }
    [data-dark] [data-btn-type="outline"]:hover,
    [data-dark] [data-btn-type="ghost"]:hover { background-color: rgba(255,255,255,0.08) !important; }
    [data-dark] [data-btn-type="solid"] { border: 1px solid rgba(255,255,255,0.20) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.10) !important; }
    [data-dark] [data-btn-type="solid"]:hover { filter: brightness(1.15) !important; }
  `

  // Check if the logged-in Clerk user owns this store
  let isOwner = false
  if (store) {
    const { userId } = await auth()
    if (userId) {
      const dbUser = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } })
      if (dbUser?.id === store.ownerId) isOwner = true
    }
  }

  return (
    <AuthProvider initialCustomer={initialCustomer}>
      <CartProvider>
        {/* Blocking script — executes before first paint, sets data-dark on <html> with zero flash */}
        <script dangerouslySetInnerHTML={{ __html: DARK_INIT_SCRIPT }} />
        {customCss  && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
        {customHead && <div dangerouslySetInnerHTML={{ __html: customHead }} />}
        <style dangerouslySetInnerHTML={{ __html: DARK_MODE_CSS }} />
        <div id="store-preview-root" className="min-h-screen">
          {children}
        </div>
        {isOwner && store && <OwnerPreviewBar storeId={store.id} />}
      </CartProvider>
    </AuthProvider>
  )
}
