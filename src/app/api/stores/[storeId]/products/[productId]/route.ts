import { NextRequest, NextResponse } from 'next/server'
import { uniqueProductSlug } from '@/lib/product-slug'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * Loads one product with everything the edit form needs.
 *
 * The edit page gets this server-side, but the visual editor opens the same
 * form in a modal and has to fetch it from the browser.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string; productId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId, productId } = await params

    const store = await prisma.store.findFirst({
      where: { id: storeId, owner: { clerkId } },
      select: { id: true },
    })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Scoped to the store as well as the id: looking up by id alone would hand
    // any store's product to anyone who knew the id.
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId },
      include: {
        store: { select: { subdomain: true } },
        images: { orderBy: { position: 'asc' } },
        variants: {
          orderBy: { position: 'asc' },
          include: { options: { orderBy: { position: 'asc' } } },
        },
      },
    })
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ product })
  } catch (err) {
    console.error('[product:get]', err)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; productId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId, productId } = await params

    const store = await prisma.store.findFirst({
      where: { id: storeId, owner: { clerkId } },
    })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { title, description, price, inventory, status, category, sku, tags, imageUrl, images, variants } = await req.json()

    // Renaming a product re-derives its handle, so the URL keeps matching the
    // title. Old links still resolve because lookups also accept the id.
    const slug = title !== undefined
      ? await uniqueProductSlug(storeId, title, productId)
      : undefined

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(title !== undefined && { title, slug }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(inventory !== undefined && { inventory }),
        ...(status !== undefined && { status }),
        ...(category !== undefined && { category }),
        ...(sku !== undefined && { sku }),
        ...(tags !== undefined && { tags: normalizeTags(tags) }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      },
    })

    if (Array.isArray(images)) {
      await prisma.productImage.deleteMany({ where: { productId } })
      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((url: string, i: number) => ({ productId, url, position: i })),
        })
      }
    }

    if (Array.isArray(variants)) {
      await prisma.productVariant.deleteMany({ where: { productId } })
      for (let vi = 0; vi < variants.length; vi++) {
        const v = variants[vi]
        if (!v.name?.trim()) continue
        const created = await prisma.productVariant.create({
          data: { productId, name: v.name.trim(), position: vi },
        })
        if (Array.isArray(v.options)) {
          const validOptions = (v.options as any[]).filter(o => o.label?.trim())
          if (validOptions.length > 0) {
            await prisma.productVariantOption.createMany({
              data: validOptions.map((o: any, oi: number) => ({
                variantId: created.id,
                label: o.label.trim(),
                priceOverride: o.priceOverride ?? null,
                inventory: o.inventory ?? 0,
                sku: o.sku || null,
                position: oi,
              })),
            })
          }
        }
      }
    }

    return NextResponse.json({ ok: true, product })
  } catch (err) {
    console.error('[product:patch]', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string; productId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId, productId } = await params

    const store = await prisma.store.findFirst({
      where: { id: storeId, owner: { clerkId } },
    })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.orderItem.deleteMany({ where: { productId } })
    await prisma.product.delete({ where: { id: productId } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[product:delete]', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
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
