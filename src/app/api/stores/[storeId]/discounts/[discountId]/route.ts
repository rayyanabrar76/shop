import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; discountId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { discountId } = await params
  const { active } = await req.json()
  const discount = await prisma.discountCode.update({
    where: { id: discountId },
    data: { active },
  })
  return NextResponse.json({ discount })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string; discountId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { discountId } = await params
  await prisma.discountCode.delete({ where: { id: discountId } })
  return NextResponse.json({ ok: true })
}
