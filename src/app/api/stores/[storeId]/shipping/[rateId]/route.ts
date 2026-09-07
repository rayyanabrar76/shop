import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStoreOwner } from '@/lib/owner-auth'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string; rateId: string }> }
) {
  const { storeId, rateId } = await params
  const denied = await requireStoreOwner(storeId)
  if (denied) return denied

  // deleteMany, scoped by storeId: delete({ where: { id } }) would remove a
  // rate belonging to somebody else's store if its id were passed here, since
  // owning *this* store says nothing about owning that row.
  const { count } = await prisma.shippingRate.deleteMany({ where: { id: rateId, storeId } })
  if (count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
