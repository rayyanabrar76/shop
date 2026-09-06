import { prisma } from '@/lib/prisma'
import { storeUrl } from '@/lib/config'

/**
 * Per-store robots.txt, served at the store's host root.
 *
 * Account, checkout and auth pages are private or transactional — indexing
 * them wastes crawl budget and can surface a stranger's cart page in results.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ subdomain: string }> },
) {
  const { subdomain } = await params

  const store = await prisma.store.findUnique({
    where: { subdomain },
    select: { id: true },
  })
  if (!store) {
    return new Response('User-agent: *\nDisallow: /', {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  const body = `User-agent: *
Allow: /
Disallow: /account
Disallow: /checkout
Disallow: /cart
Disallow: /login
Disallow: /signup
Disallow: /forgot-password
Disallow: /success
Disallow: /*?q=

Sitemap: ${storeUrl(subdomain, '/sitemap.xml')}
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  })
}
