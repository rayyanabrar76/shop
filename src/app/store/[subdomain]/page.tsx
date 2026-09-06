import { prisma } from '@/lib/prisma'
import StorefrontClient from './StorefrontClient'
import { getActivePlan } from '@/lib/plans'

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

  const [products, customSections, categoryRows] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: store.id, status: 'active' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customSection.findMany({
      where: { storeId: store.id, pageId: null },
      orderBy: { position: 'asc' },
    }),
    prisma.category.findMany({
      where: { storeId: store.id, visible: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, slug: true, imageUrl: true },
    }),
  ])

  // Product.category holds the slug, so each category borrows the newest
  // matching product's image as its tile. Falls back to no image.
  const categories = categoryRows.map(c => ({
    ...c,
    imageUrl: c.imageUrl || products.find(p => p.category === c.slug || p.category === c.name)?.imageUrl || null,
    count: products.filter(p => p.category === c.slug || p.category === c.name).length,
  }))

  const t = store.theme

  const initialTheme = {
    primaryColor:    t?.primaryColor    ?? '#0a0a0a',
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
    logoHeight:       t?.logoHeight       ?? 48,
    headerLayout:       t?.headerLayout       ?? 'left',
    menuPosition: t?.menuPosition ?? 'auto',
    headerWidth: t?.headerWidth ?? 'page',
    headerHeight: t?.headerHeight ?? 'standard',
    headerSticky: t?.headerSticky ?? true,
    headerBorderWidth: t?.headerBorderWidth ?? 1,
    headerBgColor: t?.headerBgColor ?? '',
    headerTextColor: t?.headerTextColor ?? '',
    utilityStyle: t?.utilityStyle ?? 'icons',
    headerTransparent: t?.headerTransparent ?? false,
    headerInverseLogoUrl: t?.headerInverseLogoUrl ?? '',
    headerTransparentText: t?.headerTransparentText ?? '#ffffff',
    footerText:      t?.footerText      ?? '',
    cartBtnBgColor: t?.cartBtnBgColor ?? '',
    cartBtnFontSize: t?.cartBtnFontSize ?? 10,
    cartBtnLabel: t?.cartBtnLabel ?? '',
    cartBtnPaddingBottom: t?.cartBtnPaddingBottom ?? 5,
    cartBtnPaddingLeft: t?.cartBtnPaddingLeft ?? 0,
    cartBtnPaddingRight: t?.cartBtnPaddingRight ?? 0,
    cartBtnPaddingTop: t?.cartBtnPaddingTop ?? 5,
    cartBtnShowIcon: t?.cartBtnShowIcon ?? true,
    cartBtnTextColor: t?.cartBtnTextColor ?? '',
    cartBtnDisplay: t?.cartBtnDisplay ?? 'always',
    cartBtnWidth: t?.cartBtnWidth ?? '',
    productPriceAlign: t?.productPriceAlign ?? '',
    productPricePaddingBottom: t?.productPricePaddingBottom ?? 0,
    productPricePaddingLeft: t?.productPricePaddingLeft ?? 0,
    productPricePaddingRight: t?.productPricePaddingRight ?? 0,
    productPricePaddingTop: t?.productPricePaddingTop ?? 0,
    productPricePreset: t?.productPricePreset ?? '',
    productPriceTextColor: t?.productPriceTextColor ?? '',
    productPriceWidth: t?.productPriceWidth ?? '',
    productTitleAlign: t?.productTitleAlign ?? '',
    productTitleBg: t?.productTitleBg ?? '',
    productTitleMaxWidth: t?.productTitleMaxWidth ?? '',
    productTitlePaddingBottom: t?.productTitlePaddingBottom ?? 0,
    productTitlePaddingLeft: t?.productTitlePaddingLeft ?? 0,
    productTitlePaddingRight: t?.productTitlePaddingRight ?? 0,
    productTitlePaddingTop: t?.productTitlePaddingTop ?? 4,
    productTitlePreset: t?.productTitlePreset ?? '',
    productTitleWidth: t?.productTitleWidth ?? '',
    footerLogoUrl:      t?.footerLogoUrl      ?? '',
    footerLogoWidth:      t?.footerLogoWidth      ?? 130,
    footerLogoHeight:      t?.footerLogoHeight      ?? 56,
    instagramHandle: t?.instagramHandle ?? '',
    twitterHandle:   t?.twitterHandle   ?? '',
    facebookUrl:     t?.facebookUrl     ?? '',
    layout:          t?.layout          ?? 'grid',
    cardShadow:      t?.cardShadow      ?? 'none',
    dividerStyle:    t?.dividerStyle    ?? 'none',
    shopAllLabel:    t?.shopAllLabel    ?? 'Shop All Products',
    featuredLabel:   t?.featuredLabel   ?? 'Featured Products',
    productGridBg:          t?.productGridBg          ?? '#ffffff',
    productImageRadius:     t?.productImageRadius     ?? '',
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

  const activePlan = getActivePlan(store)
  const showShopflowBranding = !activePlan.limits.removeBranding

  return (
    <StorefrontClient
      categories={categories}
      store={store}
      products={products}
      initialTheme={initialTheme}
      initialCustomSections={customSections}
      initialHeroSlides={initialHeroSlides}
      subdomain={subdomain}
      showShopflowBranding={showShopflowBranding}
    />
  )
}