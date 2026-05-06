import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  const store = await prisma.store.findUnique({ where: { subdomain } })
  if (!store) return NextResponse.json({ rates: [] })
  const rates = await prisma.shippingRate.findMany({
    where: { storeId: store.id },
    orderBy: { price: 'asc' },
  })
  return NextResponse.json({ rates })
}
