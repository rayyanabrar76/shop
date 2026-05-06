import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string; orderId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId, orderId } = await params

    const store = await prisma.store.findFirst({
      where: { id: storeId, owner: { clerkId } },
    })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    })

    return NextResponse.json({ ok: true, order })
  } catch (err) {
    console.error('[orders:mark-paid]', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}