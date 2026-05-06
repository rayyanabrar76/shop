import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signCustomerToken, COOKIE_NAME } from '@/lib/store-auth'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  const { token, password } = await req.json()

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const store = await prisma.store.findUnique({ where: { subdomain } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const reset = await prisma.storePasswordReset.findUnique({ where: { token } })
  if (!reset || reset.used || reset.storeId !== store.id || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const customer = await prisma.storeCustomer.update({
    where: { storeId_email: { storeId: store.id, email: reset.email } },
    data: { passwordHash },
  })

  await prisma.storePasswordReset.update({ where: { token }, data: { used: true } })

  const authToken = await signCustomerToken({
    customerId: customer.id,
    storeId: store.id,
    subdomain,
    email: customer.email,
    name: customer.name,
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, authToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
