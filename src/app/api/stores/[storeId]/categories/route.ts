import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET /api/stores/[storeId]/categories — list all
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params
    const categories = await prisma.category.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ categories })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// POST /api/stores/[storeId]/categories — create
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await params
    const { name, slug, description, imageUrl, productIds } = await req.json()

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } } })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const existing = await prisma.category.findUnique({
      where: { storeId_slug: { storeId, slug } },
    })
    if (existing) return NextResponse.json({ error: 'A category with this slug already exists.' }, { status: 409 })

    const category = await prisma.category.create({
      data: {
        storeId,
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
      },
    })

    // Products reference a category by slug, so assigning them is a plain
    // update rather than a join table.
    if (Array.isArray(productIds) && productIds.length > 0) {
      await prisma.product.updateMany({
        where: { storeId, id: { in: productIds.filter((x: unknown) => typeof x === 'string') } },
        data: { category: slug },
      })
    }

    return NextResponse.json({ ok: true, category })
  } catch (err) {
    console.error('[categories:post]', err)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}