import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import StoreBanner from '../../store/[subdomain]/StoreBanner'
import StoreHeader from '../../store/[subdomain]/StoreHeader'
import StoreHero from '../../store/[subdomain]/StoreHero'
import ProductGrid from '../../store/[subdomain]/ProductGrid'
import StoreFooter from '../../store/[subdomain]/StoreFooter'
import CartSidebar from '../../store/[subdomain]/cart-sidebar'

export default async function CustomDomainPage({
  params,
}: {
  params: Promise<{ domain: string }>
}) {
  const { domain } = await params

  // Look up store by custom domain
  const store = await prisma.store.findFirst({
    where: { customDomain: domain },
    include: { theme: true },
  })

  if (!store) notFound()

  const products = await prisma.product.findMany({
    where: { storeId: store.id, status: 'active' },
    orderBy: { createdAt: 'desc' },
  })

  const themeStyle = {
    primaryColor: store.theme?.primaryColor ?? '#6c47ff',
    backgroundColor: store.theme?.backgroundColor ?? '#ffffff',
    footerColor: store.theme?.footerColor ?? '#f4f4f5',
    accentColor: store.theme?.accentColor ?? '#000000',
    textColor: store.theme?.textColor ?? '#09090b',
    borderRadius: store.theme?.borderRadius ?? '0.75rem',
    buttonStyle: store.theme?.buttonStyle ?? 'solid',
    font: store.theme?.font ?? 'sans',
    headingFont: store.theme?.headingFont ?? 'sans',
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: themeStyle.backgroundColor,
        color: themeStyle.textColor,
      }}
    >
      <StoreBanner theme={store.theme} />
      <StoreHeader store={store} theme={store.theme} subdomain={store.subdomain} />
      <StoreHero theme={store.theme} storeName={store.name} storeId={store.id} />
      <ProductGrid
        products={products}
        theme={store.theme}
        subdomain={store.subdomain}
        themeStyle={themeStyle}
      />
      <StoreFooter store={store} theme={store.theme} />
      <CartSidebar
        themeStyle={{
          primaryColor: themeStyle.primaryColor,
          borderRadius: themeStyle.borderRadius,
          buttonStyle: themeStyle.buttonStyle,
        }}
        subdomain={store.subdomain}
      />
    </div>
  )
}