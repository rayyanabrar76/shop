import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import CategoriesClient from './CategoriesClient'

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params

  const store = await prisma.store.findUnique({ where: { id: storeId } })
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