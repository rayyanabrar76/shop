import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import CustomersClient from './CustomersClient'

export const metadata = { title: 'Customers' }

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { storeId } = await params
  // The admin search lands here with ?q=<email> to open on one customer.
  const { q } = await searchParams
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } },
  })
  if (!store) notFound()

  const customers = await prisma.customer.findMany({
    where: { storeId },
    orderBy: { createdAt: 'desc' },
  })

  return <CustomersClient store={store} customers={customers} initialSearch={q ?? ''} />
}