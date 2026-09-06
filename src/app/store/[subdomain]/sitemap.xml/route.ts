import { prisma } from '@/lib/prisma'
import { storeUrl } from '@/lib/config'

/**
 * Per-store sitemap, served at the store's own host root (the middleware
 * rewrites <store>.<domain>/sitemap.xml here).
 *
 * Every URL uses the same absolute form as the canonical tags, so a crawler is
 * never offered a second address for the same page.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ subdomain: string }> },
) {
  const { subdomain } = await params

  const store = await prisma.store.findUnique({
    where: { subdomain },
    select: { id: true, createdAt: true },
  })
  if (!store) {
    return new Response('Not found', { status: 404 })
  }

  const [products, categories, pages] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: store.id, status: 'active' },
      select: { slug: true, id: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      where: { storeId: store.id, visible: true },
      select: { slug: true },
    }),
    prisma.storePage.findMany({
      where: { storeId: store.id },
      select: { slug: true },
    }),
  ])

  const entries: { loc: string; lastmod?: Date; priority: string }[] = [
    { loc: storeUrl(subdomain), lastmod: store.createdAt, priority: '1.0' },
    { loc: storeUrl(subdomain, '/products'), priority: '0.9' },
    ...categories.map(c => ({
      loc: storeUrl(subdomain, `/categories/${c.slug}`),
      priority: '0.8',
    })),
    ...products.map(p => ({
      loc: storeUrl(subdomain, `/products/${p.slug || p.id}`),
      lastmod: p.createdAt,
      priority: '0.7',
    })),
    ...pages.map(pg => ({
      loc: storeUrl(subdomain, `/${pg.slug}`),
      priority: '0.5',
    })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    e => `  <url>
    <loc>${escapeXml(e.loc)}</loc>${e.lastmod ? `
    <lastmod>${e.lastmod.toISOString().split('T')[0]}</lastmod>` : ''}
    <priority>${e.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  })
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
