'use client'

import { useState, useEffect } from 'react'
import StoreBanner from './StoreBanner'
import StoreHeader from './StoreHeader'
import StoreHero, { type HeroSlide } from './StoreHero'
import ProductGrid from './ProductGrid'
import StoreFooter from './StoreFooter'
import CartSidebar from './cart-sidebar'
import SectionDivider from './SectionDivider'
import CustomSection, { type CustomSectionData, type StoreCategory } from './CustomSection'
import { EditorSection, EditorItem, AddSectionSlot } from './EditorHighlight'
import { resolveSectionOrder, isCustomKey, customIdFromKey } from '@/lib/section-order'
import { ensureReadable, readableText } from '@/lib/contrast'
import { useStoreBase } from '@/components/StoreBaseProvider'

interface ThemeStyle {
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
  footerText: string
  footerLogoUrl?: string
  footerLogoWidth?: number
  footerLogoHeight?: number
  footerNewsletter?: boolean
  footerNewsletterHeading?: string
  footerNewsletterText?: string
  footerShowLinks?: boolean
  instagramHandle: string
  twitterHandle: string
  facebookUrl: string
  layout: string
  carouselOnMobile?: boolean
  cardShadow: string
  dividerStyle: string
  shopAllLabel: string
  featuredLabel: string
  featuredLabelLevel?: string
  productGridBg: string
  productImageRadius?: string
  productGridButtonColor: string
  productGridTextColor: string
  productGridFont: string
  customCss: string
  customHead: string
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
  navLinks?: { label: string; href: string }[]
  navFontSize?: number
  navCase?: string
  navDividers?: boolean
  darkMode?: boolean
  showDarkToggle?: boolean
}

interface StorefrontClientProps {
  store: any
  products: any[]
  initialTheme: ThemeStyle
  initialCustomSections: CustomSectionData[]
  categories?: StoreCategory[]
  initialHeroSlides?: HeroSlide[] | null
  subdomain: string
  showShopflowBranding?: boolean
}


export default function StorefrontClient({
  store,
  products,
  initialTheme,
  initialCustomSections,
  categories = [],
  initialHeroSlides,
  subdomain,
  showShopflowBranding = false,
}: StorefrontClientProps) {
  const storeBase = useStoreBase()
  const [theme, setTheme] = useState<ThemeStyle>(initialTheme)
  const [storeName, setStoreName] = useState(store.name)
  const [isEditor, setIsEditor] = useState(false)
  /** The section being dragged in the editor, outlined while it moves. */
  const [dragSection, setDragSection] = useState<string | null>(null)
  const [customSections, setCustomSections] = useState<CustomSectionData[]>(initialCustomSections)
  const [liveCategories, setLiveCategories] = useState<StoreCategory[]>(categories)
  const [heroSlides, setHeroSlides] = useState<HeroSlide[] | undefined>(
    (initialHeroSlides && initialHeroSlides.length > 0) ? initialHeroSlides : undefined
  )
  const [activeHeroSlide, setActiveHeroSlide] = useState<number | null>(null)
  const [activeProductField, setActiveProductField] = useState<string | null>(null)

  useEffect(() => {
    const isPreview = new URLSearchParams(window.location.search).has('preview')
    setIsEditor(window.self !== window.top && !isPreview)
  }, [])

  function notifyParent(section: string) {
    window.parent.postMessage({ type: 'section:edit', section }, '*')
  }

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'theme:update' && event.data.theme) {
        setTheme(prev => ({ ...prev, ...event.data.theme }))
      }
      if (event.data?.type === 'custom-sections:update' && Array.isArray(event.data.sections)) {
        setCustomSections(event.data.sections)
      }
      // The editor can create categories, so refresh them alongside sections
      // rather than making the merchant reload to see a new tile.
      if (event.data?.type === 'categories:refresh') {
        fetch(`/api/storefront/${subdomain}/categories`)
          .then(r => (r.ok ? r.json() : null))
          .then(d => { if (d?.categories) setLiveCategories(d.categories) })
          .catch(() => {})
      }
      if (event.data?.type === 'hero:update' && Array.isArray(event.data.slides)) {
        setHeroSlides(event.data.slides)
      }
      if (event.data?.type === 'hero:active') {
        setActiveHeroSlide(event.data.index)
      }
      if (event.data?.type === 'product-field:activate') {
        setActiveProductField(event.data.field ?? null)
      }
      if (event.data?.type === 'store-name:update' && event.data.name) {
        setStoreName(event.data.name)
      }
      if (event.data?.type === 'section:drag') {
        const key: string | null = event.data.section ?? null
        setDragSection(key)
        // Deliberately no scrolling. The editor zooms the preview out far
        // enough to hold the whole template while a drag is in flight, so the
        // page should stay still and only the sections move — scrolling as
        // well would move the target out from under the cursor.
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

  const themeObj = {
    primaryColor: theme.primaryColor,
    backgroundColor: theme.backgroundColor,
    footerColor: theme.footerColor,
    accentColor: theme.accentColor,
    textColor: theme.textColor,
    borderRadius: theme.borderRadius,
    buttonStyle: theme.buttonStyle,
    font: theme.font,
    headingFont: theme.headingFont,
    bannerText: theme.bannerText,
    showBanner: theme.showBanner,
    logoUrl: theme.logoUrl,
    logoWidth: theme.logoWidth,
    logoHeight: theme.logoHeight,
    headerLayout: theme.headerLayout,
    menuPosition: theme.menuPosition,
    headerWidth: theme.headerWidth,
    headerHeight: theme.headerHeight,
    headerSticky: theme.headerSticky,
    headerBorderWidth: theme.headerBorderWidth,
    headerBgColor: theme.headerBgColor,
    headerTextColor: theme.headerTextColor,
    utilityStyle: theme.utilityStyle,
    headerTransparent: theme.headerTransparent,
    headerInverseLogoUrl: theme.headerInverseLogoUrl,
    headerTransparentText: theme.headerTransparentText,
    footerText: theme.footerText,
    footerLogoUrl: theme.footerLogoUrl,
    footerLogoWidth: theme.footerLogoWidth,
    footerLogoHeight: theme.footerLogoHeight,
    footerNewsletter: theme.footerNewsletter,
    footerNewsletterHeading: theme.footerNewsletterHeading,
    footerNewsletterText: theme.footerNewsletterText,
    footerShowLinks: theme.footerShowLinks,
    instagramHandle: theme.instagramHandle,
    twitterHandle: theme.twitterHandle,
    facebookUrl: theme.facebookUrl,
    layout: theme.layout,
    cardShadow: theme.cardShadow,
    navLinks:       theme.navLinks,
    navFontSize:    theme.navFontSize,
    navCase:        theme.navCase,
    navDividers:    theme.navDividers,
    darkMode:       theme.darkMode,
    showDarkToggle: theme.showDarkToggle,
    productGridBg:  theme.productGridBg,
    productImageRadius: theme.productImageRadius,
    carouselOnMobile: theme.carouselOnMobile,
  }

  const btnColor = theme.productGridButtonColor || theme.primaryColor

  // Hidden sections are dropped before ordering, so a hidden one does not leave
  // a gap in the sequence the editor shows.
  const visibleCustomSections = customSections.filter(cs => cs.visible)
  const sectionOrder = resolveSectionOrder(
    (theme as any).sectionOrder,
    visibleCustomSections.map(cs => cs.id),
  )

  const themeStyle = {
    primaryColor: btnColor,
    backgroundColor: theme.backgroundColor,
    footerColor: theme.footerColor,
    accentColor: theme.accentColor,
    // Blank means "work it out": the grid has its own background, so falling
    // back to the page text colour put dark text on a dark grid. A colour that
    // was set is still checked against that background, because turning on
    // dark mode repaints the grid and leaves the text colour where it was.
    textColor: theme.productGridBg
      ? ensureReadable(theme.productGridTextColor || theme.textColor, theme.productGridBg)
      : (theme.productGridTextColor || theme.textColor),
    borderRadius: theme.borderRadius,
    buttonStyle: theme.buttonStyle,
    font: theme.productGridFont || theme.font,
    headingFont: theme.headingFont,
    cardShadow: theme.cardShadow,
    productImageRadius: theme.productImageRadius,
    featuredLabel: theme.featuredLabel || 'Featured Products',
    featuredLabelLevel: theme.featuredLabelLevel,
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
    productPriceInstallments:  theme.productPriceInstallments,
    productPriceTaxInfo:       theme.productPriceTaxInfo,
    productPricePreset:        theme.productPricePreset,
    productPriceWidth:         theme.productPriceWidth,
    productPriceAlign:         theme.productPriceAlign,
    productPriceTextColor:     theme.productPriceTextColor,
    productPriceHeadingColor:  theme.productPriceHeadingColor,
    productPriceLinkColor:     theme.productPriceLinkColor,
    productPricePaddingTop:    theme.productPricePaddingTop,
    productPricePaddingBottom: theme.productPricePaddingBottom,
    productPricePaddingLeft:   theme.productPricePaddingLeft,
    productPricePaddingRight:  theme.productPricePaddingRight,
    cartBtnLabel:         theme.cartBtnLabel,
    cartBtnBgColor:       theme.cartBtnBgColor,
    cartBtnTextColor:     theme.cartBtnTextColor,
    cartBtnDisplay:       theme.cartBtnDisplay,
    cartBtnShowIcon:      theme.cartBtnShowIcon,
    cartBtnWidth:         theme.cartBtnWidth,
    cartBtnFontSize:      theme.cartBtnFontSize,
    cartBtnPaddingTop:    theme.cartBtnPaddingTop,
    cartBtnPaddingBottom: theme.cartBtnPaddingBottom,
    cartBtnPaddingLeft:   theme.cartBtnPaddingLeft,
    cartBtnPaddingRight:  theme.cartBtnPaddingRight,
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
      {/* Preview pulse animation, only injected when inside the editor iframe */}
      {isEditor && (
        <style>{`
          @keyframes preview-section-pulse {
            0%   { box-shadow: 0 0 0 0px rgba(59,130,246,0); }
            25%  { box-shadow: 0 0 0 4px rgba(59,130,246,0.6); }
            55%  { box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
            75%  { box-shadow: 0 0 0 4px rgba(59,130,246,0.6); }
            100% { box-shadow: 0 0 0 0px rgba(59,130,246,0); }
          }
          .preview-dragging {
            outline: 2px solid rgb(59, 130, 246);
            outline-offset: -2px;
            border-radius: 2px;
          }
          .preview-section-pulse {
            animation: preview-section-pulse 1.6s ease-in-out;
          }
        `}</style>
      )}

      <EditorSection id="section-banner" label="Announcement Banner" section="banner" isEditor={isEditor} onEdit={notifyParent}>
        <StoreBanner theme={themeObj} isEditor={isEditor} onEdit={notifyParent} />
      </EditorSection>

      <EditorSection id="section-header" label="Header" section="header" isEditor={isEditor} onEdit={notifyParent}>
        <StoreHeader store={{ ...store, name: storeName }} theme={themeObj} subdomain={subdomain} isEditor={isEditor} isHome onEdit={notifyParent} />
      </EditorSection>

      <AddSectionSlot isEditor={isEditor} />

      {/* The movable middle of the page. Everything above and below this is
          fixed, so only these are driven by the saved order. */}
      {sectionOrder.map(key => {
        if (key === 'hero') {
          return (
            <div key={key}>
              <EditorSection id="section-hero" label="Hero" section="hero" isEditor={isEditor} onEdit={notifyParent} className={dragSection === 'hero' ? 'preview-dragging' : ''}>
                <StoreHero
                  theme={themeObj}
                  storeName={storeName}
                  storeId={store.id}
                  slides={heroSlides}
                  activeSlide={activeHeroSlide}
                  isEditor={isEditor}
                  onEdit={notifyParent}
                />
              </EditorSection>
              <AddSectionSlot isEditor={isEditor} />
            </div>
          )
        }

        if (key === 'products') {
          return (
            <div key={key}>
              <SectionDivider style={theme.dividerStyle} primaryColor={theme.primaryColor} />
              <EditorSection id="section-products" label="Product Grid" section="products" isEditor={isEditor} onEdit={notifyParent} className={dragSection === 'products' ? 'preview-dragging' : ''}>
                <div data-pg="1" style={{ backgroundColor: 'var(--store-pg-bg)' }}>
                  <ProductGrid products={products} theme={themeObj} subdomain={subdomain} themeStyle={themeStyle} isEditor={isEditor} onEdit={notifyParent} activeProductField={activeProductField} />
                  <div className="flex justify-center pb-8 -mt-2">
                    <EditorItem section="products" field="shop-all" label="Shop All label" isEditor={isEditor} onEdit={notifyParent} block>
                      <a
                        href={`${storeBase}/products`}
                        data-btn-type={theme.buttonStyle}
                        className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold transition-all hover:opacity-80"
                        style={{
                          borderRadius: theme.borderRadius,
                          backgroundColor: theme.buttonStyle === 'solid' ? btnColor : 'transparent',
                          color: theme.buttonStyle === 'solid' ? '#fff' : btnColor,
                          border: theme.buttonStyle === 'ghost' ? 'none' : `2px solid ${btnColor}`,
                        }}
                      >
                        {theme.shopAllLabel || 'Shop All Products'}
                      </a>
                    </EditorItem>
                  </div>
                </div>
              </EditorSection>
              <AddSectionSlot isEditor={isEditor} />
            </div>
          )
        }

        if (!isCustomKey(key)) return null
        const section = visibleCustomSections.find(cs => cs.id === customIdFromKey(key))
        if (!section) return null

        return (
          <div key={key}>
            <EditorSection id={`section-custom-${section.id}`} label="Custom Section" section="custom" isEditor={isEditor} onEdit={notifyParent} className={dragSection === `custom-${section.id}` ? 'preview-dragging' : ''}>
              <div>
                <SectionDivider style={theme.dividerStyle} primaryColor={theme.primaryColor} />
                <CustomSection section={section} themeStyle={themeStyle} categories={liveCategories} subdomain={subdomain} isEditor={isEditor} onEdit={notifyParent} />
              </div>
            </EditorSection>
            <AddSectionSlot isEditor={isEditor} />
          </div>
        )
      })}

      <SectionDivider style={theme.dividerStyle} primaryColor={theme.primaryColor} />

      <EditorSection id="section-footer" label="Footer" section="footer" isEditor={isEditor} onEdit={notifyParent}>
        <StoreFooter store={{ ...store, name: storeName }} theme={themeObj} subdomain={subdomain} categories={liveCategories} showShopflowBranding={showShopflowBranding} isEditor={isEditor} onEdit={notifyParent} />
      </EditorSection>
      <CartSidebar
        themeStyle={{
          primaryColor: theme.primaryColor,
          borderRadius: theme.borderRadius,
          buttonStyle: theme.buttonStyle,
        }}
        subdomain={subdomain}
      />
    </div>
  )
}