import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStoreOwner } from '@/lib/owner-auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params
  const denied = await requireStoreOwner(storeId)
  if (denied) return denied

  const rates = await prisma.shippingRate.findMany({
    where: { storeId },
    orderBy: { price: 'asc' },
  })
  return NextResponse.json({ rates })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params
  const denied = await requireStoreOwner(storeId)
  if (denied) return denied

  const { name, price, minOrder, estimatedDays } = await req.json()
  if (!name || price == null) {
    return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
  }

  // Money arrives as an integer of minor units. A negative one would subtract
  // from the order total at checkout, so it is floored at zero rather than
  // trusted; a non-numeric one would land in the column as NaN.
  const cents = Math.max(0, Math.round(Number(price)))
  const floor = Math.max(0, Math.round(Number(minOrder ?? 0)))
  if (!Number.isFinite(cents) || !Number.isFinite(floor)) {
    return NextResponse.json({ error: 'Price must be a number' }, { status: 400 })
  }

  const rate = await prisma.shippingRate.create({
    data: {
      storeId,
      name: String(name).trim().slice(0, 80),
      price: cents,
      minOrder: floor,
      estimatedDays: estimatedDays?.trim()?.slice(0, 40) || null,
    },
  })
  return NextResponse.json({ rate }, { status: 201 })
}
