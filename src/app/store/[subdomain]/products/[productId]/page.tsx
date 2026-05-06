import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import StoreBanner from '../../StoreBanner'
import StoreHeader from '../../StoreHeader'
import StoreFooter from '../../StoreFooter'
import CartSidebar from '../../cart-sidebar'
import ProductDetailClient from './ProductDetailClient'
import { ArrowLeft, Package } from 'lucide-react'
import DarkModeSync from '../../DarkModeSync'

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
  if (!store) return <div className="p-10">Store not found</div>

  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: store.id },
    include: {
      images: { orderBy: { position: 'asc' } },
      variants: {
        orderBy: { position: 'asc' },
        include: { options: { orderBy: { position: 'asc' } } },
      },
    },
  })
  if (!product) return <div className="p-10">Product not found</div>

  const theme = store.theme
  const primary = theme?.primaryColor ?? '#6c47ff'
  const radius = theme?.borderRadius ?? '0.75rem'
  const buttonStyle = theme?.buttonStyle ?? 'solid'
  const bg = theme?.backgroundColor ?? '#ffffff'
  const textColor = theme?.textColor ?? '#09090b'
  const font = theme?.font ?? 'sans'

  const related = await prisma.product.findMany({
    where: { storeId: store.id, status: 'active', NOT: { id: productId } },
    take: 4,
    orderBy: { createdAt: 'desc' },
  })

  const allImages = [
    ...(product.imageUrl ? [product.imageUrl] : []),
    ...product.images.map(i => i.url).filter(u => u !== product.imageUrl),
  ]

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--store-bg)',
        color: 'var(--store-text)',
        fontFamily: font === 'serif' ? 'serif' : font === 'mono' ? 'monospace' : 'inherit',
      }}
    >
      <DarkModeSync />
      <StoreBanner theme={theme} />
      <StoreHeader store={store} theme={theme} subdomain={subdomain} />

      <div className="max-w-6xl mx-auto w-full px-6 pt-8 pb-4">
        <Link
          href={`/store/${subdomain}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium opacity-50 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to store
        </Link>
      </div>

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
        />

        {related.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-4 w-1 rounded-full" style={{ backgroundColor: primary }} />
              <h2 className="text-lg font-bold">You may also like</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {related.map(p => (
                <Link key={p.id} href={`/store/${subdomain}/products/${p.id}`} className="group flex flex-col">
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
                  <p className="text-sm font-bold mt-0.5">${(p.price / 100).toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <StoreFooter store={store} theme={theme} />
      <CartSidebar themeStyle={{ primaryColor: primary, borderRadius: radius, buttonStyle }} subdomain={subdomain} />
    </div>
  )
}
