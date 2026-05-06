import { NextRequest, NextResponse } from 'next/server'
import { verifyCustomerToken, COOKIE_NAME } from '@/lib/store-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ customer: null })

  const payload = await verifyCustomerToken(token)
  if (!payload || payload.subdomain !== subdomain) {
    return NextResponse.json({ customer: null })
  }

  const customer = await prisma.storeCustomer.findUnique({
    where: { id: payload.customerId },
    select: { id: true, email: true, name: true, phone: true, createdAt: true },
  })

  return NextResponse.json({ customer })
}
