import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { PLANS, TRIAL_DAYS, type PlanId } from '@/lib/plans'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId, planId, billing } = (await req.json()) as {
      storeId: string
      planId: PlanId
      billing: 'monthly' | 'yearly'
    }

    if (planId === 'FREE') {
      return NextResponse.json({ error: 'Free plan does not require checkout' }, { status: 400 })
    }
    const planDef = PLANS[planId]
    if (!planDef) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const priceEnvVar = billing === 'yearly' ? planDef.stripePriceIdYearlyEnv : planDef.stripePriceIdMonthlyEnv
    const priceId = process.env[priceEnvVar]
    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price not configured (${priceEnvVar} missing in env)` },
        { status: 500 },
      )
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, owner: { clerkId } },
      include: { owner: true },
    })
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const stripe = getStripe()
    const user = await currentUser()
    const email = user?.emailAddresses?.[0]?.emailAddress ?? store.owner.email

    // Reuse or create platform Stripe customer for this store
    let customerId = store.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { storeId: store.id, ownerId: store.ownerId },
      })
      customerId = customer.id
      await prisma.store.update({
        where: { id: store.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Eligible for trial only on first paid subscription
    const eligibleForTrial = !store.stripeSubscriptionId && !store.trialEndsAt

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/stores/${store.id}/settings/billing?session_id={CHECKOUT_SESSION_ID}&success=1`,
      cancel_url: `${appUrl}/dashboard/stores/${store.id}/settings/billing?canceled=1`,
      subscription_data: {
        ...(eligibleForTrial && { trial_period_days: TRIAL_DAYS }),
        metadata: { storeId: store.id, planId },
      },
      metadata: { storeId: store.id, planId },
      allow_promotion_codes: true,
      automatic_tax: { enabled: false },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[billing:checkout]', err)
    return NextResponse.json({ error: 'Failed to start checkout' }, { status: 500 })
  }
}
