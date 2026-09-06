import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/storefront/[subdomain]/footer -> { categories, pages }
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
    if (!store) return NextResponse.json({ categories: [], pages: [] })

    const [categories, pages] = await Promise.all([
      prisma.category.findMany({
        where: { storeId: store.id, visible: true },
        select: { name: true, slug: true },
        orderBy: { name: 'asc' },
        take: 6,
      }),
      prisma.storePage.findMany({
        where: { storeId: store.id },
        select: { name: true, slug: true },
        orderBy: { createdAt: 'asc' },
        take: 8,
      }),
    ])

    return NextResponse.json(
      { categories, pages },
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300' } },
    )
  } catch (err) {
    console.error('[footer]', err)
    // The footer is decoration around the real page — never fail it.
    return NextResponse.json({ categories: [], pages: [] })
  }
}
