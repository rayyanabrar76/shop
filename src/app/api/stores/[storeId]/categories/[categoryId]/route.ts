// src/app/api/stores/[storeId]/categories/[categoryId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/stores/[storeId]/categories/[categoryId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; categoryId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId, categoryId } = await params
    const { name, slug, visible } = await req.json()

    const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } } })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (slug !== undefined) {
      const conflict = await prisma.category.findFirst({
        where: { storeId, slug, NOT: { id: categoryId } },
      })
      if (conflict) return NextResponse.json({ error: 'Slug already in use.' }, { status: 409 })
      updateData.slug = slug
    }
    if (visible !== undefined) updateData.visible = visible

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
    })

    return NextResponse.json({ ok: true, category })
  } catch (err) {
    console.error('[categories:patch]', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE /api/stores/[storeId]/categories/[categoryId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string; categoryId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId, categoryId } = await params

    const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } } })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Nullify category on products before deleting
    await prisma.product.updateMany({
      where: { storeId, category: { equals: categoryId } },
      data: { category: null },
    })

    await prisma.category.delete({ where: { id: categoryId } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[categories:delete]', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}