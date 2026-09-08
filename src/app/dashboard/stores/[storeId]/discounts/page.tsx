import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import DiscountsClient from './DiscountsClient'

export const metadata = { title: 'Discounts & shipping' }

export default async function DiscountsPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')
  const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } } })
  if (!store) notFound()

  const [discounts, shippingRates] = await Promise.all([
    prisma.discountCode.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' } }),
    prisma.shippingRate.findMany({ where: { storeId }, orderBy: { price: 'asc' } }),
  ])

  return <DiscountsClient storeId={storeId} discounts={discounts} shippingRates={shippingRates} />
}
