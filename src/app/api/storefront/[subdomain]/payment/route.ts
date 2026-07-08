import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public route — returns payment config WITHOUT secret keys
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params

    const store = await prisma.store.findUnique({
      where: { subdomain },
      include: { payment: true },
    })

    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const payment = store.payment ? {
      codEnabled: store.payment.codEnabled,
      stripeEnabled: store.payment.stripeEnabled,
      taxEnabled: store.payment.taxEnabled,
      taxRate: store.payment.taxRate,
      taxName: store.payment.taxName,
    } : null

    return NextResponse.json({ storeId: store.id, payment })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}