import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signCustomerToken, COOKIE_NAME } from '@/lib/store-auth'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  const { name, email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const store = await prisma.store.findUnique({ where: { subdomain } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const existing = await prisma.storeCustomer.findUnique({
    where: { storeId_email: { storeId: store.id, email: email.toLowerCase() } },
  })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const customer = await prisma.storeCustomer.create({
    data: {
      storeId: store.id,
      email: email.toLowerCase(),
      passwordHash,
      name: name?.trim() || null,
    },
  })

  // Also create Customer record so they appear in the dashboard
  await prisma.customer.upsert({
    where: { storeId_email: { storeId: store.id, email: email.toLowerCase() } },
    update: {},
    create: { storeId: store.id, email: email.toLowerCase(), name: name?.trim() || null },
  })

  const token = await signCustomerToken({
    customerId: customer.id,
    storeId: store.id,
    subdomain,
    email: customer.email,
    name: customer.name,
  })

  sendWelcomeEmail({ to: customer.email, storeName: store.name, customerName: customer.name, subdomain }).catch(() => {})

  const res = NextResponse.json({ ok: true, customer: { id: customer.id, email: customer.email, name: customer.name } })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
