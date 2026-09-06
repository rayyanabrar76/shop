import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import CategoryFormPage from '../CategoryFormPage'

export default async function NewCategoryPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  // Same ownership check as the rest of the dashboard.
  const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } } })
  if (!store) notFound()

  return <CategoryFormPage storeId={storeId} subdomain={store.subdomain} />
}
