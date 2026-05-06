import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductsPageClient from './ProductsPageClient'

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
    navLinks:       (t?.navLinks as { label: string; href: string }[] | null) ?? null,
    navFontSize:    t?.navFontSize    ?? 14,
    navCase:        t?.navCase        ?? 'normal',
    navDividers:    t?.navDividers    ?? false,
    darkMode:       t?.darkMode       ?? false,
    showDarkToggle: t?.showDarkToggle ?? true,
    productGridBg:            t?.productGridBg            ?? '',
    productGridButtonColor:   t?.productGridButtonColor   ?? '',
    productGridTextColor:     t?.productGridTextColor     ?? '',
    productGridFont:          t?.productGridFont          ?? '',
    featuredLabel:            t?.featuredLabel            ?? '',
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
    const matchedCat = categories.find(c => c.slug === category)
    where.category = matchedCat ? matchedCat.name : category
  }
  if (q) where.title = { contains: q, mode: 'insensitive' }

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
