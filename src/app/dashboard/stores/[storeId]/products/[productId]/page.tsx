import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import ProductEditClient from './ProductEditClient'

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ storeId: string; productId: string }>
}) {
  const { storeId, productId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  // The store must belong to the signed-in user...
  const store = await prisma.store.findFirst({
    where: { id: storeId, owner: { clerkId } },
    select: { id: true },
  })
  if (!store) notFound()

  const [product, categories] = await Promise.all([
    // ...and the product must belong to that store. Looking it up by id alone
    // would serve any store's product to anyone who knew the id.
    prisma.product.findFirst({
      where: { id: productId, storeId },
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
