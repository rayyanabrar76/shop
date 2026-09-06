import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  const store = await prisma.store.findUnique({ where: { subdomain } })
  if (!store) return NextResponse.json({ categories: [] })

  const [rows, products] = await Promise.all([
    prisma.category.findMany({
      where: { storeId: store.id, visible: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, imageUrl: true },
    }),
    prisma.product.findMany({
      where: { storeId: store.id, status: 'active' },
      orderBy: { createdAt: 'desc' },
      select: { category: true, imageUrl: true },
    }),
  ])

  // Same shape the server-rendered page builds, so the theme editor can refresh
  // the preview's categories without a reload.
  const categories = rows.map(c => ({
    ...c,
    imageUrl: c.imageUrl || products.find(p => p.category === c.slug || p.category === c.name)?.imageUrl || null,
    count: products.filter(p => p.category === c.slug || p.category === c.name).length,
  }))

  return NextResponse.json({ categories })
}
