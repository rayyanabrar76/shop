import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import PaymentSettingsClient from './PaymentSettingsClient'

export default async function PaymentSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } },
    include: { payment: true },
  })
  if (!store) notFound()

  return (
    <PaymentSettingsClient
      storeId={storeId}
      initial={store.payment ? {
        codEnabled: store.payment.codEnabled,
        stripeAccountId: store.payment.stripeAccountId,
        stripeEnabled: store.payment.stripeEnabled,
        taxEnabled: store.payment.taxEnabled,
        taxRate: store.payment.taxRate,
        taxName: store.payment.taxName,
      } : null}
    />
  )
}