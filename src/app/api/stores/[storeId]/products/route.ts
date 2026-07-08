import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { loadStoreEntitlements, assertProductLimit } from '@/lib/entitlements'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storeId } = await params
  const products = await prisma.product.findMany({
    where: { storeId },
    select: { id: true, title: true, imageUrl: true, status: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(products)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storeId } = await params
  const {
    title,
    description,
    price,
    inventory,
    imageUrl,
    category,
    sku,
    status,
  } = await req.json()

  if (!title || !price) {
    return NextResponse.json({ error: 'Title and price are required' }, { status: 400 })
  }

  const ent = await loadStoreEntitlements(storeId, userId)
  if (!ent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limitErr = await assertProductLimit(storeId, ent.plan)
  if (limitErr) return limitErr

  const store = await prisma.store.findUnique({ where: { id: storeId } })
  if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const product = await prisma.product.create({
    data: {
      storeId,
      title,
      description,
      price,
      inventory: inventory ?? 0,
      imageUrl: imageUrl ?? null,
      category: category ?? null,
      sku: sku ?? null,
      status: status ?? 'active',
    },
  })

  return NextResponse.json({ ...product, subdomain: store.subdomain })
}