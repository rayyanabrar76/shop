import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const category = searchParams.get('category') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(48, parseInt(searchParams.get('limit') ?? '24'))
  const skip = (page - 1) * limit

  const store = await prisma.store.findUnique({ where: { subdomain } })
  if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const where: any = { storeId: store.id, status: 'active' }
  if (q) {
    // Title or tag — see the note in the products page.
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { tags: { has: q.toLowerCase() } },
    ]
  }
  if (category) {
    // Match slug or name — see the note in the products page.
    const cat = await prisma.category.findFirst({
      where: { storeId: store.id, slug: category },
      select: { slug: true, name: true },
    })
    where.category = cat ? { in: [cat.slug, cat.name] } : category
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: { id: true, title: true, price: true, imageUrl: true, category: true, inventory: true, slug: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.product.count({ where }),
  ])

  return NextResponse.json({
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
