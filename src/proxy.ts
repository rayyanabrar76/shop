import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isApiRoute = createRouteMatcher(['/api/(.*)'])

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing(.*)',
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
])

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost:3000'

export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl
  const hostname = request.headers.get('host') ?? ''

  const host = hostname
    .replace(':3000', '')
    .replace(':443', '')
    .replace(':80', '')

  const isLocalhost = hostname.includes('localhost')
  const isRootDomain = host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`
  const isSubdomain = host.endsWith(`.${ROOT_DOMAIN}`)

  // ── Custom domain — not localhost, not root, not subdomain ──────────────
  if (!isLocalhost && !isRootDomain && !isSubdomain) {
    return NextResponse.rewrite(
      new URL(`/custom-domain/${host}${url.pathname}`, request.url)
    )
  }

  // ── Subdomain — e.g. my-store.jesllypop.vercel.app ──────────────────────
  if (isSubdomain) {
    const subdomain = host.replace(`.${ROOT_DOMAIN}`, '')
    if (subdomain !== 'www' && subdomain !== 'api') {
      return NextResponse.rewrite(
        new URL(`/store/${subdomain}${url.pathname}`, request.url)
      )
    }
  }

  // ── Protect dashboard routes ─────────────────────────────────────────────
  if (!isPublicRoute(request)) {
    const { userId } = await auth()
    if (!userId) {
      // API routes get a clean 401; page requests go to our custom sign-in
      // (not Clerk's hosted page), preserving where the user was headed.
      if (isApiRoute(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('redirect_url', url.pathname + url.search)
      return NextResponse.redirect(signInUrl)
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