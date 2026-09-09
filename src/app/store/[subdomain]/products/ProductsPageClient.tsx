'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import StoreBanner from '../StoreBanner'
import StoreHeader from '../StoreHeader'
import StoreFooter from '../StoreFooter'
import CartSidebar from '../cart-sidebar'
import ProductGrid from '../ProductGrid'
import ThemeSync from '../ThemeSync'
import { EditorSection, EditorItem } from '../EditorHighlight'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStoreBase } from '@/components/StoreBaseProvider'
import { ensureReadable } from '@/lib/contrast'

interface Product {
  id: string
  title: string
  description?: string | null
  price: number
  imageUrl?: string | null
  category?: string | null
  inventory: number
}

interface Category {
  id: string
  name: string
  slug: string
}

interface ThemeState {
  primaryColor: string
  backgroundColor: string
  footerColor: string
  accentColor: string
  textColor: string
  borderRadius: string
  buttonStyle: string
  font: string
  headingFont: string
  bannerText: string
  showBanner: boolean
  logoUrl: string
  logoWidth: number
  logoHeight?: number
  headerLayout?: string
  menuPosition?: string
  headerWidth?: string
  headerHeight?: string
  headerSticky?: boolean
  headerBorderWidth?: number
  headerBgColor?: string
  headerTextColor?: string
  utilityStyle?: string
  headerTransparent?: boolean
  headerInverseLogoUrl?: string
  headerTransparentText?: string
  drawer?: unknown
  footerText: string
  footerLogoUrl?: string
  footerLogoWidth?: number
  footerLogoHeight?: number
  instagramHandle: string
  twitterHandle: string
  facebookUrl: string
  layout: string
  cardShadow: string
  dividerStyle: string
  navLinks?: { label: string; href: string }[] | null
  navFontSize?: number
  navCase?: string
  navDividers?: boolean
  productGridBg?: string
  productGridPadTop?: number
  productGridPadBottom?: number
  productGridPadLeft?: number
  productGridPadRight?: number
  productGridMarginTop?: number
  productGridMarginBottom?: number
  productImageRadius?: string
  carouselOnMobile?: boolean
  productGridButtonColor?: string
  productGridTextColor?: string
  productGridFont?: string
  featuredLabel?: string
  featuredLabelLevel?: string
  shopAllLabel?: string
  shopAllShow?: boolean
  shopAllPadTop?: number
  shopAllPadBottom?: number
  shopAllPadLeft?: number
  shopAllPadRight?: number
  shopAllMarginTop?: number
  shopAllMarginBottom?: number
  featuredLabelShow?: boolean
  shopAllStyle?: string
  featuredLabelPadTop?: number
  featuredLabelPadBottom?: number
  featuredLabelPadLeft?: number
  featuredLabelPadRight?: number
  featuredLabelMarginTop?: number
  featuredLabelMarginBottom?: number
  productTitleWidth?: string
  productTitleMaxWidth?: string
  productTitleAlign?: string
  productTitlePreset?: string
  productTitleBg?: string
  productTitlePaddingTop?: number
  productTitlePaddingBottom?: number
  productTitlePaddingLeft?: number
  productTitlePaddingRight?: number
  productPriceShowSale?: boolean
  productPriceHidden?: boolean
  productPriceInstallments?: boolean
  productPriceTaxInfo?: boolean
  productPricePreset?: string
  productPriceWidth?: string
  productPriceAlign?: string
  productPriceTextColor?: string
  productPriceHeadingColor?: string
  productPriceLinkColor?: string
  productPricePaddingTop?: number
  productPricePaddingBottom?: number
  productPricePaddingLeft?: number
  productPricePaddingRight?: number
  cartBtnLabel?: string
  cartBtnRadius?: string
  cartBtnBgColor?: string
  cartBtnTextColor?: string
  cartBtnDisplay?: string
  cartBtnShowIcon?: boolean
  cartBtnWidth?: string
  cartBtnFontSize?: number
  cartBtnPaddingTop?: number
  cartBtnPaddingBottom?: number
  cartBtnPaddingLeft?: number
  cartBtnPaddingRight?: number
  productsPageHeading?: string
  catBackLabel?: string
  catFilterRadius?: string
  catFilterFontSize?: number
  catFilterFont?: string
  catFilterCase?: string
  catFilterActiveBg?: string
  catFilterActiveText?: string
  catFilterInactiveBg?: string
  catFilterInactiveText?: string
  catFilterPaddingX?: number
  catFilterPaddingY?: number
  catBackFont?: string
  catFilterFontWeight?: string
}

interface Props {
  store: { id: string; name: string; subdomain: string }
  products: Product[]
  categories: Category[]
  initialTheme: ThemeState
  subdomain: string
  currentCategory: string | null
  currentPage: number
  totalPages: number
  totalCount: number
  searchQuery: string
}

export default function ProductsPageClient({
  store,
  products,
  categories,
  initialTheme,
  subdomain,
  currentCategory,
  currentPage,
  totalPages,
  totalCount,
  searchQuery,
}: Props) {
  const storeBase = useStoreBase()
  const [theme, setTheme] = useState<ThemeState>(initialTheme)
  const [isEditor, setIsEditor] = useState(false)

  useEffect(() => {
    const isPreview = new URLSearchParams(window.location.search).has('preview')
    setIsEditor(window.self !== window.top && !isPreview)
  }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'theme:update' && event.data.theme) {
        setTheme(prev => ({ ...prev, ...event.data.theme }))
      }
      if (event.data?.type === 'section:drag') {
        // Clear any previous outline first: the cursor moves between sections
        // during one drag, and two outlined sections at once would say the
        // drop could land in either place.
        document
          .querySelectorAll('[data-dragging]')
          .forEach(n => n.removeAttribute('data-dragging'))

        const key = event.data.section
        if (key) {
          const el = document.getElementById(`section-${key}`)
          if (el) {
            // An attribute, not a class. The live reorder posts a theme update
            // on the same gesture, React re-renders these sections, and
            // re-rendering rewrites className — so a class added here was being
            // wiped a frame later. React leaves attributes it does not manage
            // alone.
            el.setAttribute('data-dragging', '')
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }
      if (event.data?.type === 'section:highlight' && event.data.section) {
        const el = document.getElementById(`section-${event.data.section}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          el.classList.remove('preview-section-pulse')
          void el.offsetWidth
          el.classList.add('preview-section-pulse')
          setTimeout(() => el.classList.remove('preview-section-pulse'), 1800)
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  function notifyParent(section: string) {
    window.parent.postMessage({ type: 'section:edit', section }, '*')
  }

  const btnColor = theme.productGridButtonColor || theme.primaryColor

  // What the listing actually sits on. Blank means it inherits the page, so
  // that is what its text has to be readable against.
  const gridGround = theme.productGridBg || theme.backgroundColor

  const themeStyle = {
    primaryColor:              btnColor,
    backgroundColor:           theme.backgroundColor,
    footerColor:               theme.footerColor,
    accentColor:               theme.accentColor,
    // Same check the home page's grid gets: the listing's background and its
    // text are set in different panels, so the pair is verified rather than
    // trusted. Only a pairing that cannot be read is replaced.
    textColor:                 ensureReadable(theme.productGridTextColor || theme.textColor, gridGround),
    borderRadius:              theme.borderRadius,
    buttonStyle:               theme.buttonStyle,
    font:                      theme.productGridFont || theme.font,
    headingFont:               theme.headingFont,
    cardShadow:                theme.cardShadow,
    productImageRadius:        theme.productImageRadius,
    carouselOnMobile:          theme.carouselOnMobile,
    featuredLabel:             theme.featuredLabel || 'All Products',
    featuredLabelShow:         theme.featuredLabelShow,
    featuredLabelPadTop: theme.featuredLabelPadTop,
    featuredLabelPadBottom: theme.featuredLabelPadBottom,
    featuredLabelPadLeft: theme.featuredLabelPadLeft,
    featuredLabelPadRight: theme.featuredLabelPadRight,
    featuredLabelMarginTop: theme.featuredLabelMarginTop,
    featuredLabelMarginBottom: theme.featuredLabelMarginBottom,
    productGridPadTop: theme.productGridPadTop,
    productGridPadBottom: theme.productGridPadBottom,
    productGridPadLeft: theme.productGridPadLeft,
    productGridPadRight: theme.productGridPadRight,
    productGridMarginTop: theme.productGridMarginTop,
    productGridMarginBottom: theme.productGridMarginBottom,
    productTitleWidth:         theme.productTitleWidth,
    productTitleMaxWidth:      theme.productTitleMaxWidth,
    productTitleAlign:         theme.productTitleAlign,
    productTitlePreset:        theme.productTitlePreset,
    productTitleBg:            theme.productTitleBg,
    productTitlePaddingTop:    theme.productTitlePaddingTop,
    productTitlePaddingBottom: theme.productTitlePaddingBottom,
    productTitlePaddingLeft:   theme.productTitlePaddingLeft,
    productTitlePaddingRight:  theme.productTitlePaddingRight,
    productPriceShowSale:      theme.productPriceShowSale,
    productPriceHidden:        theme.productPriceHidden,
    productPriceInstallments:  theme.productPriceInstallments,
    productPriceTaxInfo:       theme.productPriceTaxInfo,
    productPricePreset:        theme.productPricePreset,
    productPriceWidth:         theme.productPriceWidth,
    productPriceAlign:         theme.productPriceAlign,
    productPriceTextColor:     theme.productPriceTextColor
      ? ensureReadable(theme.productPriceTextColor, gridGround)
      : theme.productPriceTextColor,
    productPriceHeadingColor:  theme.productPriceHeadingColor,
    productPriceLinkColor:     theme.productPriceLinkColor,
    productPricePaddingTop:    theme.productPricePaddingTop,
    productPricePaddingBottom: theme.productPricePaddingBottom,
    productPricePaddingLeft:   theme.productPricePaddingLeft,
    productPricePaddingRight:  theme.productPricePaddingRight,
    cartBtnLabel:              theme.cartBtnLabel,
    cartBtnRadius:              theme.cartBtnRadius,
    cartBtnBgColor:            theme.cartBtnBgColor,
    cartBtnTextColor:          theme.cartBtnTextColor,
    cartBtnDisplay:            theme.cartBtnDisplay,
    cartBtnShowIcon:           theme.cartBtnShowIcon,
    cartBtnWidth:              theme.cartBtnWidth,
    cartBtnFontSize:           theme.cartBtnFontSize,
    cartBtnPaddingTop:         theme.cartBtnPaddingTop,
    cartBtnPaddingBottom:      theme.cartBtnPaddingBottom,
    cartBtnPaddingLeft:        theme.cartBtnPaddingLeft,
    cartBtnPaddingRight:       theme.cartBtnPaddingRight,
  }

  const { primaryColor } = theme

  function buildUrl(cat: string | null, page = 1) {
    // A category is its own page (/categories/<slug>), not a query filter —
    // a path ranks as a page in its own right, a query string does not.
    const base = cat
      ? `${storeBase}/categories/${encodeURIComponent(cat)}`
      : `${storeBase}/products`
    const parts: string[] = []
    if (searchQuery) parts.push(`q=${encodeURIComponent(searchQuery)}`)
    if (page > 1) parts.push(`page=${page}`)
    return `${base}${parts.length ? '?' + parts.join('&') : ''}`
  }

  function NavLink({ href, className, style, children }: {
    href: string; className?: string; style?: React.CSSProperties; children: React.ReactNode
  }) {
    if (isEditor) return <span className={className} style={style}>{children}</span>
    return <Link href={href} className={className} style={style}>{children}</Link>
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--store-bg)',
        color: 'var(--store-text)',
        fontFamily: theme.font === 'serif' ? 'serif' : theme.font === 'mono' ? 'monospace' : 'inherit',
      }}
    >
      <ThemeSync />

      {isEditor && (
        <style>{`
          @keyframes preview-section-pulse {
            0%   { box-shadow: 0 0 0 0px rgba(59,130,246,0); }
            25%  { box-shadow: 0 0 0 4px rgba(59,130,246,0.6); }
            55%  { box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
            75%  { box-shadow: 0 0 0 4px rgba(59,130,246,0.6); }
            100% { box-shadow: 0 0 0 0px rgba(59,130,246,0); }
          }
          [data-dragging] {
            outline: 2px solid rgb(59, 130, 246);
            outline-offset: -2px;
            border-radius: 2px;
          }
          .preview-section-pulse { animation: preview-section-pulse 1.6s ease-in-out; }
        `}</style>
      )}

      <EditorSection id="section-banner" label="Announcement Banner" section="banner" isEditor={isEditor} onEdit={notifyParent}>
        <StoreBanner theme={theme} isEditor={isEditor} onEdit={notifyParent} />
      </EditorSection>

      <EditorSection id="section-header" label="Header" section="header" isEditor={isEditor} onEdit={notifyParent}>
        <StoreHeader store={store} theme={theme} subdomain={subdomain} isEditor={isEditor} onEdit={notifyParent} />
      </EditorSection>

      <EditorSection id="section-products" label="Product Listing" section="products" isEditor={isEditor} onEdit={notifyParent}>
        <div style={{ backgroundColor: 'var(--store-pg-bg)' }}>

          {/* Back + heading + filters */}
          <div className="px-4 md:px-8 pt-8 pb-4 max-w-7xl mx-auto w-full">
            <EditorItem section="products" field="products-back" label="Back to store" isEditor={isEditor} onEdit={notifyParent}>
              <NavLink
                href={storeBase || '/'}
                className="inline-flex items-center gap-1.5 font-semibold text-zinc-400 hover:text-zinc-700 transition-colors mb-5"
                style={{
                  fontSize: (theme.catFilterFontSize ?? 12) + 'px',
                  fontFamily: theme.catBackFont === 'serif' ? 'serif' : theme.catBackFont === 'mono' ? 'monospace' : undefined,
                }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                {theme.catBackLabel || 'Back to store'}
              </NavLink>
            </EditorItem>

            <div className="mb-5">
              <EditorItem section="products" field="products-heading" label="Page heading" isEditor={isEditor} onEdit={notifyParent} block>
                <h1
                  className="text-2xl font-black tracking-tight"
                  style={{ fontFamily: theme.headingFont === 'serif' ? 'serif' : 'inherit' }}
                >
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : currentCategory
                    ? (categories.find(c => c.slug === currentCategory)?.name ?? currentCategory)
                    : (theme.productsPageHeading || 'All Products')}
                </h1>
              </EditorItem>
              <p className="text-sm opacity-50 mt-1">{totalCount} product{totalCount !== 1 ? 's' : ''}</p>
            </div>

            {/* Category filter tabs */}
            {categories.length > 0 && (
              <EditorItem section="products" field="products-categories" label="Category filters" isEditor={isEditor} onEdit={notifyParent} block>
                {(() => {
                  const cfRadius  = theme.catFilterRadius  || '9999px'
                  const cfFontSize = (theme.catFilterFontSize ?? 12) + 'px'
                  const cfFont    = theme.catFilterFont === 'serif' ? 'serif' : theme.catFilterFont === 'mono' ? 'monospace' : theme.catFilterFont ? 'inherit' : undefined
                  const cfWeight  = theme.catFilterFontWeight || '700'
                  const cfCase    = (theme.catFilterCase || 'uppercase') as React.CSSProperties['textTransform']
                  const cfPadX    = (theme.catFilterPaddingX ?? 16) + 'px'
                  const cfPadY    = (theme.catFilterPaddingY ?? 6) + 'px'
                  const activeBg  = theme.catFilterActiveBg  || primaryColor
                  const activeText = theme.catFilterActiveText || '#ffffff'
                  const inactiveBg = theme.catFilterInactiveBg  || ''
                  const inactiveText = theme.catFilterInactiveText || ''
                  const baseStyle: React.CSSProperties = {
                    borderRadius: cfRadius, fontSize: cfFontSize, fontFamily: cfFont,
                    textTransform: cfCase, fontWeight: cfWeight,
                    paddingLeft: cfPadX, paddingRight: cfPadX,
                    paddingTop: cfPadY, paddingBottom: cfPadY,
                  }
                  return (
                    <div className="flex flex-wrap gap-2 mb-2">
                      <NavLink
                        href={buildUrl(null)}
                        className="font-bold tracking-wider transition-colors"
                        style={!currentCategory
                          ? { ...baseStyle, backgroundColor: activeBg, color: activeText }
                          : { ...baseStyle, backgroundColor: inactiveBg || '#f4f4f5', color: inactiveText || '#52525b' }}
                      >
                        All
                      </NavLink>
                      {categories.map(cat => (
                        <NavLink
                          key={cat.id}
                          href={buildUrl(cat.slug)}
                          className="font-bold tracking-wider transition-colors"
                          style={currentCategory === cat.slug
                            ? { ...baseStyle, backgroundColor: activeBg, color: activeText }
                            : { ...baseStyle, backgroundColor: inactiveBg || '#f4f4f5', color: inactiveText || '#52525b' }}
                        >
                          {cat.name}
                        </NavLink>
                      ))}
                    </div>
                  )
                })()}
              </EditorItem>
            )}
          </div>

          {/* Product grid, same component as homepage */}
          <ProductGrid
            products={products}
            theme={theme}
            subdomain={subdomain}
            themeStyle={themeStyle}
            isEditor={isEditor}
            onEdit={notifyParent}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pb-10 -mt-2">
              <NavLink
                href={buildUrl(currentCategory, currentPage - 1)}
                className={`p-2 rounded-xl border transition-colors ${currentPage <= 1 ? 'opacity-30 pointer-events-none' : 'hover:bg-zinc-100'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </NavLink>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                <NavLink
                  key={pg}
                  href={buildUrl(currentCategory, pg)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                    pg === currentPage ? 'text-white' : 'hover:bg-zinc-100 text-zinc-600'
                  }`}
                  style={pg === currentPage ? { backgroundColor: primaryColor } : {}}
                >
                  {pg}
                </NavLink>
              ))}
              <NavLink
                href={buildUrl(currentCategory, currentPage + 1)}
                className={`p-2 rounded-xl border transition-colors ${currentPage >= totalPages ? 'opacity-30 pointer-events-none' : 'hover:bg-zinc-100'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </NavLink>
            </div>
          )}
        </div>
      </EditorSection>

      <EditorSection id="section-footer" label="Footer" section="footer" isEditor={isEditor} onEdit={notifyParent}>
        <StoreFooter store={store} theme={theme} subdomain={subdomain} isEditor={isEditor} onEdit={notifyParent} />
      </EditorSection>

      <CartSidebar
        themeStyle={{ primaryColor: theme.primaryColor, borderRadius: theme.borderRadius, buttonStyle: theme.buttonStyle }}
        subdomain={subdomain}
      />
    </div>
  )
}
