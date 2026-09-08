import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isStarterPage } from '@/lib/default-pages'
import { publishedPolicies } from '@/lib/policies-db'
import { POLICY_BY_KIND } from '@/lib/policies'

/**
 * GET /api/storefront/[subdomain]/footer -> { categories, pages, policies }
 *
 * The footer renders on ten different pages. Fetching its own links in one
 * request keeps it self-contained instead of threading the same two lists
 * through every one of them, and the response is cacheable.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ subdomain: string }> },
) {
  try {
    const { subdomain } = await params

    const store = await prisma.store.findUnique({
      where: { subdomain },
      select: { id: true },
    })
    if (!store) return NextResponse.json({ categories: [], pages: [], policies: [] })

    const [categories, pages, policies] = await Promise.all([
      prisma.category.findMany({
        where: { storeId: store.id, visible: true },
        select: { name: true, slug: true },
        orderBy: { name: 'asc' },
        take: 6,
      }),
      prisma.storePage.findMany({
        where: { storeId: store.id },
        select: { name: true, slug: true, content: true },
        orderBy: { createdAt: 'asc' },
        take: 12,
      }),
      publishedPolicies(store.id),
    ])

    // A shopper clicking "Refund Policy" and finding writing prompts is worse
    // than no link, so a policy appears only once it has been written.
    const written = pages
      .filter(p => !isStarterPage(p.slug, p.content))
      .slice(0, 8)
      .map(p => ({ name: p.name, slug: p.slug }))

    return NextResponse.json(
      // Policies are separate from pages so the footer can put them in their
      // own group; the checkout reads the same list.
      { categories, pages: written, policies: policies.map(p => ({ name: p.title, slug: POLICY_BY_KIND[p.kind].slug })) },
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300' } },
    )
  } catch (err) {
    console.error('[footer]', err)
    // The footer is decoration around the real page — never fail it.
    return NextResponse.json({ categories: [], pages: [], policies: [] })
  }
}
