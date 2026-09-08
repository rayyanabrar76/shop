import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import SettingsClient from './SettingsClient'

export const metadata = { title: 'Settings' }

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } },
    include: { theme: true },
  })

  if (!store) notFound()

  // Currency is locked after the first order — see the PATCH handler for why.
  const orderCount = await prisma.order.count({ where: { storeId } })

  return <SettingsClient store={store} orderCount={orderCount} />
}