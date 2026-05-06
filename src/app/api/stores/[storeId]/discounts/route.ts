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
  const discounts = await prisma.discountCode.findMany({
    where: { storeId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ discounts })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { storeId } = await params
  const { code, type, value, minOrder, maxUses, expiresAt } = await req.json()

  if (!code || !type || value == null) {
    return NextResponse.json({ error: 'Code, type and value are required' }, { status: 400 })
  }

  const existing = await prisma.discountCode.findUnique({
    where: { storeId_code: { storeId, code: code.toUpperCase() } },
  })
  if (existing) return NextResponse.json({ error: 'A discount with this code already exists' }, { status: 409 })

  const discount = await prisma.discountCode.create({
    data: {
      storeId,
      code: code.toUpperCase().trim(),
      type,
      value: Number(value),
      minOrder: Number(minOrder ?? 0),
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })
  return NextResponse.json({ discount }, { status: 201 })
}
