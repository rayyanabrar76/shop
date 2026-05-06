import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/stores/[storeId]/settings
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await params          // ← await params
    const { name, subdomain } = await req.json()

    // Verify ownership
    const store = await prisma.store.findFirst({
      where: { id: storeId, owner: { clerkId } },
    })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Check subdomain uniqueness (skip if unchanged)
    if (subdomain && subdomain !== store.subdomain) {
      const conflict = await prisma.store.findFirst({
        where: { subdomain, NOT: { id: storeId } },
      })
      if (conflict) {
        return NextResponse.json({ error: 'That subdomain is already taken.' }, { status: 409 })
      }
    }

    const updated = await prisma.store.update({
      where: { id: storeId },
      data: {
        ...(name?.trim()      && { name: name.trim() }),
        ...(subdomain?.trim() && { subdomain: subdomain.trim().toLowerCase() }),
      },
    })

    return NextResponse.json({ ok: true, store: updated })
  } catch (err) {
    console.error('[settings:patch]', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

// DELETE /api/stores/[storeId]/settings
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await params          // ← await params

    // Verify ownership before any destructive action
    const store = await prisma.store.findFirst({
      where: { id: storeId, owner: { clerkId } },
    })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Cascade delete in FK-safe order
    await prisma.orderItem.deleteMany({ where: { order: { storeId } } })
    await prisma.order.deleteMany({ where: { storeId } })
    await prisma.product.deleteMany({ where: { storeId } })
    await prisma.customer.deleteMany({ where: { storeId } })
    await prisma.storeTheme.deleteMany({ where: { storeId } })
    await prisma.store.delete({ where: { id: storeId } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[settings:delete]', err)
    return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 })
  }
}