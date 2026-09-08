'use client'

import { useState, useRef, useEffect } from 'react'
import { storeUrl } from '@/lib/config'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Save, Monitor, Smartphone, Tablet,
  Undo2, Redo2, ChevronLeft, Layers, Palette,
  CheckCircle2, Eye, ChevronDown,
  Home, Globe, Plus, Check,
  ShoppingBag, CreditCard, CheckSquare, LogIn, UserCircle, PackageCheck,
  PanelLeft, X, Pencil,
} from 'lucide-react'
import { ThemeState } from './types'
import SectionsList from './sections/SectionsList'
import BannerEdit from './sections/BannerEdit'
import HeaderEdit from './sections/HeaderEdit'
import HeroEdit, { type HeroSlide } from './sections/HeroEdit'
import ProductGridEdit from './sections/ProductGridEdit'
import FooterEdit from './sections/FooterEdit'
import CustomSectionsEdit, { type CustomSection } from './sections/CustomSectionsEdit'
import CustomCodeEdit from './sections/CustomCodeEdit'
import SeoEdit from './sections/SeoEdit'
import ThemePanel from './panels/ThemePanel'
import PageContentEdit from './sections/PageContentEdit'
import SystemPageEdit from './sections/SystemPageEdit'
import ProductTitleEdit from './sections/ProductTitleEdit'
import ProductPriceEdit from './sections/ProductPriceEdit'
import ProductCartButtonEdit from './sections/ProductCartButtonEdit'
import NavMenuEdit from './sections/NavMenuEdit'
import CategoryFilterEdit from './sections/CategoryFilterEdit'
import PageSkeleton from './PageSkeleton'
import AddPageModal, { type PageResult } from '@/components/AddPageModal'
import ProductModal from './ProductModal'
import { resolveSectionOrder, serializeSectionOrder } from '@/lib/section-order'

export interface StorePage {
  id: string
  type: string
  name: string
  slug: string
  content: any
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile'
type Tab = 'sections' | 'theme'
const SECTION_VIEWS = [
  'list', 'banner', 'header', 'hero', 'products', 'footer', 'custom', 'code',
  'seo', 'product-title', 'product-price', 'product-cart', 'nav-menu', 'category-filter',
] as const
type SectionView = (typeof SECTION_VIEWS)[number]

/** Never shrink past this, however long the page is — below it nothing is
 *  recognisable and the zoom stops helping. */
const MIN_DRAG_ZOOM = 0.4

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
}

const SYSTEM_PAGES = [
  { id: '__products__',     name: 'Products',           slug: 'products',     icon: ShoppingBag },
  { id: '__checkout__',     name: 'Checkout',           slug: 'checkout',     icon: CreditCard },
  { id: '__success__',      name: 'Order Confirmation', slug: 'success',      icon: CheckSquare },
  { id: '__login__',        name: 'Login',              slug: 'login',        icon: LogIn },
  { id: '__signup__',       name: 'Sign Up',            slug: 'signup',       icon: UserCircle },
  { id: '__account__',      name: 'Account',            slug: 'account',      icon: PackageCheck },
]

/**
 * The names the section panels go by, for the sheet's title row. Same words
 * the section list uses, so the phone and the desk call things the same thing.
 */
const SECTION_LABELS: Record<string, string> = {
  list: '', // the list itself is the page, so the page name stands
  banner: 'Announcement Banner',
  header: 'Header',
  hero: 'Hero',
  products: 'Product Grid',
  footer: 'Footer',
  custom: 'Sections',
  code: 'Custom Code',
  seo: 'SEO & Favicon',
  'product-title': 'Product Title',
  'product-price': 'Product Price',
  'product-cart': 'Add to Cart Button',
  'nav-menu': 'Menu',
  'category-filter': 'Category Filter',
}

const DEFAULT_SLIDES: HeroSlide[] = [
  { id: 'slide-1', heading: 'Welcome to Our Store', subheading: 'Discover products you will love.', ctaLabel: 'Shop Now', ctaUrl: '#products', bgColor: '#f8f7ff' },
  { id: 'slide-2', heading: 'New Arrivals', subheading: 'Fresh drops every week.', ctaLabel: "See What's New", ctaUrl: '#products', bgColor: '#fff7ed' },
]

export default function VisualEditor({
  storeId,
  subdomain,
  storeName,
  initialTheme,
  initialHeroSlides,
  initialCustomSections,
}: {
  storeId: string
  subdomain: string
  storeName: string
  initialTheme: any
  initialHeroSlides?: HeroSlide[] | null
  initialCustomSections?: CustomSection[]
}) {
  const router = useRouter()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const sidebarPanelRef = useRef<HTMLDivElement>(null)
  const peekBarRef = useRef<HTMLDivElement>(null)

  /**
   * A single hop on the phone bar, for when a tap in the preview has changed
   * what the bar says. Driven through the class list rather than state: this
   * fires on every tap, and re-rendering the editor for an animation that
   * touches one element would be the expensive way to do it. The remove,
   * reflow, add is what lets it play again while it is still playing.
   */
  function nudgePeekBar() {
    requestAnimationFrame(() => {
      const el = peekBarRef.current
      if (!el) return
      el.classList.remove('sheet-nudge')
      void el.offsetWidth
      el.classList.add('sheet-nudge')
    })
  }

  function triggerSidebarPulse() {
    requestAnimationFrame(() => {
      const el = sidebarPanelRef.current
      if (!el) return
      el.classList.remove('editor-section-pulse')
      void el.offsetWidth
      el.classList.add('editor-section-pulse')
    })
  }

  function pulseField(field: string) {
    const container = sidebarPanelRef.current
    if (!container) return
    const el = container.querySelector(`[data-field="${field}"]`) as HTMLElement | null
    if (!el) return
    // Walk up offsetParent chain to get el's true offset relative to container
    let offsetTop = 0
    let node: HTMLElement | null = el
    while (node && node !== container) {
      offsetTop += node.offsetTop
      node = node.offsetParent as HTMLElement | null
    }
    container.scrollTop = offsetTop - container.clientHeight / 2 + el.clientHeight / 2
    el.classList.remove('field-pulse')
    void el.offsetWidth
    el.classList.add('field-pulse')
  }

  /**
   * Reloads the storefront preview. Used after the product modal saves: the
   * grid is server-rendered inside the iframe, so a postMessage cannot update
   * it. Same-origin (/store/<sub>), so reload() is allowed.
   */
  function refreshPreview() {
    const frame = iframeRef.current
    if (!frame) return
    setIframeLoading(true)
    try {
      // Same-origin (/store/<sub>), so this is normally allowed.
      frame.contentWindow?.location.reload()
    } catch {
      // Reassigning src reloads it without touching the inner document, which
      // works even when reading contentWindow.location is refused.
      const src = frame.src
      frame.src = src
    }
  }

  function sendHighlightToPreview(section: string) {
    iframeRef.current?.contentWindow?.postMessage({ type: 'section:highlight', section }, '*')
  }

  const [device, setDevice] = useState<DeviceMode>('desktop')
  const [tab, setTab] = useState<Tab>('sections')
  const [sectionView, setSectionView] = useState<SectionView>('list')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [customSections, setCustomSections] = useState<CustomSection[]>(initialCustomSections ?? [])
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(
    (initialHeroSlides && initialHeroSlides.length > 0) ? initialHeroSlides : DEFAULT_SLIDES
  )
  const [activeHeroSlide, setActiveHeroSlide] = useState<number | null>(null)
  const [storePages, setStorePages] = useState<StorePage[]>([])
  const [activePage, setActivePage] = useState<StorePage | null>(null)
  const activePageRef = useRef<StorePage | null>(null)
  const [systemPageSlug, setSystemPageSlug] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [showAddPageModal, setShowAddPageModal] = useState(false)
  // Creating a page from the page picker means "take me there". Creating one
  // from the footer panel means "add it to the footer" — jumping to a blank
  // new page would throw away what they were doing.
  const [addPageOrigin, setAddPageOrigin] = useState<'picker' | 'footer'>('picker')
  // null = closed. { productId: null } opens the create form, an id opens edit.
  const [productModal, setProductModal] = useState<{ productId: string | null } | null>(null)
  // Below lg the panel overlays the preview instead of sitting beside it: at
  // 288px wide it left barely a hundred pixels of phone screen for the store.
  const [panelOpen, setPanelOpen] = useState(false)

  /**
   * How tall the phone sheet is, as a percentage of the area under the
   * toolbar. Two snap points: PEEK leaves the preview you tapped visible
   * above it, FULL is for when the panel is the work rather than the check.
   */
  const SHEET_PEEK = 66
  /**
   * Arriving and leaving, as duration-and-curve pairs. The sheet, the bar it
   * turns into and the dim behind them all take these, so the three move as
   * one object rather than three things that happen to start together.
   *
   * One curve and one duration for both directions, so leaving really is the
   * arrival run backwards. A shorter exit sounds right in theory and reads as
   * a snap in practice: next to a 440ms entry, anything quicker stops looking
   * decisive and starts looking like the animation failed.
   *
   * The sheet needs its own copies carrying `max-lg:`. Its transition-property
   * is written as `max-lg:transition-[transform,height]`, and a Tailwind
   * transition utility also emits a default duration and timing function
   * alongside the property. Those land inside the media query, so an
   * unprefixed `duration-*` sitting outside one loses to them however specific
   * it looks, and the sheet quietly ran at the 150ms default.
   */
  const SHEET_IN = 'duration-[440ms] ease-[cubic-bezier(0.22,0.32,0.16,1)]'
  const SHEET_OUT = 'duration-[440ms] ease-[cubic-bezier(0.22,0.32,0.16,1)]'
  const SHEET_IN_MQ = 'max-lg:duration-[440ms] max-lg:ease-[cubic-bezier(0.22,0.32,0.16,1)]'
  const SHEET_OUT_MQ = 'max-lg:duration-[440ms] max-lg:ease-[cubic-bezier(0.22,0.32,0.16,1)]'
  /** In step with SHEET_OUT, so the reset lands after the sheet is gone. */
  const SHEET_MS = 440
  const SHEET_FULL = 90
  /** Drag below this and the gesture means close, not resize. */
  const SHEET_DISMISS = 38
  const [sheetPct, setSheetPct] = useState(SHEET_PEEK)
  const [sheetDragging, setSheetDragging] = useState(false)
  /**
   * True for one animation after a drag ends, and only then.
   *
   * Height is the expensive thing to transition here: the sheet holds the
   * whole panel, so an animated height re-lays-out that entire subtree every
   * frame. It is worth paying for a snap, which is a movement of the height
   * itself, and it is pure waste on open and close, where the height does not
   * change and only the transform does.
   */
  const [sheetSnapping, setSheetSnapping] = useState(false)
  const asideRef = useRef<HTMLElement>(null)
  const sheetDrag = useRef<{ y: number; pct: number; h: number; moved: boolean } | null>(null)

  /**
   * Send the sheet away, then put it back to its usual size once it is out of
   * sight. Resizing it on the way out means it shrinks and slides at the same
   * time, which reads as two movements fighting rather than one leaving.
   */
  function closeSheet() {
    setPanelOpen(false)
    setTimeout(() => setSheetPct(SHEET_PEEK), SHEET_MS)
  }

  const peekDrag = useRef<number | null>(null)

  /**
   * Pull the bar up to open the sheet. A few pixels is enough: this is a
   * gesture with one destination, so the only question is whether it was a
   * drag at all.
   */
  function peekPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('button')) return
    peekDrag.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function peekPointerMove(e: React.PointerEvent) {
    if (peekDrag.current === null) return
    if (peekDrag.current - e.clientY > 8) {
      peekDrag.current = null
      setPanelOpen(true)
    }
  }

  function peekPointerUp() {
    peekDrag.current = null
  }

  function sheetPointerDown(e: React.PointerEvent) {
    // The Close button lives in this bar too, and a press on it is a press,
    // not the start of a drag.
    if ((e.target as HTMLElement).closest('button')) return
    const area = asideRef.current?.parentElement?.getBoundingClientRect()
    if (!area) return
    sheetDrag.current = { y: e.clientY, pct: sheetPct, h: area.height, moved: false }
    setSheetDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function sheetPointerMove(e: React.PointerEvent) {
    const d = sheetDrag.current
    if (!d) return
    // Up is taller, so the delta is inverted against screen coordinates.
    const travel = d.y - e.clientY
    // A few pixels of slop, so a tap with an unsteady thumb is still a tap.
    if (Math.abs(travel) > 4) d.moved = true
    if (!d.moved) return
    const next = d.pct + (travel / d.h) * 100
    setSheetPct(Math.min(SHEET_FULL, Math.max(20, next)))
  }

  function sheetPointerUp() {
    const d = sheetDrag.current
    if (!d) return
    sheetDrag.current = null
    setSheetDragging(false)
    setSheetSnapping(true)
    setTimeout(() => setSheetSnapping(false), SHEET_MS)
    // Pressed, not dragged: the bar is the sheet's own close button.
    if (!d.moved) {
      closeSheet()
      return
    }
    if (sheetPct < SHEET_DISMISS) {
      closeSheet()
      return
    }
    // Nearest of the two, so it always lands somewhere deliberate.
    const mid = (SHEET_PEEK + SHEET_FULL) / 2
    setSheetPct(sheetPct < mid ? SHEET_PEEK : SHEET_FULL)
  }

  // Steering the panel is not the same as showing it. On a desk the panel is
  // always there, so navigating it is the whole of the feedback for a click
  // in the preview; below lg it is a closed sheet, and the same navigation
  // happens where nobody can see it. So the message handlers below open it,
  // which is a no-op on a desk because panelOpen only drives the max-lg
  // transform. setPanelOpen is stable, so they need no dependency for it.
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [reordering, setReordering] = useState(false)
  /** Scale that fits the whole page in view, worked out when a drag begins. */
  const [dragZoom, setDragZoom] = useState(0.62)
  const [dragPageHeight, setDragPageHeight] = useState<number | null>(null)
  /**
   * Whether the whole band fitted on screen at a usable zoom.
   *
   * When it did, the page must not scroll — everything is already visible and
   * moving it would slide the target out from under the cursor. When it did
   * not, the opposite is true: sections below the fold are unreachable unless
   * the preview follows the drag down to them.
   */
  const dragFitsRef = useRef(true)

  /**
   * Fit the template band, not the whole document.
   *
   * Only the reorderable sections matter while dragging — the header, footer
   * and anything else fixed above or below them are not going anywhere. Fitting
   * the entire page meant that a store with a few custom sections zoomed out
   * until nothing was legible, which defeats the point of zooming out at all.
   *
   * Floored at MIN_DRAG_ZOOM: past that the sections stop being recognisable,
   * and a band that still does not fit is better scrolled than squinted at.
   */
  useEffect(() => {
    if (!reordering) return
    const frame = iframeRef.current
    const box = frame?.parentElement
    try {
      const doc = frame?.contentDocument
      const win = frame?.contentWindow
      if (!doc || !win || !box) return

      const sections = Array.from(
        doc.querySelectorAll('[id^="section-hero"], [id^="section-products"], [id^="section-custom-"]'),
      ) as HTMLElement[]
      if (sections.length === 0) return

      const tops = sections.map(el => el.offsetTop)
      const bottoms = sections.map(el => el.offsetTop + el.offsetHeight)
      const bandTop = Math.min(...tops)
      const bandHeight = Math.max(...bottoms) - bandTop
      const boxHeight = box.clientHeight
      if (bandHeight <= 0 || boxHeight <= 0) return

      const ideal = boxHeight / bandHeight
      dragFitsRef.current = ideal >= MIN_DRAG_ZOOM
      setDragPageHeight(doc.documentElement.scrollHeight)
      setDragZoom(Math.max(MIN_DRAG_ZOOM, Math.min(1, ideal)))
      // Once, as the drag begins: bring the band into view and then leave the
      // page alone, so the target does not slide out from under the cursor.
      win.scrollTo({ top: Math.max(0, bandTop - 8), behavior: 'auto' })
    } catch {
      // Refused for any reason: the fixed fallback zoom still applies.
    }
  }, [reordering])
  /**
   * The preview follows a drag: as a row passes over a position, the page
   * scrolls to the section that sits there and outlines it, so the drop lands
   * somewhere you can see.
   *
   * An earlier attempt shrank the whole page to 62% instead. It did show more
   * at once, but it moved the thing being edited away from the cursor and made
   * the type unreadable, which is presumably why Shopify does not do it either.
   *
   * The keys the list uses are section-order keys, and the storefront's element
   * ids differ for custom sections, so they are translated here rather than in
   * the list, which should not have to know how the store marks itself up.
   */
  /**
   * Show an order without adopting it.
   *
   * Deliberately not routed through updateTheme: a drag that is abandoned
   * halfway must not leave the store reordered, or land in the undo history as
   * a change the merchant never made. The preview reads theme.sectionOrder, so
   * posting a copy of the theme with a different order is enough to rearrange
   * the page, and passing null posts the real one back.
   */
  function previewOrder(keys: string[] | null) {
    const sectionOrder = keys ? serializeSectionOrder(keys) : themeRef.current.sectionOrder
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'theme:update', theme: { ...themeRef.current, sectionOrder } },
      '*',
    )
  }

  function highlightDragTarget(key: string | null) {
    // A distinct message from section:highlight, which pulses for a moment and
    // fades — right for "you clicked this, here it is", wrong for a drag. This
    // one holds the outline until the drag ends, and null clears it.
    const section = key
      ? key.startsWith('custom:')
        ? `custom-${key.slice('custom:'.length)}`
        : key
      : null
    iframeRef.current?.contentWindow?.postMessage({ type: 'section:drag', section }, '*')

    if (!section || dragFitsRef.current) return
    try {
      const doc = iframeRef.current?.contentDocument
      const win = iframeRef.current?.contentWindow
      const el = doc?.getElementById(`section-${section}`)
      if (el && win) {
        // Centre it in what is visible, rather than scrollIntoView, which
        // scrolls this dashboard as well as the frame inside it.
        const target = el.offsetTop - (win.innerHeight - el.offsetHeight) / 2
        win.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
      }
    } catch {
      // Cross-origin refusal: the outline still moves, the page just will not.
    }
  }

  function togglePanel() {
    if (window.matchMedia('(min-width: 1024px)').matches) setPanelCollapsed(v => !v)
    else setPanelOpen(v => !v)
  }
  // Deep link in from elsewhere in the admin. Settings points here for the
  // logo, and dropping someone on the section list would leave them to hunt
  // for it -- so ?section=header&field=header-logo opens that panel and blinks
  // the field, the same treatment as clicking the logo in the preview.
  //
  // Read from location rather than useSearchParams: this only needs to happen
  // once on mount, and useSearchParams drags a Suspense requirement with it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const section = params.get('section')
    if (!section || !(SECTION_VIEWS as readonly string[]).includes(section)) return
    const field = params.get('field')

    setSectionView(section as SectionView)
    setPanelOpen(true)
    // A frame is not enough: the panel has to actually render before it can be
    // pulsed, and setSectionView has only just been queued.
    setTimeout(() => {
      triggerSidebarPulse()
      if (field) setTimeout(() => pulseField(field), 220)
    }, 80)

    // Drop the params so a refresh does not replay the animation.
    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  const [customSectionFocus, setCustomSectionFocus] = useState<{ id: string; ts: number } | null>(null)
  const [pageContentNav, setPageContentNav] = useState<{ section: string; ts: number } | null>(null)

  const [theme, setTheme] = useState<ThemeState>({
    primaryColor:    initialTheme?.primaryColor    ?? '#0a0a0a',
    backgroundColor: initialTheme?.backgroundColor ?? '#ffffff',
    footerColor:     initialTheme?.footerColor     ?? '#f4f4f5',
    accentColor:     initialTheme?.accentColor     ?? '#000000',
    textColor:       initialTheme?.textColor       ?? '#09090b',
    font:            initialTheme?.font            ?? 'sans',
    headingFont:     initialTheme?.headingFont     ?? 'sans',
    borderRadius:    initialTheme?.borderRadius    ?? '0.75rem',
    buttonStyle:     initialTheme?.buttonStyle     ?? 'solid',
    layout:          initialTheme?.layout          ?? 'grid',
    carouselOnMobile: initialTheme?.carouselOnMobile ?? false,
    bannerText:      initialTheme?.bannerText      ?? 'Welcome to our store',
    showBanner:      initialTheme?.showBanner      ?? true,
    logoUrl:         initialTheme?.logoUrl         ?? '',
    logoWidth:       initialTheme?.logoWidth       ?? 120,
    logoHeight:      initialTheme?.logoHeight      ?? 48,
    headerLayout:    initialTheme?.headerLayout    ?? 'left',
    menuPosition: initialTheme?.menuPosition ?? 'auto',
    headerWidth: initialTheme?.headerWidth ?? 'page',
    headerHeight: initialTheme?.headerHeight ?? 'standard',
    headerSticky: initialTheme?.headerSticky ?? true,
    headerBorderWidth: initialTheme?.headerBorderWidth ?? 1,
    headerBgColor: initialTheme?.headerBgColor ?? '',
    headerTextColor: initialTheme?.headerTextColor ?? '',
    utilityStyle: initialTheme?.utilityStyle ?? 'icons',
    headerTransparent: initialTheme?.headerTransparent ?? false,
    headerInverseLogoUrl: initialTheme?.headerInverseLogoUrl ?? '',
    headerTransparentText: initialTheme?.headerTransparentText ?? '#ffffff',
    footerText:      initialTheme?.footerText      ?? '',
    seoTitle:        initialTheme?.seoTitle        ?? '',
    seoDescription:  initialTheme?.seoDescription  ?? '',
    faviconUrl:      initialTheme?.faviconUrl      ?? '',
    sectionOrder:    initialTheme?.sectionOrder    ?? '',
    footerNewsletter:        initialTheme?.footerNewsletter        ?? true,
    footerNewsletterHeading: initialTheme?.footerNewsletterHeading ?? '',
    footerNewsletterText:    initialTheme?.footerNewsletterText    ?? '',
    footerShowLinks:         initialTheme?.footerShowLinks         ?? true,
    footerLogoUrl:   initialTheme?.footerLogoUrl   ?? '',
    footerLogoWidth: initialTheme?.footerLogoWidth ?? 130,
    footerLogoHeight: initialTheme?.footerLogoHeight ?? 56,
    instagramHandle: initialTheme?.instagramHandle ?? '',
    twitterHandle:   initialTheme?.twitterHandle   ?? '',
    facebookUrl:     initialTheme?.facebookUrl     ?? '',
    cardShadow:      initialTheme?.cardShadow      ?? 'none',
    dividerStyle:    initialTheme?.dividerStyle    ?? 'none',
    shopAllLabel:        initialTheme?.shopAllLabel        ?? 'Shop All Products',
    featuredLabel:       initialTheme?.featuredLabel       ?? 'Featured Products',
    featuredLabelLevel:  initialTheme?.featuredLabelLevel  ?? '',
    productsPageHeading: initialTheme?.productsPageHeading ?? '',
    productGridBg:          initialTheme?.productGridBg          ?? '#ffffff',
    productImageRadius:     initialTheme?.productImageRadius     ?? '',
    productGridButtonColor: initialTheme?.productGridButtonColor ?? '',
    productGridTextColor:   initialTheme?.productGridTextColor   ?? '',
    productGridFont:        initialTheme?.productGridFont        ?? '',
    customCss:              initialTheme?.customCss              ?? '',
    customHead:             initialTheme?.customHead             ?? '',
    // Product title block
    productTitleWidth:         initialTheme?.productTitleWidth         ?? 'fill',
    productTitleAlign:         initialTheme?.productTitleAlign         ?? 'left',
    productTitlePreset:        initialTheme?.productTitlePreset        ?? 'default',
    productTitleBg:            initialTheme?.productTitleBg            ?? '',
    productTitlePaddingTop:    initialTheme?.productTitlePaddingTop    ?? 4,
    productTitlePaddingBottom: initialTheme?.productTitlePaddingBottom ?? 0,
    productTitlePaddingLeft:   initialTheme?.productTitlePaddingLeft   ?? 0,
    productTitlePaddingRight:  initialTheme?.productTitlePaddingRight  ?? 0,
    // Product price block
    productPricePreset:        initialTheme?.productPricePreset        ?? 'h6',
    productPriceWidth:         initialTheme?.productPriceWidth         ?? 'fit',
    productPriceAlign:         initialTheme?.productPriceAlign         ?? 'left',
    productPriceTextColor:     initialTheme?.productPriceTextColor     ?? '',
    productPricePaddingTop:    initialTheme?.productPricePaddingTop    ?? 0,
    productPricePaddingBottom: initialTheme?.productPricePaddingBottom ?? 0,
    productPricePaddingLeft:   initialTheme?.productPricePaddingLeft   ?? 0,
    productPricePaddingRight:  initialTheme?.productPricePaddingRight  ?? 0,
    // Cart button block
    cartBtnLabel:         initialTheme?.cartBtnLabel         ?? '',
    cartBtnBgColor:       initialTheme?.cartBtnBgColor       ?? '',
    cartBtnTextColor:     initialTheme?.cartBtnTextColor     ?? '',
    cartBtnDisplay:       initialTheme?.cartBtnDisplay       ?? 'always',
    cartBtnShowIcon:      initialTheme?.cartBtnShowIcon      ?? true,
    cartBtnWidth:         initialTheme?.cartBtnWidth         ?? 'fill',
    cartBtnFontSize:      initialTheme?.cartBtnFontSize      ?? 0,
    cartBtnPaddingTop:    initialTheme?.cartBtnPaddingTop    ?? 5,
    cartBtnPaddingBottom: initialTheme?.cartBtnPaddingBottom ?? 5,
    cartBtnPaddingLeft:   initialTheme?.cartBtnPaddingLeft   ?? 0,
    cartBtnPaddingRight:  initialTheme?.cartBtnPaddingRight  ?? 0,
    // Navigation
    navLinks:    initialTheme?.navLinks    ?? [],
    navFontSize: initialTheme?.navFontSize ?? 14,
    navCase:     initialTheme?.navCase     ?? 'normal',
    navDividers: initialTheme?.navDividers ?? false,
    // Category filter
    catBackLabel:          initialTheme?.catBackLabel          ?? 'Back to store',
    catFilterRadius:       initialTheme?.catFilterRadius       ?? '9999px',
    catFilterFontSize:     initialTheme?.catFilterFontSize     ?? 12,
    catFilterFont:         initialTheme?.catFilterFont         ?? '',
    catFilterCase:         initialTheme?.catFilterCase         ?? 'uppercase',
    catFilterActiveBg:     initialTheme?.catFilterActiveBg     ?? '',
    catFilterActiveText:   initialTheme?.catFilterActiveText   ?? '#ffffff',
    catFilterInactiveBg:   initialTheme?.catFilterInactiveBg   ?? '',
    catFilterInactiveText: initialTheme?.catFilterInactiveText ?? '',
    catFilterPaddingX:     initialTheme?.catFilterPaddingX     ?? 16,
    catFilterPaddingY:     initialTheme?.catFilterPaddingY     ?? 6,
    catBackFont:           initialTheme?.catBackFont           ?? '',
    catFilterFontWeight:   initialTheme?.catFilterFontWeight   ?? 'bold',
  })

  // dbStoreName = confirmed name in database (used for field init on remount)
  // previewStoreName = live typing value (used for iframe postMessage only)
  const [dbStoreName, setDbStoreName] = useState(storeName)
  const [previewStoreName, setPreviewStoreName] = useState(storeName)
  /**
   * One entry is the whole editable document: the theme and the hero slides,
   * the same pair handleSave writes. Two stacks, so an undo can be taken
   * back.
   */
  type Snapshot = { theme: ThemeState; heroSlides: HeroSlide[] }
  const [past, setPast] = useState<Snapshot[]>([])
  const [future, setFuture] = useState<Snapshot[]>([])
  /**
   * When the last entry was pushed. Typing in a field fires a change per
   * keystroke, and an undo stack at that resolution means twenty presses to
   * take back one word, so changes that arrive within half a second of the
   * previous one fold into it: the entry already holds the state from before
   * the burst started, which is the one anybody wants back.
   */
  const lastRecordAt = useRef(0)
  const [iframeLoading, setIframeLoading] = useState(false)

  // Refs so page:ready handler always has current values without stale closures
  const themeRef = useRef(theme)
  useEffect(() => { themeRef.current = theme }, [theme])
  const storeNameRef = useRef(dbStoreName)
  useEffect(() => { storeNameRef.current = dbStoreName }, [dbStoreName])

  // Fetch store pages on mount
  useEffect(() => {
    fetch(`/api/stores/${storeId}/pages`)
      .then(r => r.ok ? r.json() : [])
      .then(setStorePages)
      .catch(() => {})
  }, [storeId])

  // Keep ref in sync so event listeners don't capture stale activePage
  useEffect(() => {
    activePageRef.current = activePage
  }, [activePage])

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [pickerOpen])

  useEffect(() => {
    function handleSectionEdit(e: MessageEvent) {
      if (e.data?.type !== 'section:edit') return
      setTab('sections')
      setSectionView(e.data.section as SectionView)
      nudgePeekBar()
      triggerSidebarPulse()
    }
    window.addEventListener('message', handleSectionEdit)
    return () => window.removeEventListener('message', handleSectionEdit)
  }, [])

  const [openAddSection, setOpenAddSection] = useState<number | null>(null)

  // Consumed once. CustomSectionsEdit tracks "the picker was dismissed" in its
  // own state, which is lost when the panel unmounts — so leaving the custom
  // view and coming back made a still-set timestamp reopen the picker on its
  // own. Clearing it here means only a fresh click opens it.
  useEffect(() => {
    if (sectionView !== 'custom') setOpenAddSection(null)
  }, [sectionView])
  useEffect(() => {
    function handleAddSection(e: MessageEvent) {
      if (e.data?.type !== 'add-section') return
      setTab('sections')
      setSectionView('custom')
      nudgePeekBar()
      triggerSidebarPulse()
      // Timestamped so repeated clicks re-open it.
      setOpenAddSection(Date.now())
    }
    window.addEventListener('message', handleAddSection)
    return () => window.removeEventListener('message', handleAddSection)
  }, [])

  useEffect(() => {
    function handleAddProduct(e: MessageEvent) {
      if (e.data?.type !== 'add-product') return
      setProductModal({ productId: null })
    }
    window.addEventListener('message', handleAddProduct)
    return () => window.removeEventListener('message', handleAddProduct)
  }, [])

  useEffect(() => {
    function handleEditProduct(e: MessageEvent) {
      if (e.data?.type !== 'edit-product') return
      setProductModal({ productId: e.data.productId })
    }
    window.addEventListener('message', handleEditProduct)
    return () => window.removeEventListener('message', handleEditProduct)
  }, [])

  useEffect(() => {
    function handleFieldFocus(e: MessageEvent) {
      if (e.data?.type !== 'field:focus') return
      const { section, field, slideIndex, sectionId } = e.data
      setTab('sections')
      nudgePeekBar()

      if (activePageRef.current) {
        // Viewing a custom page — drive PageContentEdit navigation
        if (section === 'custom' && sectionId) {
          setCustomSectionFocus({ id: sectionId, ts: Date.now() })
          setPageContentNav({ section: 'custom', ts: Date.now() })
        } else {
          setPageContentNav({ section, ts: Date.now() })
        }
        setTimeout(() => pulseField(field), 250)
      } else {
        // Nav menu panel
        if (section === 'header' && field === 'header-nav') {
          setSectionView('nav-menu')
          triggerSidebarPulse()
          return
        }
        // Category filter panel (back link or filter tabs)
        if (section === 'products' && (field === 'products-categories' || field === 'products-back')) {
          setSectionView('category-filter')
          triggerSidebarPulse()
          setTimeout(() => pulseField(field === 'products-back' ? 'cat-back-label' : 'cat-filter-tabs'), 200)
          return
        }
        // Product sub-field panels — navigate to dedicated panel, highlight all instances
        if (section === 'products' && (field === 'product-title' || field === 'product-price' || field === 'add-to-cart-btn')) {
          setSectionView(field === 'add-to-cart-btn' ? 'product-cart' : field as SectionView)
          iframeRef.current?.contentWindow?.postMessage({ type: 'product-field:activate', field }, '*')
          return
        }
        // Home page — drive sectionView directly
        setSectionView(section as SectionView)
        if (section === 'hero' && typeof slideIndex === 'number') {
          setActiveHeroSlide(slideIndex)
        }
        if (section === 'custom' && sectionId) {
          setCustomSectionFocus({ id: sectionId, ts: Date.now() })
        }
        setTimeout(() => pulseField(field), 120)
      }
    }
    window.addEventListener('message', handleFieldFocus)
    return () => window.removeEventListener('message', handleFieldFocus)
  }, [])

  // When a sub-page mounts inside the iframe it sends page:ready — resend the current theme
  useEffect(() => {
    function handlePageReady(e: MessageEvent) {
      if (e.data?.type !== 'page:ready') return
      const win = iframeRef.current?.contentWindow
      if (!win) return
      win.postMessage({ type: 'theme:update', theme: themeRef.current }, '*')
      win.postMessage({ type: 'store-name:update', name: storeNameRef.current }, '*')
    }
    window.addEventListener('message', handlePageReady)
    return () => window.removeEventListener('message', handlePageReady)
  }, [])


  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'theme:update', theme }, '*')
  }, [theme])

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'store-name:update', name: previewStoreName }, '*')
  }, [previewStoreName])

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'custom-sections:update', sections: customSections }, '*')
  }, [customSections])

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'hero:update', slides: heroSlides }, '*')
  }, [heroSlides])

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'hero:active', index: activeHeroSlide }, '*')
  }, [activeHeroSlide])

  useEffect(() => {
    if (sectionView !== 'hero') setActiveHeroSlide(null)
  }, [sectionView])

  useEffect(() => {
    if (sectionView !== 'product-title' && sectionView !== 'product-price' && sectionView !== 'product-cart') {
      iframeRef.current?.contentWindow?.postMessage({ type: 'product-field:activate', field: null }, '*')
    }
  }, [sectionView])

  function handleIframeLoad() {
    setIframeLoading(false)
    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.postMessage({ type: 'theme:update', theme }, '*')
    win.postMessage({ type: 'custom-sections:update', sections: customSections }, '*')
    win.postMessage({ type: 'hero:update', slides: heroSlides }, '*')
    if (activePage) {
      win.postMessage({ type: 'page-content:update', content: activePage.content }, '*')
    }
  }

  /**
   * Take a copy of where things stand, before changing them. Redo is dropped
   * on any new edit, which is the usual rule: once you have gone a different
   * way, the way you came back from no longer exists.
   */
  function record() {
    const now = Date.now()
    const burst = now - lastRecordAt.current < 500
    lastRecordAt.current = now
    setFuture([])
    if (burst) return
    setPast(p => [...p.slice(-40), { theme, heroSlides }])
  }

  function applySnapshot(s: Snapshot) {
    setTheme(s.theme)
    setHeroSlides(s.heroSlides)
    // Both have an effect watching them that pushes to the preview, so
    // restoring the state is all it takes to restore what is on screen.
  }

  function updateTheme(patch: Partial<ThemeState>) {
    record()
    setTheme(t => ({ ...t, ...patch }))
  }

  /** Hero slides go through here so they land in the history as well. */
  function changeHeroSlides(next: HeroSlide[]) {
    record()
    setHeroSlides(next)
  }

  function undo() {
    if (past.length === 0) return
    const prev = past[past.length - 1]
    setPast(p => p.slice(0, -1))
    setFuture(f => [{ theme, heroSlides }, ...f])
    // A restore is not an edit, so the next real edit must not fold into it.
    lastRecordAt.current = 0
    applySnapshot(prev)
  }

  function redo() {
    if (future.length === 0) return
    const next = future[0]
    setFuture(f => f.slice(1))
    setPast(p => [...p, { theme, heroSlides }])
    lastRecordAt.current = 0
    applySnapshot(next)
  }

function handlePageContentChange(content: unknown) {
    if (!activePage) return
    const updated = { ...activePage, content }
    setActivePage(updated)
    iframeRef.current?.contentWindow?.postMessage({ type: 'page-content:update', content }, '*')
  }

  /**
   * Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z, plus Ctrl+Y for the Windows habit.
   *
   * Skipped while the focus is in a field: there the browser's own undo is
   * the right one, and stealing it would mean a mistyped heading could only
   * be fixed by rolling back the whole document.
   *
   * Both functions close over the current stacks and are rebuilt every
   * render, so the listener reads them through a ref rather than depending on
   * them. Depending on them would rebind the handler on every keystroke in
   * the editor; capturing them once would leave it undoing its way back to
   * the same first entry for ever.
   */
  const undoRedoRef = useRef({ undo, redo })
  useEffect(() => { undoRedoRef.current = { undo, redo } })

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return
      const el = e.target as HTMLElement | null
      if (el?.closest('input, textarea, select, [contenteditable="true"]')) return
      const k = e.key.toLowerCase()
      if (k === 'z') {
        e.preventDefault()
        if (e.shiftKey) undoRedoRef.current.redo()
        else undoRedoRef.current.undo()
      } else if (k === 'y') {
        e.preventDefault()
        undoRedoRef.current.redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handlePageCreated(page: StorePage) {
    setStorePages(prev => {
      if (prev.some(p => p.id === page.id)) return prev
      return [...prev, page]
    })
    setActivePage(page)
  }

  function handlePageSelect(pageId: string) {
    setPickerOpen(false)
    if (pageId === '__home__') {
      setActivePage(null)
      setSystemPageSlug(null)
      setSectionView('list')
    } else {
      const found = storePages.find(p => p.id === pageId)
      if (found) { setActivePage(found); setSystemPageSlug(null) }
    }
  }

  function handleSystemPageSelect(slug: string) {
    setPickerOpen(false)
    setActivePage(null)
    setSystemPageSlug(slug)
    setSectionView('list')
  }

  function handleAddPageModalCreated(page: PageResult) {
    if (addPageOrigin === 'footer') {
      setStorePages(prev => (prev.some(p => p.id === page.id) ? prev : [...prev, page as StorePage]))
      // The footer reads its links once when it mounts, so the preview has to
      // reload before a new page shows up down there.
      refreshPreview()
    } else {
      handlePageCreated(page as StorePage)
    }
    setShowAddPageModal(false)
    setAddPageOrigin('picker')
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/stores/${storeId}/theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...theme, heroSlides }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      // The sidebar's store chip is rendered on the server from this theme,
      // so without this a saved logo or favicon does not appear until a full
      // page load -- which reads as the save having done nothing.
      router.refresh()
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const iframeSrc = activePage
    ? `/store/${subdomain}/${activePage.slug}`
    : systemPageSlug
      ? `/store/${subdomain}/${systemPageSlug}`
      : `/store/${subdomain}`

  useEffect(() => {
    setIframeLoading(true)
  }, [iframeSrc])

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'sections',  label: 'Sections',  icon: Layers },
    { id: 'theme', label: 'Theme', icon: Palette },
  ]

  const activeSystemPage = systemPageSlug ? SYSTEM_PAGES.find(p => p.slug === systemPageSlug) : null
  const currentPageName = activePage ? activePage.name : activeSystemPage ? activeSystemPage.name : 'Home'
  // The section wins when there is one: on a phone the sheet is small enough
  // that "Home" tells you nothing you did not already know from the preview
  // behind it, while "Hero" is the answer to what you just tapped.
  const sheetTitle = (tab === 'theme' ? 'Theme' : SECTION_LABELS[sectionView]) || currentPageName

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-zinc-900 z-50">
      {/* Top bar */}
      <div className="h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 px-2 sm:px-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href={`/dashboard/stores/${storeId}/theme`}
            aria-label="Exit the editor"
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            {/* The chevron says "back" on its own where space is short. */}
            <span className="hidden sm:inline">Exit</span>
          </Link>
          <div className="hidden sm:block h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
          <span className="text-zinc-900 dark:text-white text-sm font-semibold truncate">{subdomain}</span>
        </div>
        {/* Choosing a device preview is a desktop job: on a phone you are
            already looking at the mobile width, and the three buttons were
            taking a third of the bar to say so. */}
        <div className="hidden sm:flex flex-1 items-center justify-center">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
            {([
              { id: 'desktop', icon: Monitor },
              { id: 'tablet', icon: Tablet },
              { id: 'mobile', icon: Smartphone },
            ] as const).map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setDevice(id)}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: device === id ? '#fff' : 'transparent', color: device === id ? '#000' : '#71717a' }}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-1 sm:flex-none items-center gap-1 sm:gap-2 justify-end">
          <button
            onClick={togglePanel}
            aria-label="Toggle settings panel"
            title="Toggle settings panel"
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <button
            onClick={undo}
            disabled={past.length === 0}
            title="Undo"
            aria-label="Undo"
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            title="Redo"
            aria-label="Redo"
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <Link href={storeUrl(subdomain, '?owner=1')} target="_blank" className="group relative p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Eye className="w-4 h-4" />
            {/* z-50 because this hangs below the toolbar and into the preview,
                which is a later sibling: without it the preview paints over
                the tooltip and the label reads as though it were underneath
                the page. Colours follow the admin theme like everything else
                in this file, rather than being dark in both. */}
            <span className="absolute right-0 top-full mt-1.5 z-50 px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">View Store</span>
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-[13px] font-semibold tracking-[-0.01em] text-white dark:text-zinc-900 shadow-sm transition-all hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative bg-zinc-100 dark:bg-zinc-950">
        <div
          className={`lg:hidden absolute inset-0 z-30 bg-black/40 transition-opacity ${panelOpen ? SHEET_IN : SHEET_OUT} ${
            panelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeSheet}
          aria-hidden
        />
        <aside
          // The transform is confined to max-lg, where it actually drives the
          // drawer. A transform of any kind — `translate-x-0` included — makes
          // this element the containing block for every `position: fixed`
          // descendant, so on desktop the panel was capturing the modals opened
          // from inside it (media library, AI, product picker) and laying them
          // out inside this 288px column instead of over the page.
          // Floats on the dark canvas from lg up: inset, rounded and
          // shadowed, rather than a slab welded to the window edge.
          // overflow-hidden matters — the sticky panel header would otherwise
          // square off the top corners as content scrolls under it.
          //
          // Below lg it comes up from the bottom instead of in from the left.
          // A 288px drawer is a desktop sidebar turned sideways: it covers the
          // preview you are editing against, on the screen with the least of
          // it to spare. As a sheet at two thirds height the section you
          // tapped stays visible above it, which is the whole point of
          // editing against a live preview.
          // The desk width lives in the branch below, not here. Next to a
          // collapsed `lg:w-0` a base `lg:w-72` is the same specificity in the
          // same media query, so which one applies comes down to the order
          // Tailwind emitted them in, and w-72 wins: the panel would not shut.
          className={`w-full bg-white dark:bg-zinc-900 flex flex-col shrink-0 ${sheetDragging
            ? 'max-lg:transition-none'
            : `${sheetSnapping ? 'max-lg:transition-[transform,height]' : 'max-lg:transition-transform'} ${panelOpen ? SHEET_IN_MQ : SHEET_OUT_MQ}`} max-lg:will-change-transform lg:transition-[width,opacity,margin] lg:duration-300 lg:ease-out max-lg:absolute max-lg:inset-x-0 max-lg:bottom-0 max-lg:h-(--sheet-h) max-lg:z-40 max-lg:rounded-t-2xl max-lg:border-t max-lg:border-zinc-200 dark:max-lg:border-zinc-800 max-lg:shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.35)] lg:transform-none lg:mt-1 lg:mr-0 lg:overflow-hidden lg:rounded-2xl lg:border-zinc-200/80 dark:lg:border-zinc-800 lg:shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${panelCollapsed
            ? 'lg:w-0 lg:ml-0 lg:mb-0 lg:border-0 lg:opacity-0 lg:pointer-events-none'
            : 'lg:w-72 lg:ml-1 lg:mb-1 lg:border'} ${
            panelOpen ? 'max-lg:translate-y-0' : 'max-lg:translate-y-full'
          }`}
          ref={asideRef}
          // Only the sheet reads this. Above lg the height is the flex
          // column's business and this variable goes unused.
          style={{ '--sheet-h': `${sheetPct}%` } as React.CSSProperties}
        >

          {/* Only on the sheet. The grab bar says which edge this arrived
              from, and Close is there because the strip of preview left
              above the sheet is a small thing to have to hit. */}
          <div
            onPointerDown={sheetPointerDown}
            onPointerMove={sheetPointerMove}
            onPointerUp={sheetPointerUp}
            onPointerCancel={sheetPointerUp}
            // Without this the browser claims the vertical drag for its own
            // scrolling and the handle never sees the move events.
            style={{ touchAction: 'none' }}
            className="lg:hidden shrink-0 relative flex items-center justify-center px-3 pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing select-none"
          >
            <span className={`absolute left-1/2 top-2.5 -translate-x-1/2 h-1 rounded-full transition-[width,background-color] ${
              sheetDragging ? 'w-12 bg-zinc-400 dark:bg-zinc-500' : 'w-9 bg-zinc-200 dark:bg-zinc-700'
            }`} />

            {/* Close on the left, what you are editing in the middle. The
                title is centred absolutely so it stays centred on the sheet
                rather than on whatever is left over beside the button. */}
            <div className="w-full flex items-center mt-2.5">
              <button
                onClick={closeSheet}
                className="-ml-1 px-2 py-1 text-[12.5px] font-semibold text-zinc-500 dark:text-zinc-400"
              >
                Close
              </button>
              <span className="absolute left-1/2 -translate-x-1/2 max-w-[60%] truncate text-[12.5px] font-bold text-zinc-900 dark:text-zinc-50 pointer-events-none">
                {sheetTitle}
              </span>
            </div>
          </div>

          {/* ── Page picker ── */}
          <div ref={pickerRef} className="px-3 pt-3 max-lg:pt-1 pb-2.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0 relative">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Editing Page</p>
            <button
              onClick={() => setPickerOpen(o => !o)}
              className="w-full flex items-center justify-between gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                {activePage
                  ? <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  : activeSystemPage
                    ? <activeSystemPage.icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    : <Home className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                }
                <span className="truncate">{currentPageName}</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
            </button>

            {pickerOpen && (
              <>
                {/* Click-away overlay */}
                <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
                <div className="absolute left-3 right-3 top-full mt-1 z-20 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden max-h-64 overflow-y-auto thin-scrollbar">
                  {/* Home */}
                  <button
                    onClick={() => handlePageSelect('__home__')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                  >
                    <Home className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className={`flex-1 ${!activePage && !systemPageSlug ? 'font-bold text-zinc-900 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300'}`}>Home</span>
                    {!activePage && !systemPageSlug && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />}
                  </button>

                  {/* System / built-in pages */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800" />
                  <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Built-in Pages</p>
                  {SYSTEM_PAGES.map(p => {
                    const Icon = p.icon
                    const isActive = systemPageSlug === p.slug && !activePage
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSystemPageSelect(p.slug)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <Icon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className={`flex-1 ${isActive ? 'font-bold text-zinc-900 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300'}`}>{p.name}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />}
                      </button>
                    )
                  })}

                  {/* Custom pages */}
                  {storePages.length > 0 && (
                    <>
                      <div className="border-t border-zinc-100 dark:border-zinc-800" />
                      <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Your Pages</p>
                      {storePages.map(p => (
                        <button
                          key={p.id}
                          onClick={() => handlePageSelect(p.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                        >
                          <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className={`flex-1 truncate ${activePage?.id === p.id ? 'font-bold text-zinc-900 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300'}`}>{p.name}</span>
                          {activePage?.id === p.id && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />}
                        </button>
                      ))}
                    </>
                  )}

                  {/* Add New Page */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800" />
                  <button
                    onClick={() => { setPickerOpen(false); setAddPageOrigin('picker'); setShowAddPageModal(true) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="w-4 h-4 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shrink-0">
                      <Plus className="w-2.5 h-2.5 text-white dark:text-zinc-900" />
                    </div>
                    <span className="font-semibold">Add New Page</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Sections / Theme tabs, shown for all pages ── */}
          {/* For home & system pages: hide tabs when drilling into a section editor */}
          {(activePage || sectionView === 'list') && (
            <div className="flex border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setTab(id); if (!activePage) setSectionView('list') }}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
                    tab === id
                      ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-50'
                      : 'border-transparent text-zinc-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          )}

          <div ref={sidebarPanelRef} className="flex-1 overflow-y-auto thin-scrollbar">

            {/* ── Theme tab (global, same for every page) ── */}
            {tab === 'theme' && <ThemePanel theme={theme} updateTheme={updateTheme} />}

            {/* ── Sections tab: user-created pages ── */}
            {tab === 'sections' && activePage && (
              <PageContentEdit
                key={activePage.id}
                storeId={storeId}
                subdomain={subdomain}
                page={activePage}
                onContentChange={handlePageContentChange}
                onSectionsChange={setCustomSections}
                onPageCreated={handlePageCreated}
                onBack={() => setActivePage(null)}
                autoNav={pageContentNav}
                focusSectionId={customSectionFocus}
              />
            )}

            {/* ── Sections tab: home page + system pages (share sectionView state) ── */}
            {tab === 'sections' && !activePage && (
              <>
                {/* Section lists */}
                {sectionView === 'list' && !systemPageSlug && (
                  <SectionsList
                    customSections={customSections}
                    order={resolveSectionOrder(theme.sectionOrder, customSections.filter(c => c.visible).map(c => c.id))}
                    onDragChange={setReordering}
                    onPreviewOrder={previewOrder}
                    onDragOverKey={highlightDragTarget}
                    onReorder={keys => updateTheme({ sectionOrder: serializeSectionOrder(keys) })}
                    onSectionClick={s => { setSectionView(s as SectionView); sendHighlightToPreview(s); triggerSidebarPulse() }}
                    onCustomSectionClick={id => {
                      setSectionView('custom')
                      // Timestamped so clicking the same section twice re-focuses it.
                      setCustomSectionFocus({ id, ts: Date.now() })
                      triggerSidebarPulse()
                    }}
                    onAddSection={() => {
                      setSectionView('custom')
                      setOpenAddSection(Date.now())
                      triggerSidebarPulse()
                    }}
                  />
                )}
                {sectionView === 'list' && systemPageSlug && (
                  <SystemPageEdit
                    slug={systemPageSlug}
                    onSectionClick={view => { setSectionView(view as SectionView); triggerSidebarPulse() }}
                    sendHighlight={sendHighlightToPreview}
                  />
                )}

                {/* Shared section sub-editors (home page + system pages that support them) */}
                {sectionView === 'banner'   && <BannerEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('list')} storeId={storeId} />}
                {sectionView === 'header'   && <HeaderEdit storeId={storeId} theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('list')} />}
                {sectionView === 'hero'     && !systemPageSlug && (
                  <HeroEdit
                    storeId={storeId}
                    subdomain={subdomain}
                    theme={theme}
                    updateTheme={updateTheme}
                    onBack={() => setSectionView('list')}
                    slides={heroSlides}
                    onSlidesChange={changeHeroSlides}
                    editingIndex={activeHeroSlide}
                    onEditingChange={setActiveHeroSlide}
                    onPageCreated={handlePageCreated}
                  />
                )}
                {sectionView === 'products'      && <ProductGridEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('list')} storeId={storeId} isProductsPage={systemPageSlug === 'products'} />}
                {sectionView === 'product-title' && <ProductTitleEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('products')} />}
                {sectionView === 'product-price' && <ProductPriceEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('products')} />}
                {sectionView === 'product-cart'    && <ProductCartButtonEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('products')} storeId={storeId} />}
                {sectionView === 'nav-menu'        && <NavMenuEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('header')} />}
                {sectionView === 'category-filter' && <CategoryFilterEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('list')} storeId={storeId} />}
                {sectionView === 'footer'        && <FooterEdit storeId={storeId} storeName={dbStoreName} onPreviewChange={setPreviewStoreName} onSaveSuccess={name => { setDbStoreName(name); setPreviewStoreName(name) }} theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('list')} pages={storePages} onAddPage={() => { setAddPageOrigin('footer'); setShowAddPageModal(true) }} />}
                {sectionView === 'code'          && !systemPageSlug && <CustomCodeEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('list')} />}
                {sectionView === 'seo'           && !systemPageSlug && (
                  <SeoEdit
                    theme={theme}
                    updateTheme={updateTheme}
                    onBack={() => setSectionView('list')}
                    storeId={storeId}
                    storeName={dbStoreName}
                    storeUrl={storeUrl(subdomain).replace(/^https?:\/\//, '')}
                  />
                )}
                {sectionView === 'custom'        && !systemPageSlug && (
                  <CustomSectionsEdit
            openAddModal={openAddSection}
                    storeId={storeId}
                    subdomain={subdomain}
                    pageId={null}
                    onBack={() => setSectionView('list')}
                    onSectionsChange={setCustomSections}
                    onPageCreated={handlePageCreated}
                    focusSectionId={customSectionFocus}
                    initialSections={customSections.length > 0 ? customSections : undefined}
                  />
                )}
              </>
            )}
          </div>
        </aside>

        {/* What is left when the sheet is down. Dismissing the panel used to
            leave nothing, and the way back was an icon at the top of the
            screen, which is the far end from the thumb that just closed it.
            This is the same row the sheet wears, still reachable. */}
        <div
          ref={peekBarRef}
          // The whole bar opens the sheet, not just the pencil. It went from
          // a button to a div when it grew two controls of its own, and the
          // open handler went with it: the pencil says what a tap does, but
          // the bar is the target people actually aim at. Close and the
          // pencil handle their own clicks and stop them here.
          onClick={e => {
            if ((e.target as HTMLElement).closest('button')) return
            setPanelOpen(true)
          }}
          onPointerDown={peekPointerDown}
          onPointerMove={peekPointerMove}
          onPointerUp={peekPointerUp}
          onPointerCancel={peekPointerUp}
          // Always mounted, never unmounted: a bar that appears the moment
          // the sheet starts leaving arrives before the space for it does.
          // It travels on the sheet's curve and duration, so the two read as
          // one object going up and coming back rather than one dissolving
          // while the other slides.
          aria-hidden={panelOpen}
          // Sits on the bottom edge and fills the width, so the only
          // corners it needs are the two the sheet shows when it rises out of
          // the same place. The safe-area allowance is padding again: the bar
          // is against the edge, so it has to grow to clear the home bar
          // rather than lift off it.
          className={`lg:hidden absolute inset-x-0 bottom-0 z-30 flex items-center gap-2 px-2 pt-1.5 h-14 cursor-grab active:cursor-grabbing select-none bg-white dark:bg-zinc-900 rounded-t-2xl border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-6px_20px_-12px_rgba(0,0,0,0.25)] transition-transform will-change-transform ${panelOpen ? SHEET_IN : SHEET_OUT} ${
            panelOpen ? 'translate-y-full pointer-events-none' : 'translate-y-0'
          }`}
          // touch-action none, or the browser takes the vertical drag for
          // its own scrolling and the handler never sees a move.
          style={{ paddingBottom: 'env(safe-area-inset-bottom)', touchAction: 'none' }}
        >
          {/* The same line the sheet wears, in the same place, because it is
              the same object at a different height. */}
          <span className="absolute left-1/2 top-1.5 -translate-x-1/2 h-1 w-9 rounded-full bg-zinc-200 dark:bg-zinc-700 pointer-events-none" />

          {/* Drops the selection rather than dismissing the bar. After a
              mis-tap in the preview this is what you want, and the bar has
              nowhere to go anyway. */}
          <button
            onClick={() => { setSectionView('list'); setTab('sections') }}
            disabled={panelOpen}
            tabIndex={panelOpen ? -1 : 0}
            className="shrink-0 px-2 py-2 text-[12.5px] font-semibold text-zinc-500 dark:text-zinc-400"
          >
            Close
          </button>

          <span className="absolute left-1/2 -translate-x-1/2 max-w-[55%] truncate text-[12.5px] font-bold text-zinc-900 dark:text-zinc-50 pointer-events-none">
            {sheetTitle}
          </span>

          <button
            onClick={() => setPanelOpen(true)}
            disabled={panelOpen}
            tabIndex={panelOpen ? -1 : 0}
            aria-label={`Edit ${sheetTitle}`}
            className="ml-auto shrink-0 flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-300 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        <main
          className={`flex-1 bg-zinc-100 dark:bg-zinc-950 flex justify-center overflow-hidden ${
            reordering ? 'items-start' : 'items-center'
          // Even on all four edges, and tight: 4px is enough to keep the
          // preview, the toolbar and the panel reading as three surfaces
          // without spending screen on the seams. Tightening only the two
          // shared edges instead made the preview look welded to them. The
          // device modes centre a narrow frame and need room around it.
          } ${device === 'desktop' ? 'p-1' : 'px-5 pb-5 pt-2'} max-lg:pb-14`}
        >
          <div
            // A hairline around the frame, the same one the settings panel
            // wears, so the preview reads as a surface sitting on the canvas
            // rather than a hole cut in it. A ring rather than a border: the
            // frame is sized to 100% of its box, and a border would grow that
            // box by 2px and hand the preview a scrollbar it does not need.
            className={`relative bg-white overflow-hidden ring-1 ring-zinc-200/80 dark:ring-zinc-800 ${
              device === 'desktop' ? 'shadow-[0_1px_4px_rgba(0,0,0,0.06)]' : 'shadow-2xl'
            }`}
            style={{
              width: DEVICE_WIDTHS[device],
              // The frame is given the page's full height and then scaled to
              // fit, which is what puts every section on screen at once.
              height: reordering && dragPageHeight ? `${dragPageHeight}px` : '100%',
              transform: reordering ? `scale(${dragZoom})` : undefined,
              // Top, not centre: while zoomed out the frame is taller than its
              // container, and a centred transform pushes the top of the page
              // off screen — the part you most need when aiming a drop.
              transformOrigin: 'top center',
              // Width and radius belong here too. An inline `transition`
              // replaces the `transition-all` class beside it rather than
              // adding to it, so listing only transform and height meant the
              // width jumped the moment the device buttons were pressed:
              // the class looked like it covered everything and covered
              // nothing.
              transition: 'width 0.3s ease-out, border-radius 0.3s ease-out, transform 0.3s ease-out, height 0.3s ease-out',
              maxWidth: '100%',
              // Squarer on desktop, where the frame is the page itself and a
              // big radius starts eating the corners of the design inside it.
              // The device modes keep theirs: that curve is the phone.
              borderRadius: device === 'desktop' ? '0.625rem' : '1.5rem',
            }}
          >
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              className="w-full h-full border-0"
              title="Store Preview"
              onLoad={handleIframeLoad}
            />
            {iframeLoading && (
              <PageSkeleton
                theme={theme}
                storeName={dbStoreName}
                pageType={activePage?.type ?? systemPageSlug ?? 'home'}
                pageContent={activePage?.content}
                heroSlides={heroSlides}
              />
            )}
          </div>
        </main>
      </div>

      {productModal && (
        <ProductModal
          storeId={storeId}
          productId={productModal.productId}
          onClose={() => setProductModal(null)}
          onSaved={() => {
            // Saving is the end of the task, so the modal gets out of the way
            // rather than leaving the merchant to find the close button and
            // wonder whether it went through.
            refreshPreview()
            setProductModal(null)
          }}
        />
      )}

      {showAddPageModal && (
        <AddPageModal
          storeId={storeId}
          subdomain={subdomain}
          existingPages={storePages}
          onCreated={handleAddPageModalCreated}
          onClose={() => setShowAddPageModal(false)}
        />
      )}
    </div>
  )
}
