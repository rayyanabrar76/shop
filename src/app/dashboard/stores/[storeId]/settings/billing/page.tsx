import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getActivePlan } from '@/lib/plans'
import BillingClient from './BillingClient'

export const metadata = {
  title: 'Billing — ShopFlow',
}

export default async function BillingPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({
    where: { id: storeId, owner: { clerkId } },
    select: {
      id: true,
      name: true,
      plan: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      stripeCustomerId: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  })
  if (!store) redirect('/dashboard')

  const activePlan = getActivePlan(store)

  return (
    <BillingClient
      storeId={store.id}
      storeName={store.name}
      currentPlan={store.plan}
      activePlanId={activePlan.id}
      subscriptionStatus={store.subscriptionStatus}
      hasStripeCustomer={!!store.stripeCustomerId}
      trialEndsAt={store.trialEndsAt?.toISOString() ?? null}
      currentPeriodEnd={store.currentPeriodEnd?.toISOString() ?? null}
      cancelAtPeriodEnd={store.cancelAtPeriodEnd}
    />
  )
}
