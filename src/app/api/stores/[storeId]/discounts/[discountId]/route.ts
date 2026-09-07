import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStoreOwner } from '@/lib/owner-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; discountId: string }> }
) {
  const { storeId, discountId } = await params
  const denied = await requireStoreOwner(storeId)
  if (denied) return denied

  const { active } = await req.json()

  // Scoped by storeId for the same reason as the shipping rate below it: the
  // id in the URL is the caller's to choose, and owning this store does not
  // make a discount from another one theirs to switch off.
  const { count } = await prisma.discountCode.updateMany({
    where: { id: discountId, storeId },
    data: { active: Boolean(active) },
  })
  if (count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const discount = await prisma.discountCode.findUnique({ where: { id: discountId } })
  return NextResponse.json({ discount })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string; discountId: string }> }
) {
  const { storeId, discountId } = await params
  const denied = await requireStoreOwner(storeId)
  if (denied) return denied

  const { count } = await prisma.discountCode.deleteMany({ where: { id: discountId, storeId } })
  if (count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
