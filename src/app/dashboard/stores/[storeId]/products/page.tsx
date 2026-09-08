import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import ProductsClient from './ProductsClient'

export const metadata = { title: 'Products' }

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } } })
  if (!store) notFound()

  const products = await prisma.product.findMany({
    where: { storeId },
    include: { store: true },
    orderBy: { createdAt: 'desc' },
  })

  // Product.category holds a slug string rather than a foreign key, so the
  // label is resolved against the live categories — a deleted one then reads
  // as "No category" instead of a name that no longer exists.
  const categories = await prisma.category.findMany({
    where: { storeId },
    select: { name: true, slug: true },
  })

  return <ProductsClient storeId={storeId} subdomain={store.subdomain} products={products} categories={categories} />
}