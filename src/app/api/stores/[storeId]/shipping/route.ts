import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { storeId } = await params
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
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { storeId } = await params
  const { name, price, minOrder, estimatedDays } = await req.json()
  if (!name || price == null) return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
  const rate = await prisma.shippingRate.create({
    data: {
      storeId,
      name: name.trim(),
      price: Number(price),
      minOrder: Number(minOrder ?? 0),
      estimatedDays: estimatedDays?.trim() || null,
    },
  })
  return NextResponse.json({ rate }, { status: 201 })
}
