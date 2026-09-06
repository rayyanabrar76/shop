import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isApiRoute = createRouteMatcher(['/api/(.*)'])

const isPublicRoute = createRouteMatcher([
  '/',
  '/terms(.*)',
  '/privacy(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/store/(.*)',
  '/custom-domain/(.*)',
  '/api/storefront/(.*)',
  '/api/auth/(.*)',
  '/api/webhooks/(.*)',
  // Shoppers are not Clerk users — they are the store's own customers, or
  // nobody at all. Requiring a dashboard login here meant every real customer
  // got a 401 at the last step, which is why no order had ever been placed.
  // Safe to open only because the route prices the cart from the database
  // rather than from the request, and is rate limited.
  '/api/stores/(.*)/checkout',
])

// Compared against a hostname with its port stripped, so strip it here too —
// otherwise "store.localhost".endsWith(".localhost:3000") is never true and
// subdomain routing silently never matches.
const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost:3000').replace(/:\d+$/, '')

export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl
  const hostname = request.headers.get('host') ?? ''

  // Any port, not just the three that used to be hardcoded.
  const host = hostname.replace(/:\d+$/, '')

  const isLocalhost = host === 'localhost' || host.endsWith('.localhost')
  const isRootDomain = host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`
  const isSubdomain = host.endsWith(`.${ROOT_DOMAIN}`)

  // Hosts the platform itself is served on. A merchant cannot own one of these,
  // so they are never a custom domain — however NEXT_PUBLIC_APP_DOMAIN is set.
  //
  // Without this, a wrong APP_DOMAIN takes the whole site down rather than
  // degrading: every host stops matching root or subdomain, falls through to
  // the custom-domain branch, and rewrites to a store that does not exist. The
  // symptom is a 404 on every page with nothing to explain it.
  const isPlatformHost =
    isLocalhost ||
    host.endsWith('.vercel.app') ||
    host === 'vercel.app'

  // API routes are mounted at the app root and are the same on every host, so
  // they must never be rewritten under a store prefix — /api/x on a shop's own
  // domain would become /store/<sub>/api/x, which does not exist. That 404s
  // every client-side call a storefront makes: cart, checkout, sign-up, search.
  const isApiPath = url.pathname.startsWith('/api/')

  // ── Custom domain — not localhost, not root, not subdomain ──────────────
  if (!isPlatformHost && !isRootDomain && !isSubdomain && !isApiPath) {
    const base = `/custom-domain/${host}`
    const alreadyScoped = url.pathname === base || url.pathname.startsWith(`${base}/`)
    const res = NextResponse.rewrite(
      new URL(alreadyScoped ? url.pathname : `${base}${url.pathname}`, request.url)
    )
    res.headers.set('x-store-base', base)
    return res
  }

  // ── Subdomain — e.g. my-store.jesllypop.vercel.app ──────────────────────
  if (isSubdomain && !isApiPath) {
    const subdomain = host.replace(`.${ROOT_DOMAIN}`, '')
    if (subdomain !== 'www' && subdomain !== 'api') {
      const base = `/store/${subdomain}`
      // Links inside the storefront are still absolute (/store/<sub>/...), so
      // without this guard the rewrite would prefix them a second time and 404.
      const alreadyScoped = url.pathname === base || url.pathname.startsWith(`${base}/`)
      const target = alreadyScoped ? url.pathname : `${base}${url.pathname}`
      const res = NextResponse.rewrite(new URL(target, request.url))
      // Lets the storefront build host-relative links instead of /store/... ones.
      res.headers.set('x-store-base', base)
      return res
    }
  }

  // ── Signed-in owners skip the marketing page ─────────────────────────────
  // Only on the app's own host: this runs after the storefront branches, so a
  // store's own home page is never affected.
  if (url.pathname === '/') {
    // Plain auth(), not protect(): a merely-stale 60s token reads as signed out
    // here, and the worst that does is show the landing page — no redirect loop
    // and no bounce to /sign-in.
    const { userId } = await auth()
    if (userId) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // ── Protect dashboard routes ─────────────────────────────────────────────
  if (!isPublicRoute(request)) {
    // API routes want a clean 401 rather than a redirect.
    if (isApiRoute(request)) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else {
      // auth.protect(), not a manual redirect. Clerk's session token lives 60
      // seconds and is refreshed through a "handshake" round-trip. Checking
      // userId ourselves treats a merely-stale token as signed out and bounces
      // to /sign-in, which is why a signed-in owner saw the form flash before
      // being sent on. protect() performs the handshake and only redirects
      // when the user is genuinely signed out.
      await auth.protect({
        unauthenticatedUrl: new URL(
          `/sign-in?redirect_url=${encodeURIComponent(url.pathname + url.search)}`,
          request.url,
        ).toString(),
      })
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}