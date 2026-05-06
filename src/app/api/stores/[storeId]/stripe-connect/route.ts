import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await params

    const store = await prisma.store.findFirst({
      where: { id: storeId, owner: { clerkId } },
      include: { payment: true },
    })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    })

    let accountId = store.payment?.stripeAccountId

    // Create a new Express account if not already created
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        metadata: { storeId },
      })
      accountId = account.id

      await prisma.storePayment.upsert({
        where: { storeId },
        create: { storeId, stripeAccountId: account.id, stripeEnabled: false },
        update: { stripeAccountId: account.id },
      })
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stores/${storeId}/settings/payments?stripe=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stores/${storeId}/stripe-connect/callback`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err) {
    console.error('[stripe-connect:post]', err)
    return NextResponse.json({ error: 'Failed to create connect link' }, { status: 500 })
  }
}