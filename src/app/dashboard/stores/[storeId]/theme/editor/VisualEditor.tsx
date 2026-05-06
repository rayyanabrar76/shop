'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Save, Monitor, Smartphone, Tablet,
  Undo2, ChevronLeft, Layers, Palette,
  CheckCircle2, Eye, ChevronDown,
  Home, Globe, Plus, Check,
  ShoppingBag, CreditCard, CheckSquare, LogIn, UserCircle, PackageCheck,
} from 'lucide-react'
import { ThemeState, EDITOR_COLOR } from './types'
import SectionsList from './sections/SectionsList'
import BannerEdit from './sections/BannerEdit'
import HeaderEdit from './sections/HeaderEdit'
import HeroEdit, { type HeroSlide } from './sections/HeroEdit'
import ProductGridEdit from './sections/ProductGridEdit'
import FooterEdit from './sections/FooterEdit'
import CustomSectionsEdit, { type CustomSection } from './sections/CustomSectionsEdit'
import CustomCodeEdit from './sections/CustomCodeEdit'
import ThemePanel, { DARK_PRESET, LIGHT_PRESET } from './panels/ThemePanel'
import PageContentEdit from './sections/PageContentEdit'
import SystemPageEdit from './sections/SystemPageEdit'
import ProductTitleEdit from './sections/ProductTitleEdit'
import ProductPriceEdit from './sections/ProductPriceEdit'
import ProductCartButtonEdit from './sections/ProductCartButtonEdit'
import NavMenuEdit from './sections/NavMenuEdit'
import CategoryFilterEdit from './sections/CategoryFilterEdit'
import PageSkeleton from './PageSkeleton'
import AddPageModal, { type PageResult } from '@/components/AddPageModal'

export interface StorePage {
  id: string
  type: string
  name: string
  slug: string
  content: any
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile'
type Tab = 'sections' | 'theme'
type SectionView = 'list' | 'banner' | 'header' | 'hero' | 'products' | 'footer' | 'custom' | 'code' | 'product-title' | 'product-price' | 'product-cart' | 'nav-menu' | 'category-filter'

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
}: {
  storeId: string
  subdomain: string
  storeName: string
  initialTheme: any
  initialHeroSlides?: HeroSlide[] | null
}) {
  const router = useRouter()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const sidebarPanelRef = useRef<HTMLDivElement>(null)

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

  function sendHighlightToPreview(section: string) {
    iframeRef.current?.contentWindow?.postMessage({ type: 'section:highlight', section }, '*')
  }

  const [device, setDevice] = useState<DeviceMode>('desktop')
  const [tab, setTab] = useState<Tab>('sections')
  const [sectionView, setSectionView] = useState<SectionView>(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('editor-return-section') : null
    if (saved) { sessionStorage.removeItem('editor-return-section'); return saved as SectionView }
    return 'list'
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [customSections, setCustomSections] = useState<CustomSection[]>([])
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
  const [customSectionFocus, setCustomSectionFocus] = useState<{ id: string; ts: number } | null>(null)
  const [pageContentNav, setPageContentNav] = useState<{ section: string; ts: number } | null>(null)

  const [theme, setTheme] = useState<ThemeState>({
    primaryColor:    initialTheme?.primaryColor    ?? '#6c47ff',
    backgroundColor: initialTheme?.backgroundColor ?? '#ffffff',
    footerColor:     initialTheme?.footerColor     ?? '#f4f4f5',
    accentColor:     initialTheme?.accentColor     ?? '#000000',
    textColor:       initialTheme?.textColor       ?? '#09090b',
    font:            initialTheme?.font            ?? 'sans',
    headingFont:     initialTheme?.headingFont     ?? 'sans',
    borderRadius:    initialTheme?.borderRadius    ?? '0.75rem',
    buttonStyle:     initialTheme?.buttonStyle     ?? 'solid',
    layout:          initialTheme?.layout          ?? 'grid',
    bannerText:      initialTheme?.bannerText      ?? 'Welcome to our store',
    showBanner:      initialTheme?.showBanner      ?? true,
    logoUrl:         initialTheme?.logoUrl         ?? '',
    logoWidth:       initialTheme?.logoWidth       ?? 120,
    footerText:      initialTheme?.footerText      ?? '',
    instagramHandle: initialTheme?.instagramHandle ?? '',
    twitterHandle:   initialTheme?.twitterHandle   ?? '',
    facebookUrl:     initialTheme?.facebookUrl     ?? '',
    cardShadow:      initialTheme?.cardShadow      ?? 'none',
    dividerStyle:    initialTheme?.dividerStyle    ?? 'none',
    shopAllLabel:        initialTheme?.shopAllLabel        ?? 'Shop All Products',
    featuredLabel:       initialTheme?.featuredLabel       ?? 'Featured Products',
    productsPageHeading: initialTheme?.productsPageHeading ?? '',
    productGridBg:          initialTheme?.productGridBg          ?? '#ffffff',
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
    darkMode:       initialTheme?.darkMode       ?? false,
    showDarkToggle: initialTheme?.showDarkToggle ?? true,
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

  const [history, setHistory] = useState<ThemeState[]>([])
  const [iframeLoading, setIframeLoading] = useState(false)

  // Ref so page:ready handler always has the current theme without stale closures
  const themeRef = useRef(theme)
  useEffect(() => { themeRef.current = theme }, [theme])

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
      triggerSidebarPulse()
    }
    window.addEventListener('message', handleSectionEdit)
    return () => window.removeEventListener('message', handleSectionEdit)
  }, [])

  useEffect(() => {
    function handleAddProduct(e: MessageEvent) {
      if (e.data?.type !== 'add-product') return
      router.push(`/dashboard/stores/${storeId}/products/create`)
    }
    window.addEventListener('message', handleAddProduct)
    return () => window.removeEventListener('message', handleAddProduct)
  }, [storeId, router])

  const sectionViewRef = useRef<SectionView>('list')
  useEffect(() => { sectionViewRef.current = sectionView }, [sectionView])

  useEffect(() => {
    function handleEditProduct(e: MessageEvent) {
      if (e.data?.type !== 'edit-product') return
      sessionStorage.setItem('editor-return-section', sectionViewRef.current)
      router.push(`/dashboard/stores/${storeId}/products/${e.data.productId}`)
    }
    window.addEventListener('message', handleEditProduct)
    return () => window.removeEventListener('message', handleEditProduct)
  }, [storeId, router])

  useEffect(() => {
    function handleFieldFocus(e: MessageEvent) {
      if (e.data?.type !== 'field:focus') return
      const { section, field, slideIndex, sectionId } = e.data
      setTab('sections')

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
    }
    window.addEventListener('message', handlePageReady)
    return () => window.removeEventListener('message', handlePageReady)
  }, [])

  // Listen for dark mode toggle from the storefront preview
  useEffect(() => {
    function handleDarkToggle(e: MessageEvent) {
      if (e.data?.type !== 'theme:dark-toggle') return
      setTheme(prev => ({ ...prev, ...(e.data.darkMode ? DARK_PRESET : LIGHT_PRESET) }))
    }
    window.addEventListener('message', handleDarkToggle)
    return () => window.removeEventListener('message', handleDarkToggle)
  }, [])

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'theme:update', theme }, '*')
  }, [theme])

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

  function updateTheme(patch: Partial<ThemeState>) {
    setHistory(h => [...h.slice(-20), theme])
    setTheme(t => ({ ...t, ...patch }))
  }

  function undo() {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setTheme(prev)
  }

function handlePageContentChange(content: unknown) {
    if (!activePage) return
    const updated = { ...activePage, content }
    setActivePage(updated)
    iframeRef.current?.contentWindow?.postMessage({ type: 'page-content:update', content }, '*')
  }

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
    handlePageCreated(page as StorePage)
    setShowAddPageModal(false)
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

  return (
    <div className="fixed inset-0 flex flex-col bg-zinc-900 z-50">
      {/* Top bar */}
      <div className="h-14 bg-zinc-900 border-b border-zinc-800 grid grid-cols-3 items-center px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/stores/${storeId}/theme`} className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            <ChevronLeft className="w-4 h-4" /> Exit
          </Link>
          <div className="h-4 w-px bg-zinc-700" />
          <span className="text-white text-sm font-semibold">{subdomain}</span>
        </div>
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1 bg-zinc-800 rounded-xl p-1">
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
        <div className="flex items-center gap-2 justify-end">
          <button onClick={undo} disabled={history.length === 0} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30">
            <Undo2 className="w-4 h-4" />
          </button>
          <Link href={`/store/${subdomain}`} target="_blank" className="group relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <Eye className="w-4 h-4" />
            <span className="absolute right-0 top-full mt-1.5 px-2 py-1 bg-zinc-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">View Store</span>
          </Link>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-50">
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0">

          {/* ── Page picker ── */}
          <div ref={pickerRef} className="px-3 pt-3 pb-2.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0 relative">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">Editing Page</p>
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
                    <Home className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                    <span className={`flex-1 ${!activePage && !systemPageSlug ? 'font-bold text-zinc-900 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300'}`}>Home</span>
                    {!activePage && !systemPageSlug && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />}
                  </button>

                  {/* System / built-in pages */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800" />
                  <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Built-in Pages</p>
                  {SYSTEM_PAGES.map(p => {
                    const Icon = p.icon
                    const isActive = systemPageSlug === p.slug && !activePage
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSystemPageSelect(p.slug)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <Icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                        <span className={`flex-1 ${isActive ? 'font-bold text-zinc-900 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300'}`}>{p.name}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />}
                      </button>
                    )
                  })}

                  {/* Custom pages */}
                  {storePages.length > 0 && (
                    <>
                      <div className="border-t border-zinc-100 dark:border-zinc-800" />
                      <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Your Pages</p>
                      {storePages.map(p => (
                        <button
                          key={p.id}
                          onClick={() => handlePageSelect(p.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                        >
                          <Globe className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                          <span className={`flex-1 truncate ${activePage?.id === p.id ? 'font-bold text-zinc-900 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300'}`}>{p.name}</span>
                          {activePage?.id === p.id && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />}
                        </button>
                      ))}
                    </>
                  )}

                  {/* Add New Page */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800" />
                  <button
                    onClick={() => { setPickerOpen(false); setShowAddPageModal(true) }}
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

          {/* ── Sections / Theme tabs — shown for all pages ── */}
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
                      : 'border-transparent text-zinc-400 dark:text-zinc-500'
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
                  <SectionsList onSectionClick={s => { setSectionView(s as SectionView); sendHighlightToPreview(s); triggerSidebarPulse() }} />
                )}
                {sectionView === 'list' && systemPageSlug && (
                  <SystemPageEdit
                    slug={systemPageSlug}
                    onSectionClick={view => { setSectionView(view as SectionView); triggerSidebarPulse() }}
                    sendHighlight={sendHighlightToPreview}
                  />
                )}

                {/* Shared section sub-editors (home page + system pages that support them) */}
                {sectionView === 'banner'   && <BannerEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('list')} />}
                {sectionView === 'header'   && <HeaderEdit storeId={storeId} theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('list')} />}
                {sectionView === 'hero'     && !systemPageSlug && (
                  <HeroEdit
                    storeId={storeId}
                    subdomain={subdomain}
                    theme={theme}
                    updateTheme={updateTheme}
                    onBack={() => setSectionView('list')}
                    slides={heroSlides}
                    onSlidesChange={setHeroSlides}
                    editingIndex={activeHeroSlide}
                    onEditingChange={setActiveHeroSlide}
                    onPageCreated={handlePageCreated}
                  />
                )}
                {sectionView === 'products'      && <ProductGridEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('list')} storeId={storeId} isProductsPage={systemPageSlug === 'products'} />}
                {sectionView === 'product-title' && <ProductTitleEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('products')} />}
                {sectionView === 'product-price' && <ProductPriceEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('products')} />}
                {sectionView === 'product-cart'    && <ProductCartButtonEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('products')} />}
                {sectionView === 'nav-menu'        && <NavMenuEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('header')} />}
                {sectionView === 'category-filter' && <CategoryFilterEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('list')} storeId={storeId} />}
                {sectionView === 'footer'        && <FooterEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('list')} />}
                {sectionView === 'code'          && !systemPageSlug && <CustomCodeEdit theme={theme} updateTheme={updateTheme} onBack={() => setSectionView('list')} />}
                {sectionView === 'custom'        && !systemPageSlug && (
                  <CustomSectionsEdit
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

        <main className="flex-1 bg-zinc-800 flex items-center justify-center overflow-auto p-8">
          <div
            className="relative bg-white shadow-2xl transition-all duration-300 overflow-hidden"
            style={{
              width: DEVICE_WIDTHS[device],
              height: '100%',
              maxWidth: '100%',
              borderRadius: device === 'desktop' ? '0.5rem' : '1.5rem',
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
                storeName={storeName}
                pageType={activePage?.type ?? systemPageSlug ?? 'home'}
                pageContent={activePage?.content}
                heroSlides={heroSlides}
              />
            )}
          </div>
        </main>
      </div>

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
