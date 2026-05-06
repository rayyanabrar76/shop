import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import DiscountsClient from './DiscountsClient'

export default async function DiscountsPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const store = await prisma.store.findUnique({ where: { id: storeId } })
  if (!store) notFound()

  const [discounts, shippingRates] = await Promise.all([
    prisma.discountCode.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' } }),
    prisma.shippingRate.findMany({ where: { storeId }, orderBy: { price: 'asc' } }),
  ])

  return <DiscountsClient storeId={storeId} discounts={discounts} shippingRates={shippingRates} />
}
