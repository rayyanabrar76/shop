import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import CategoryFormPage from '../CategoryFormPage'

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ storeId: string; categoryId: string }>
}) {
  const { storeId, categoryId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } } })
  if (!store) notFound()

  // Scoped to the store as well as the id, so knowing an id is not enough to
  // open someone else's category.
  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId },
    select: { id: true, name: true, slug: true, description: true, imageUrl: true },
  })
  if (!category) notFound()

  return <CategoryFormPage storeId={storeId} subdomain={store.subdomain} category={category} />
}
