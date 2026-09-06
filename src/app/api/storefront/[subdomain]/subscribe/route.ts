import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/storefront/[subdomain]/subscribe
 * { email } -> { ok: true }
 *
 * Public: shoppers are not signed in. Kept deliberately dull — it stores an
 * address against a store and nothing else.
 */

// Not RFC 5322, and deliberately so: anything stricter rejects real addresses.
// The real check is whether mail to it ever arrives.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(
  req: Request,
  { params }: { params: Promise<{ subdomain: string }> },
) {
  try {
    const { subdomain } = await params

    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email || email.length > 200 || !EMAIL.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    const store = await prisma.store.findUnique({
      where: { subdomain },
      select: { id: true },
    })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Signing up twice is not an error worth showing anyone — the outcome they
    // wanted (being on the list) is true either way.
    await prisma.newsletterSubscriber.upsert({
      where: { storeId_email: { storeId: store.id, email } },
      create: { storeId: store.id, email },
      update: {},
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[subscribe]', err)
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
  }
}
