import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductsPageClient from './ProductsPageClient'

import type { Metadata } from 'next'
import { storeUrl } from '@/lib/config'

/**
 * Canonical for the listing. When a ?category= filter is applied the canonical
 * points at that category's own path URL, so the query-string form does not
 * compete with it for the same content.
 */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ category?: string; q?: string; page?: string }>
}): Promise<Metadata> {
  const { subdomain } = await params
  const { category, q } = await searchParams

  const store = await prisma.store.findUnique({
    where: { subdomain },
    select: { id: true, name: true },
  })
  if (!store) return { title: 'Not found' }

  if (category) {
    const cat = await prisma.category.findFirst({
      where: { storeId: store.id, slug: category },
      select: { name: true, description: true },
    })
    if (cat) {
      return {
        title: cat.name,
        description: cat.description?.trim().slice(0, 160) || `Browse ${cat.name} at ${store.name}.`,
        alternates: { canonical: storeUrl(subdomain, `/categories/${category}`) },
      }
    }
  }

  return {
    title: 'All products',
    description: `Browse every product available at ${store.name}.`,
    // A search is a filtered view, not its own page — point it at the listing.
    alternates: { canonical: storeUrl(subdomain, '/products') },
    ...(q ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ category?: string; q?: string; page?: string }>
}) {
  const { subdomain } = await params
  const { category, q, page: pageStr } = await searchParams

  const store = await prisma.store.findUnique({
    where: { subdomain },
    include: { theme: true },
  })
  if (!store) notFound()

  const t = store.theme
  const theme = {
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
    footerLogoUrl:      t?.footerLogoUrl      ?? '',
    footerLogoWidth:      t?.footerLogoWidth      ?? 130,
    footerLogoHeight:      t?.footerLogoHeight      ?? 56,
    instagramHandle: t?.instagramHandle ?? '',
    twitterHandle:   t?.twitterHandle   ?? '',
    facebookUrl:     t?.facebookUrl     ?? '',
    layout:          t?.layout          ?? 'grid',
    carouselOnMobile: t?.carouselOnMobile ?? false,
    cardShadow:      t?.cardShadow      ?? 'none',
    dividerStyle:    t?.dividerStyle    ?? 'none',
    navLinks:       (t?.navLinks as { label: string; href: string }[] | null) ?? null,
    navFontSize:    t?.navFontSize    ?? 14,
    navCase:        t?.navCase        ?? 'normal',
    navDividers:    t?.navDividers    ?? false,
    darkMode:       t?.darkMode       ?? false,
    showDarkToggle: t?.showDarkToggle ?? true,
    productGridBg:            t?.productGridBg            ?? '',
    productImageRadius:       t?.productImageRadius       ?? '',
    productGridButtonColor:   t?.productGridButtonColor   ?? '',
    productGridTextColor:     t?.productGridTextColor     ?? '',
    productGridFont:          t?.productGridFont          ?? '',
    featuredLabel:            t?.featuredLabel            ?? '',
    featuredLabelLevel: t?.featuredLabelLevel ?? '',
    shopAllLabel:             t?.shopAllLabel             ?? '',
    productTitleWidth:        t?.productTitleWidth        ?? '',
    productTitleMaxWidth:     t?.productTitleMaxWidth     ?? '',
    productTitleAlign:        t?.productTitleAlign        ?? '',
    productTitlePreset:       t?.productTitlePreset       ?? '',
    productTitleBg:           t?.productTitleBg           ?? '',
    productTitlePaddingTop:    t?.productTitlePaddingTop    ?? 4,
    productTitlePaddingBottom: t?.productTitlePaddingBottom ?? 0,
    productTitlePaddingLeft:   t?.productTitlePaddingLeft   ?? 0,
    productTitlePaddingRight:  t?.productTitlePaddingRight  ?? 0,
    productPricePreset:       t?.productPricePreset       ?? '',
    productPriceWidth:        t?.productPriceWidth        ?? '',
    productPriceAlign:        t?.productPriceAlign        ?? '',
    productPriceTextColor:    t?.productPriceTextColor    ?? '',
    productPricePaddingTop:    t?.productPricePaddingTop    ?? 0,
    productPricePaddingBottom: t?.productPricePaddingBottom ?? 0,
    productPricePaddingLeft:   t?.productPricePaddingLeft   ?? 0,
    productPricePaddingRight:  t?.productPricePaddingRight  ?? 0,
    cartBtnLabel:         t?.cartBtnLabel         ?? '',
    cartBtnBgColor:       t?.cartBtnBgColor       ?? '',
    cartBtnTextColor:     t?.cartBtnTextColor     ?? '',
    cartBtnDisplay:       t?.cartBtnDisplay       ?? 'always',
    cartBtnShowIcon:      t?.cartBtnShowIcon      ?? true,
    cartBtnWidth:         t?.cartBtnWidth         ?? '',
    cartBtnFontSize:      t?.cartBtnFontSize      ?? 10,
    cartBtnPaddingTop:    t?.cartBtnPaddingTop    ?? 5,
    cartBtnPaddingBottom: t?.cartBtnPaddingBottom ?? 5,
    cartBtnPaddingLeft:   t?.cartBtnPaddingLeft   ?? 0,
    cartBtnPaddingRight:  t?.cartBtnPaddingRight  ?? 0,
    productsPageHeading:  t?.productsPageHeading  ?? '',
    catBackLabel:          t?.catBackLabel          ?? 'Back to store',
    catFilterRadius:       t?.catFilterRadius       ?? '9999px',
    catFilterFontSize:     t?.catFilterFontSize     ?? 12,
    catFilterFont:         t?.catFilterFont         ?? '',
    catFilterCase:         t?.catFilterCase         ?? 'uppercase',
    catFilterActiveBg:     t?.catFilterActiveBg     ?? '',
    catFilterActiveText:   t?.catFilterActiveText   ?? '#ffffff',
    catFilterInactiveBg:   t?.catFilterInactiveBg   ?? '',
    catFilterInactiveText: t?.catFilterInactiveText ?? '',
    catFilterPaddingX:     t?.catFilterPaddingX     ?? 16,
    catFilterPaddingY:     t?.catFilterPaddingY     ?? 6,
    catBackFont:           t?.catBackFont           ?? '',
    catFilterFontWeight:   t?.catFilterFontWeight   ?? 'bold',
  }

  const PAGE_SIZE = 24
  const currentPage = Math.max(1, parseInt(pageStr ?? '1'))
  const skip = (currentPage - 1) * PAGE_SIZE

  const categories = await prisma.category.findMany({
    where: { storeId: store.id },
    orderBy: { name: 'asc' },
  })

  const where: any = { storeId: store.id, status: 'active' }
  if (category) {
    // Product.category is a loose string: current data holds the slug, but rows
    // saved by an older form hold the name. Match either, or a category filtered
    // by slug returns nothing for products stored under the name (and vice versa).
    const matchedCat = categories.find(c => c.slug === category)
    where.category = matchedCat
      ? { in: [matchedCat.slug, matchedCat.name] }
      : category
  }
  if (q) {
    // Tags exist so a shopper searching "soy wax" finds a candle titled
    // "Winter Ember". has is exact per tag, which is what a keyword list wants.
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { tags: { has: q.toLowerCase() } },
    ]
  }

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { createdAt: 'desc' }, take: PAGE_SIZE, skip }),
    prisma.product.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <ProductsPageClient
      store={{ id: store.id, name: store.name, subdomain: store.subdomain }}
      products={products}
      categories={categories}
      initialTheme={theme}
      subdomain={subdomain}
      currentCategory={category ?? null}
      currentPage={currentPage}
      totalPages={totalPages}
      totalCount={totalCount}
      searchQuery={q ?? ''}
    />
  )
}
