import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import CustomersClient from './CustomersClient'

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } },
  })
  if (!store) notFound()

  const customers = await prisma.customer.findMany({
    where: { storeId },
    orderBy: { createdAt: 'desc' },
  })

  return <CustomersClient store={store} customers={customers} />
}