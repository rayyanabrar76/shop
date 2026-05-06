import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import CustomersClient from './CustomersClient'

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params

  const store = await prisma.store.findUnique({
    where: { id: storeId },
  })
  if (!store) notFound()

  const customers = await prisma.customer.findMany({
    where: { storeId },
    orderBy: { createdAt: 'desc' },
  })

  return <CustomersClient store={store} customers={customers} />
}