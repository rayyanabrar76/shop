import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

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

    const { title, description, price, inventory, status, category, sku, imageUrl, images, variants } = await req.json()

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(inventory !== undefined && { inventory }),
        ...(status !== undefined && { status }),
        ...(category !== undefined && { category }),
        ...(sku !== undefined && { sku }),
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
