import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { CartProvider } from './cart'
import { AuthProvider, type CustomerSession } from './auth-context'
import { verifyCustomerToken, COOKIE_NAME } from '@/lib/store-auth'
import { prisma } from '@/lib/prisma'
import { sanitizeCustomCss, sanitizeCustomHead } from '@/lib/sanitize'
import OwnerPreviewBar from './OwnerPreviewBar'
import PreviewLinks from './PreviewLinks'
import { CurrencyProvider } from '@/components/CurrencyProvider'
import { StoreBaseProvider } from '@/components/StoreBaseProvider'
import { getStoreBase } from '@/lib/store-base'
import { storeUrl } from '@/lib/config'
import { isDark } from '@/lib/contrast'

export async function generateMetadata({
  params,
}: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const { subdomain } = await params
  const store = await prisma.store.findUnique({
    where: { subdomain },
    select: {
      name: true,
      theme: { select: { logoUrl: true, footerText: true, seoTitle: true, seoDescription: true, faviconUrl: true } },
    },
  })
  if (!store) return { title: 'Store not found' }

  // The merchant's own title wins; otherwise the shop name. Only the home page
  // uses it in full — inner pages keep "<page> — <shop>" so a result still
  // says which shop it is.
  const homeTitle = store.theme?.seoTitle?.trim() || store.name
  const description =
    store.theme?.seoDescription?.trim() ||
    store.theme?.footerText?.trim()?.slice(0, 160) ||
    `Shop ${store.name} online. Discover products and place orders securely.`

  // A square favicon if one was set; the header logo is the fallback and is
  // usually too wide to read at 16px.
  const icon = store.theme?.faviconUrl?.trim() || store.theme?.logoUrl
  const ogImage = store.theme?.logoUrl || store.theme?.faviconUrl?.trim()

  const canonical = storeUrl(subdomain)

  return {
    // Absolute base so relative canonicals and OG images resolve correctly.
    metadataBase: new URL(canonical),
    title: { default: homeTitle, template: `%s, ${store.name}` },
    description,
    alternates: { canonical },
    icons: icon ? { icon } : undefined,
    openGraph: {
      title: homeTitle,
      description,
      url: canonical,
      siteName: store.name,
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: homeTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
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
      currency: true,
      theme: { select: { customCss: true, customHead: true, backgroundColor: true, textColor: true, footerColor: true, productGridBg: true, borderRadius: true } },
    },
  })
  const customCss       = sanitizeCustomCss(store?.theme?.customCss ?? '')
  const customHead      = sanitizeCustomHead(store?.theme?.customHead ?? '')
  const bg     = store?.theme?.backgroundColor ?? '#ffffff'
  const text   = store?.theme?.textColor       ?? '#09090b'
  const footer = store?.theme?.footerColor     ?? '#ffffff'
  const gridBg = store?.theme?.productGridBg   ?? '#ffffff'

  /*
   * Writes the shop's colours before the first paint.
   *
   * Inline rather than in a stylesheet because it has to land before anything
   * renders: a page that paints white and then turns dark is worse than one
   * that takes a moment longer. Every storefront component reads these
   * variables, so this is the single place the shop's colours come from.
   *
   * There used to be a second theme layered over this, a "dark mode" switch
   * with its own stylesheet of forty !important overrides. It was removed on
   * 2026-09-08: it could not reach inline styles, it did not revisit any
   * colour the merchant had already chosen, and the four pickers below do the
   * same job without disagreeing with themselves.
   */
  const THEME_INIT_SCRIPT = `(function(){try{
    var el=document.documentElement;
    el.style.setProperty('--store-bg',${JSON.stringify(bg)});
    el.style.setProperty('--store-text',${JSON.stringify(text)});
    el.style.setProperty('--store-footer',${JSON.stringify(footer)});
    el.style.setProperty('--store-pg-bg',${JSON.stringify(gridBg)});
    el.style.setProperty('--store-divider','rgba(0,0,0,0.08)');
    el.style.setProperty('--store-card-border','#f1f1f1');
  }catch(e){}}())`

  /*
   * The browser's own chrome, painted from the shop.
   *
   * A scrollbar lives outside the page's layout, so no section can reach it:
   * a full-bleed dark band still had a pale gutter running down beside it,
   * because what shows through the transparent track is the canvas, and the
   * canvas is painted from <body>. Painting the body from the shop's own
   * background puts the gutter on the same surface as the page.
   *
   * color-scheme is what tells the browser to render its native parts for a
   * dark surface rather than assuming light, and the thumb has to change with
   * it: the default is a dark thumb, which on a dark shop is a control you
   * cannot see. The admin has had this since it went dark; the storefront,
   * which is the one that lets a merchant pick any colour at all, never did.
   *
   * The background is a variable rather than the value, so the live preview
   * follows a colour as it is being picked.
   */
  const darkShop = isDark(bg)
  const CHROME_CSS = `
    html { color-scheme: ${darkShop ? 'dark' : 'light'}; }
    body { background-color: var(--store-bg, ${bg}); }
    :root {
      --scrollbar-thumb:        ${darkShop ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.16)'};
      --scrollbar-thumb-hover:  ${darkShop ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.30)'};
      --scrollbar-thumb-active: ${darkShop ? 'rgba(255,255,255,0.44)' : 'rgba(0,0,0,0.42)'};
    }
  `

  // Storefront chrome (header, cart, panels, inputs) used fixed Tailwind
  // rounding, so a store set to square corners still had rounded buttons
  // everywhere outside the product grid. Map the box-ish utilities onto the
  // theme radius. rounded-full is deliberately excluded — dots, avatars and
  // pills are meant to stay circular at any curvature.
  const themeRadius = store?.theme?.borderRadius ?? '0.75rem'
  const RADIUS_CSS = `
    #store-preview-root .rounded-sm,
    #store-preview-root .rounded,
    #store-preview-root .rounded-md,
    #store-preview-root .rounded-lg,
    #store-preview-root .rounded-xl,
    #store-preview-root .rounded-2xl,
    #store-preview-root .rounded-3xl { border-radius: ${themeRadius} !important; }
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

  const storeBase = await getStoreBase(subdomain)

  return (
    <AuthProvider initialCustomer={initialCustomer}>
      <StoreBaseProvider base={storeBase}>
      <CurrencyProvider currency={store?.currency}>
      <CartProvider storeKey={subdomain}>
        {/* Before first paint, so the shop never flashes the wrong colour. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {customCss  && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
        {customHead && <div dangerouslySetInnerHTML={{ __html: customHead }} />}
        <style dangerouslySetInnerHTML={{ __html: CHROME_CSS }} />
        <style dangerouslySetInnerHTML={{ __html: RADIUS_CSS }} />
        <div id="store-preview-root" className="min-h-screen">
          {children}
        </div>
        {store && <OwnerPreviewBar storeId={store.id} isOwner={isOwner} />}
        {/* Only does anything inside the theme editor's frame. */}
        <PreviewLinks />
      </CartProvider>
      </CurrencyProvider>
      </StoreBaseProvider>
    </AuthProvider>
  )
}
