import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signCustomerToken, COOKIE_NAME } from '@/lib/store-auth'
import { guard } from '@/lib/rate-limit'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const limited = guard(req, 'storefront-login', { windowMs: 60_000, max: 5 })
  if (limited) return limited

  const { subdomain } = await params
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const store = await prisma.store.findUnique({ where: { subdomain } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const customer = await prisma.storeCustomer.findUnique({
    where: { storeId_email: { storeId: store.id, email: email.toLowerCase() } },
  })

  if (!customer || !customer.passwordHash) {
    // No password set (e.g. Google-only account) — same generic error to prevent enumeration
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, customer.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const token = await signCustomerToken({
    customerId: customer.id,
    storeId: store.id,
    subdomain,
    email: customer.email,
    name: customer.name,
  })

  const res = NextResponse.json({
    ok: true,
    customer: { id: customer.id, email: customer.email, name: customer.name },
  })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
