import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import CategoriesClient from './CategoriesClient'

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } } })
  if (!store) notFound()

  const categories = await prisma.category.findMany({
    where: { storeId },
    orderBy: { createdAt: 'desc' },
  })

  // Count products per category by matching the category name string
  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const count = await prisma.product.count({
        where: { storeId, category: cat.name },
      })
      return { ...cat, _count: { products: count } }
    })
  )

  return <CategoriesClient storeId={storeId} categories={categoriesWithCount} />
}