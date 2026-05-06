import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  const store = await prisma.store.findUnique({ where: { subdomain } })
  if (!store) return NextResponse.json({ categories: [] })

  const categories = await prisma.category.findMany({
    where: { storeId: store.id, visible: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  })

  return NextResponse.json({ categories })
}
