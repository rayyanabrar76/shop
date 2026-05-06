import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendPasswordReset } from '@/lib/email'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  const { email } = await req.json()

  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const store = await prisma.store.findUnique({ where: { subdomain } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const customer = await prisma.storeCustomer.findUnique({
    where: { storeId_email: { storeId: store.id, email: email.toLowerCase() } },
  })

  // Always return success to prevent email enumeration
  if (customer) {
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    await prisma.storePasswordReset.create({
      data: { storeId: store.id, email: customer.email, token, expiresAt },
    })

    await sendPasswordReset({ to: customer.email, storeName: store.name, subdomain, token }).catch(() => {})
  }

  return NextResponse.json({ ok: true, message: 'If that email exists, a reset link has been sent.' })
}
