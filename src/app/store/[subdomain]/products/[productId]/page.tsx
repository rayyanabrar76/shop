import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import StoreBanner from '../../StoreBanner'
import StoreHeader from '../../StoreHeader'
import StoreFooter from '../../StoreFooter'
import CartSidebar from '../../cart-sidebar'
import ProductDetailClient from './ProductDetailClient'
import ProductReviews from './ProductReviews'
import { Package } from 'lucide-react'
import ThemeSync from '../../ThemeSync'
import { formatPrice } from '@/lib/currency'

import type { Metadata } from 'next'
import { storeUrl } from '@/lib/config'

/**
 * Per-product metadata. Without this every product page inherited the store's
 * generic title, so search results showed the same headline for all of them.
 *
 * The canonical points at one absolute URL, because the same product is
 * reachable three ways — subdomain, /store/<sub>/ path, and by id — which
 * otherwise reads as duplicate content competing with itself.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; productId: string }>
}): Promise<Metadata> {
  const { subdomain, productId } = await params

  const store = await prisma.store.findUnique({
    where: { subdomain },
    select: { id: true, name: true },
  })
  if (!store) return { title: 'Product not found' }

  const product = await prisma.product.findFirst({
    where: { storeId: store.id, OR: [{ slug: productId }, { id: productId }] },
    select: {
      title: true, description: true, imageUrl: true, slug: true, id: true, tags: true,
      seoTitle: true, seoDescription: true, imageAlt: true,
    },
  })
  if (!product) return { title: 'Product not found' }

  // The overrides win where set; otherwise the page's own copy stands in.
  // A merchant writes a product title for the page, not for a result list,
  // and the two are not always the same sentence.
  const seoTitle = product.seoTitle?.trim() || product.title
  const description =
    product.seoDescription?.trim() ||
    product.description?.trim().slice(0, 160) ||
    `Buy ${product.title} from ${store.name}.`
  const canonical = storeUrl(subdomain, `/products/${product.slug || product.id}`)

  return {
    // The layout's title template appends the store name.
    title: seoTitle,
    description,
    ...(product.tags.length > 0 ? { keywords: product.tags } : {}),
    alternates: { canonical },
    openGraph: {
      title: seoTitle,
      description,
      url: canonical,
      type: 'website',
      siteName: store.name,
      ...(product.imageUrl ? { images: [{ url: product.imageUrl }] } : {}),
    },
    twitter: {
      card: product.imageUrl ? 'summary_large_image' : 'summary',
      title: seoTitle,
      description,
      ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
    },
  }
}

export default async function StoreProductPage({
  params,
}: {
  params: Promise<{ subdomain: string; productId: string }>
}) {
  const { subdomain, productId } = await params

  const store = await prisma.store.findUnique({
    where: { subdomain },
    include: { theme: true },
  })
  if (!store) notFound()

  // The route param is a slug now, but old links (and anything already indexed)
  // still carry a cuid, so accept either.
  const product = await prisma.product.findFirst({
    where: {
      storeId: store.id,
      OR: [{ slug: productId }, { id: productId }],
    },
    include: {
      images: { orderBy: { position: 'asc' } },
      variants: {
        orderBy: { position: 'asc' },
        include: { options: { orderBy: { position: 'asc' } } },
      },
    },
  })
  if (!product) notFound()

  const theme = store.theme
  const headerTheme = theme ? { ...theme, navLinks: (theme.navLinks as any) ?? null } : null
  const primary = theme?.primaryColor ?? '#0a0a0a'
  const radius = theme?.borderRadius ?? '0.75rem'
  const buttonStyle = theme?.buttonStyle ?? 'solid'
  const textColor = theme?.textColor ?? '#09090b'
  const font = theme?.font ?? 'sans'

  // Published only. A pending review is not visible to shoppers, so it must
  // not count toward the rating Google is shown either.
  const reviews = await prisma.productReview.findMany({
    where: { productId: product.id, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, authorName: true, rating: true, title: true,
      body: true, verified: true, createdAt: true, reply: true,
    },
  })
  const ratingCount = reviews.length
  const ratingAverage = ratingCount
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount
    : 0

  // The cheapest option the shop actually offers, so the product page can
  // answer "how does it get to me" instead of leaving it to the checkout.
  const rates = await prisma.shippingRate.findMany({
    where: { storeId: store.id },
    orderBy: { price: 'asc' },
    take: 1,
    select: { name: true, price: true, estimatedDays: true, minOrder: true },
  })
  const cheapest = rates[0] ?? null
  const shipping = cheapest
    ? {
        label: cheapest.price === 0
          ? (cheapest.minOrder > 0 ? `Free delivery over ${formatPrice(cheapest.minOrder, store.currency)}` : 'Free delivery')
          : `${cheapest.name} · ${formatPrice(cheapest.price, store.currency)}`,
        detail: cheapest.estimatedDays ? `Usually ${cheapest.estimatedDays}` : 'Calculated at checkout',
      }
    : null

  const related = await prisma.product.findMany({
    where: { storeId: store.id, status: 'active', NOT: { id: productId } },
    take: 4,
    orderBy: { createdAt: 'desc' },
  })

  // Each image travels with its own description. Where none was written,
  // the product title is a better fallback than nothing at all, though it
  // is the alt field that actually helps image search.
  const allImages = [
    ...(product.imageUrl ? [{ url: product.imageUrl, alt: product.imageAlt || product.title }] : []),
    ...product.images
      .filter(i => i.url !== product.imageUrl)
      .map(i => ({ url: i.url, alt: i.alt || product.title })),
  ]

  // Product structured data — what puts price and availability into a Google
  // rich result rather than a plain blue link. Prices are stored as minor
  // units, so divide by 100 for schema.org, which expects a decimal amount.
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    ...(product.description ? { description: product.description } : {}),
    // schema.org needs absolute URLs; uploads are stored as site-relative paths.
    ...(allImages.length
      ? { image: allImages.map(i => (i.url.startsWith('http') ? i.url : storeUrl(subdomain, i.url))) }
      : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    brand: { '@type': 'Brand', name: store.name },
    // Only when there are real, published reviews rendered on this page.
    // Marking up a rating a visitor cannot see is a structured data
    // violation, and an invented one is worse than none.
    ...(ratingCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: (Math.round(ratingAverage * 10) / 10).toFixed(1),
            reviewCount: ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews.slice(0, 10).map(r => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.authorName },
            datePublished: r.createdAt.toISOString().slice(0, 10),
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
            ...(r.title ? { name: r.title } : {}),
            ...(r.body ? { reviewBody: r.body } : {}),
          })),
        }
      : {}),
    offers: {
      '@type': 'Offer',
      price: (product.price / 100).toFixed(2),
      priceCurrency: store.currency,
      availability:
        product.inventory > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: storeUrl(subdomain, `/products/${product.slug || product.id}`),
    },
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--store-bg)',
        color: 'var(--store-text)',
        fontFamily: font === 'serif' ? 'serif' : font === 'mono' ? 'monospace' : 'inherit',
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ThemeSync />
      <StoreBanner theme={theme} />
      <StoreHeader store={store} theme={headerTheme} subdomain={subdomain} />

      <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto w-full px-6 pt-6 pb-4">
        <ol className="flex items-center gap-1.5 text-[12.5px] min-w-0">
          <li className="shrink-0">
            <Link href={`/store/${subdomain}`} className="opacity-50 hover:opacity-100 transition-opacity">Home</Link>
          </li>
          <li aria-hidden className="opacity-25">/</li>
          <li className="shrink-0">
            <Link href={`/store/${subdomain}/products`} className="opacity-50 hover:opacity-100 transition-opacity">Products</Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden className="opacity-25">/</li>
              <li className="shrink-0 min-w-0">
                <Link
                  href={`/store/${subdomain}/products?category=${encodeURIComponent(product.category)}`}
                  className="opacity-50 hover:opacity-100 transition-opacity truncate block"
                >
                  {product.category}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden className="opacity-25">/</li>
          <li className="min-w-0 font-medium truncate">{product.title}</li>
        </ol>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pb-16">
        <ProductDetailClient
          product={{
            id: product.id,
            title: product.title,
            description: product.description,
            price: product.price,
            inventory: product.inventory,
            imageUrl: product.imageUrl,
            sku: product.sku,
            category: product.category,
            images: allImages,
            variants: product.variants.map(v => ({
              id: v.id,
              name: v.name,
              options: v.options.map(o => ({
                id: o.id,
                label: o.label,
                priceOverride: o.priceOverride,
                inventory: o.inventory,
              })),
            })),
          }}
          theme={{ primary, radius, buttonStyle, textColor }}
          rating={ratingCount > 0 ? { average: ratingAverage, count: ratingCount } : undefined}
          shipping={shipping}
        />

        <ProductReviews
          subdomain={subdomain}
          productSlug={product.slug || product.id}
          average={ratingAverage}
          theme={{ primary, radius, textColor }}
          reviews={reviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))}
        />

        {related.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-4 w-1 rounded-full" style={{ backgroundColor: primary }} />
              <h2 className="text-lg font-bold">You may also like</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {related.map(p => (
                <Link key={p.id} href={`/store/${subdomain}/products/${p.slug || p.id}`} className="group flex flex-col">
                  <div className="w-full bg-zinc-100 overflow-hidden mb-3" style={{ borderRadius: radius, aspectRatio: '1 / 1' }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold group-hover:underline line-clamp-1">{p.title}</p>
                  <p className="text-sm font-bold mt-0.5">{formatPrice(p.price, store.currency)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <StoreFooter store={store} theme={theme} subdomain={subdomain} />
      <CartSidebar themeStyle={{ primaryColor: primary, borderRadius: radius, buttonStyle }} subdomain={subdomain} />
    </div>
  )
}
