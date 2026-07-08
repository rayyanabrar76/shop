import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = (await req.json()) as { storeId: string }

    const store = await prisma.store.findFirst({
      where: { id: storeId, owner: { clerkId } },
      select: { id: true, stripeCustomerId: true },
    })
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    if (!store.stripeCustomerId) {
      return NextResponse.json({ error: 'No billing account yet — start a subscription first.' }, { status: 400 })
    }

    const stripe = getStripe()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: store.stripeCustomerId,
      return_url: `${appUrl}/dashboard/stores/${store.id}/settings/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[billing:portal]', err)
    return NextResponse.json({ error: 'Failed to open portal' }, { status: 500 })
  }
}
