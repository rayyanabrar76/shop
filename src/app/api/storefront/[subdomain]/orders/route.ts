import { NextRequest, NextResponse } from 'next/server'
import { verifyCustomerToken, COOKIE_NAME } from '@/lib/store-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyCustomerToken(token)
  if (!payload || payload.subdomain !== subdomain) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = await prisma.order.findMany({
    where: { storeId: payload.storeId, customerEmail: payload.email },
    include: {
      items: {
        include: { product: { select: { title: true, imageUrl: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ orders })
}
