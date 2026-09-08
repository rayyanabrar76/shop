import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import CategoriesClient from './CategoriesClient'

export const metadata = { title: 'Categories' }

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

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' } }),
    // Every product once, grouped below — one query beats one per category.
    prisma.product.findMany({
      where: { storeId },
      select: { id: true, title: true, imageUrl: true, price: true, status: true, category: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Product.category is a plain string with no foreign key. New rows hold the
  // slug, rows saved by an older form hold the name — match either, or a
  // category shows 0 products while clearly containing some.
  const categoriesWithProducts = categories.map(cat => {
    const mine = products.filter(p => p.category === cat.slug || p.category === cat.name)
    return { ...cat, products: mine, _count: { products: mine.length } }
  })

  return (
    <CategoriesClient
      storeId={storeId}
      categories={categoriesWithProducts}
      allProducts={products}
      currency={store.currency}
      subdomain={store.subdomain}
    />
  )
}
