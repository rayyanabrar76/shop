import { prisma } from '@/lib/prisma'
import StorefrontClient from './StorefrontClient'

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params

  const store = await prisma.store.findUnique({
    where: { subdomain },
    include: { theme: true },
  })

  if (!store) return <div className="p-10 text-center">Store not found</div>

  const [products, customSections] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: store.id, status: 'active' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customSection.findMany({
      where: { storeId: store.id, pageId: null },
      orderBy: { position: 'asc' },
    }),
  ])

  const t = store.theme

  const initialTheme = {
    primaryColor:    t?.primaryColor    ?? '#6c47ff',
    backgroundColor: t?.backgroundColor ?? '#ffffff',
    footerColor:     t?.footerColor     ?? '#f4f4f5',
    accentColor:     t?.accentColor     ?? '#000000',
    textColor:       t?.textColor       ?? '#09090b',
    borderRadius:    t?.borderRadius    ?? '0.75rem',
    buttonStyle:     t?.buttonStyle     ?? 'solid',
    font:            t?.font            ?? 'sans',
    headingFont:     t?.headingFont     ?? 'sans',
    bannerText:      t?.bannerText      ?? 'Welcome to our store',
    showBanner:      t?.showBanner      ?? true,
    logoUrl:         t?.logoUrl         ?? '',
    logoWidth:       t?.logoWidth       ?? 120,
    footerText:      t?.footerText      ?? '',
    instagramHandle: t?.instagramHandle ?? '',
    twitterHandle:   t?.twitterHandle   ?? '',
    facebookUrl:     t?.facebookUrl     ?? '',
    layout:          t?.layout          ?? 'grid',
    cardShadow:      t?.cardShadow      ?? 'none',
    dividerStyle:    t?.dividerStyle    ?? 'none',
    shopAllLabel:    t?.shopAllLabel    ?? 'Shop All Products',
    featuredLabel:   t?.featuredLabel   ?? 'Featured Products',
    productGridBg:          t?.productGridBg          ?? '#ffffff',
    productGridButtonColor: t?.productGridButtonColor ?? '',
    productGridTextColor:   t?.productGridTextColor   ?? '',
    productGridFont:        t?.productGridFont        ?? '',
    customCss:              t?.customCss              ?? '',
    customHead:             t?.customHead             ?? '',
    navLinks:               (t?.navLinks as any)      ?? null,
    navFontSize:            t?.navFontSize            ?? 14,
    navCase:                t?.navCase                ?? 'normal',
    navDividers:            t?.navDividers            ?? false,
    darkMode:               t?.darkMode               ?? false,
    showDarkToggle:         t?.showDarkToggle         ?? true,
  }

  // Parse hero slides from the JSON field
  const initialHeroSlides = Array.isArray((t as any)?.heroSlides) ? (t as any).heroSlides as any[] : null

  return (
    <StorefrontClient
      store={store}
      products={products}
      initialTheme={initialTheme}
      initialCustomSections={customSections}
      initialHeroSlides={initialHeroSlides}
      subdomain={subdomain}
    />
  )
}