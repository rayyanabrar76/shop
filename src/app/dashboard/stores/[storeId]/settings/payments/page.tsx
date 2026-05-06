import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PaymentSettingsClient from './PaymentSettingsClient'

export default async function PaymentSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params

  const store = await prisma.store.findUnique({
    where: { id: storeId },
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