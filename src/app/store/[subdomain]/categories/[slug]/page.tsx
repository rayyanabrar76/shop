import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { storeUrl } from '@/lib/config'
import ProductsPage from '../../products/page'

/**
 * Clean category URLs: /categories/glazed rather than /products?category=glazed.
 *
 * A query string is crawlable but weak — it reads as a filtered view of one
 * page rather than a page in its own right. This renders the same listing the
 * products page does, so there is one implementation behind both.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>
}): Promise<Metadata> {
  const { subdomain, slug } = await params

  const store = await prisma.store.findUnique({
    where: { subdomain },
    select: { id: true, name: true },
  })
  if (!store) return { title: 'Not found' }

  const category = await prisma.category.findFirst({
    where: { storeId: store.id, slug, visible: true },
    select: { name: true, description: true, imageUrl: true },
  })
  if (!category) return { title: 'Category not found' }

  const description =
    category.description?.trim().slice(0, 160) ||
    `Browse ${category.name} at ${store.name}.`
  const canonical = storeUrl(subdomain, `/categories/${slug}`)

  return {
    title: category.name,
    description,
    alternates: { canonical },
    openGraph: {
      title: category.name,
      description,
      url: canonical,
      siteName: store.name,
      type: 'website',
      ...(category.imageUrl ? { images: [{ url: category.imageUrl }] } : {}),
    },
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string; slug: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { subdomain, slug } = await params
  const { q, page } = await searchParams

  const store = await prisma.store.findUnique({
    where: { subdomain },
    select: { id: true },
  })
  if (!store) notFound()

  const category = await prisma.category.findFirst({
    where: { storeId: store.id, slug, visible: true },
    select: { id: true },
  })
  if (!category) notFound()

  // Delegate to the products listing with the category applied — server
  // components are plain async functions, so there is nothing to duplicate.
  return ProductsPage({
    params: Promise.resolve({ subdomain }),
    searchParams: Promise.resolve({ category: slug, q, page }),
  })
}
