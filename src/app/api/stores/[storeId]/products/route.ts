import { auth } from '@clerk/nextjs/server'
import { uniqueProductSlug } from '@/lib/product-slug'
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
    // category is needed by the category form to work out which products
    // are already filed under it — membership lives on the product.
    select: { id: true, title: true, imageUrl: true, status: true, category: true },
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
    tags,
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

  const slug = await uniqueProductSlug(storeId, title)

  const product = await prisma.product.create({
    data: {
      storeId,
      title,
      slug,
      description,
      price,
      inventory: inventory ?? 0,
      imageUrl: imageUrl ?? null,
      category: category ?? null,
      sku: sku ?? null,
      status: status ?? 'active',
      tags: normalizeTags(tags),
    },
  })

  return NextResponse.json({ ...product, subdomain: store.subdomain })
}

/** Tags arrive from the form or the AI assistant; keep them lowercase and unique. */
function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  for (const t of input) {
    if (typeof t !== 'string') continue
    const tag = t.trim().toLowerCase()
    if (tag) seen.add(tag)
  }
  return [...seen].slice(0, 20)
}
