import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  const { code, subtotal } = await req.json()

  if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 })

  const store = await prisma.store.findUnique({ where: { subdomain } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const discount = await prisma.discountCode.findUnique({
    where: { storeId_code: { storeId: store.id, code: code.toUpperCase() } },
  })

  if (!discount || !discount.active) {
    return NextResponse.json({ error: 'Invalid or inactive discount code' }, { status: 400 })
  }
  if (discount.expiresAt && discount.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This discount code has expired' }, { status: 400 })
  }
  if (discount.maxUses && discount.usedCount >= discount.maxUses) {
    return NextResponse.json({ error: 'This discount code has reached its usage limit' }, { status: 400 })
  }
  if (subtotal < discount.minOrder) {
    return NextResponse.json({
      error: `Minimum order of $${(discount.minOrder / 100).toFixed(2)} required`,
    }, { status: 400 })
  }

  const discountAmount = discount.type === 'percentage'
    ? Math.round(subtotal * discount.value / 100)
    : Math.min(discount.value, subtotal)

  return NextResponse.json({ ok: true, discountAmount, code: discount.code, type: discount.type, value: discount.value })
}
