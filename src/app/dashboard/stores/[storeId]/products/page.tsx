import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductsClient from './ProductsClient'

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params

  const store = await prisma.store.findUnique({ where: { id: storeId } })
  if (!store) notFound()

  const products = await prisma.product.findMany({
    where: { storeId },
    include: { store: true },
    orderBy: { createdAt: 'desc' },
  })

  return <ProductsClient storeId={storeId} subdomain={store.subdomain} products={products} />
}