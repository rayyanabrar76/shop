import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductEditClient from './ProductEditClient'

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ storeId: string; productId: string }>
}) {
  const { storeId, productId } = await params

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: true,
        images: { orderBy: { position: 'asc' } },
        variants: {
          orderBy: { position: 'asc' },
          include: { options: { orderBy: { position: 'asc' } } },
        },
      },
    }),
    prisma.category.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!product) notFound()

  return (
    <ProductEditClient
      storeId={storeId}
      product={product}
      categories={categories}
    />
  )
}
