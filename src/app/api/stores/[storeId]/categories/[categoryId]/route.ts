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
    const { name, slug, visible, description, imageUrl, productIds } = await req.json()

    const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } } })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const existing = await prisma.category.findFirst({
      where: { id: categoryId, storeId },
      select: { slug: true, name: true },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

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
    if (description !== undefined) updateData.description = description?.trim() || null
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || null

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
    })

    // Products reference the category by slug string, so a renamed slug would
    // otherwise orphan every product still pointing at the old one.
    if (updateData.slug && updateData.slug !== existing.slug) {
      await prisma.product.updateMany({
        where: { storeId, category: { in: [existing.slug, existing.name] } },
        data: { category: updateData.slug },
      })
    }

    // Replacing the membership: clear whoever points here now, then set the
    // new list. Matches on the old name too, for rows an earlier form wrote.
    if (Array.isArray(productIds)) {
      const finalSlug = category.slug
      await prisma.product.updateMany({
        where: { storeId, category: { in: [finalSlug, existing.slug, existing.name] } },
        data: { category: null },
      })
      const ids = productIds.filter((x: unknown) => typeof x === 'string')
      if (ids.length > 0) {
        await prisma.product.updateMany({
          where: { storeId, id: { in: ids } },
          data: { category: finalSlug },
        })
      }
    }

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

    const category = await prisma.category.findFirst({
      where: { id: categoryId, storeId },
      select: { slug: true, name: true },
    })
    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Clear the category off its products first. Product.category is a plain
    // string holding the slug, not a foreign key, so this matched the category
    // *id* before and silently updated nothing — leaving products labelled with
    // a category that no longer existed. Name is matched too, because an older
    // version of the create form saved the name instead of the slug.
    await prisma.product.updateMany({
      where: { storeId, category: { in: [category.slug, category.name] } },
      data: { category: null },
    })

    // Shop-by-category sections store a comma-separated id list, so a deleted
    // category would otherwise linger there — the picker counting a selection
    // that no longer resolves to anything.
    const sections = await prisma.customSection.findMany({
      where: { storeId, categoryIds: { contains: categoryId } },
      select: { id: true, categoryIds: true },
    })
    for (const section of sections) {
      const kept = section.categoryIds
        .split(',')
        .map(x => x.trim())
        .filter(x => x && x !== categoryId)
      await prisma.customSection.update({
        where: { id: section.id },
        data: { categoryIds: kept.join(',') },
      })
    }

    await prisma.category.delete({ where: { id: categoryId } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[categories:delete]', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}