'use client'

import { Fragment, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, X, User, LogOut, ShoppingBag, ChevronDown, ChevronLeft, Menu } from 'lucide-react'
import CartIcon from './cart-icon'
import { useAuth } from './auth-context'
import { EditorItem, useIsEditor, notifyEdit } from './EditorHighlight'
import { usePrice } from '@/components/CurrencyProvider'
import { useStoreBase } from '@/components/StoreBaseProvider'
import { readableText, ensureReadable } from '@/lib/contrast'
import { resolveDrawer, type DrawerConfig } from '@/lib/drawer'

interface NavLink {
  label: string
  href: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface DrawerProduct {
  id: string
  title: string
  price: number
  imageUrl?: string | null
  slug?: string | null
}

interface SearchProduct {
  id: string
  title: string
  price: number
  imageUrl?: string | null
  slug?: string | null
}

interface StoreHeaderProps {
  store: {
    id: string
    name: string
    subdomain: string
  }
  theme: {
    logoUrl?: string | null
    logoWidth?: number | null
    logoHeight?: number | null
    headerLayout?: string | null
    menuPosition?: string | null
    headerWidth?: string | null
    headerHeight?: string | null
    headerSticky?: boolean | null
    headerBorderWidth?: number | null
    headerBgColor?: string | null
    headerTextColor?: string | null
    utilityStyle?: string | null
    headerTransparent?: boolean | null
    headerInverseLogoUrl?: string | null
    headerTransparentText?: string | null
    /** The drawer's contents. Null or missing means every default. */
    drawer?: unknown
    borderRadius?: string | null
    accentColor?: string | null
    primaryColor?: string | null
    backgroundColor?: string | null
    textColor?: string | null
    showSearch?: boolean | null
    navLinks?: NavLink[] | null
    navFontSize?: number | null
    navCase?: string | null
    navDividers?: boolean | null
    footerColor?: string | null
    productGridBg?: string | null
  } | null
  subdomain: string
  isEditor?: boolean
  isHome?: boolean
  onEdit?: (s: string) => void
}

const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: 'Home',    href: '/' },
  { label: 'Catalog', href: '/products' },
  { label: 'Contact', href: '/contact' },
]

function buildHref(base: string, href: string): string {
  if (href === '/') return base || '/'
  return `${base}${href.startsWith('/') ? href : '/' + href}`
}

export default function StoreHeader({ store, theme, subdomain, isEditor: isEditorProp, isHome = false, onEdit }: StoreHeaderProps) {
  const storeBase = useStoreBase()
  const price = usePrice()
  // Pages with a client shell hand this down; the ones rendered straight from
  // the server (a product, a category) do not, and work it out themselves. So
  // the header is editable wherever it appears, not only on the home page.
  const detected = useIsEditor()
  const isEditor = isEditorProp ?? detected
  const notify = onEdit ?? notifyEdit
  const { customer, logout } = useAuth()
  const pathname = usePathname()

  /**
   * Is this nav link the page we are on?
   *
   * Prefix rather than equality, so /products stays marked while you are
   * looking at one product. Home is the exception: every path starts with it,
   * so it only counts when it is the whole path.
   */
  const isCurrent = (href: string) => {
    if (isEditor) return false
    const target = buildHref(storeBase, href)
    if (target === (storeBase || '/')) return pathname === target
    return pathname === target || pathname.startsWith(target + '/')
  }


  const [searchOpen, setSearchOpen]     = useState(false)
  const [query, setQuery]               = useState('')
  const [results, setResults]           = useState<SearchProduct[]>([])
  const [searching, setSearching]       = useState(false)
  const [categories, setCategories]     = useState<Category[]>([])
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen]     = useState(false)
  /*
   * Closing is a state of being open, not the absence of it.
   *
   * Unmounting on the click gives the panel nowhere to go: it was there and
   * then it was not, which reads as a fault rather than as a menu. It stays
   * mounted through its exit and takes itself out when the animation ends, so
   * there is no timer to keep in step with the stylesheet.
   */
  const [drawerClosing, setDrawerClosing] = useState(false)
  const [drawerCatalogue, setDrawerCatalogue] = useState<DrawerProduct[]>([])

  function openDrawer() {
    setDrawerClosing(false)
    setDrawerOpen(true)
  }
  function closeDrawer() {
    // No guard on whether it is open. The editor's listener is registered once
    // and would hold the first render's answer forever, and asking a shut
    // drawer to shut costs nothing: it is not rendered, and opening resets
    // this before anything is drawn.
    setDrawerClosing(true)
  }

  const searchRef   = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  const primaryColor = theme?.primaryColor ?? '#0a0a0a'
  const navLinks     = theme?.navLinks?.length ? theme.navLinks : DEFAULT_NAV_LINKS
  const navFontSize  = theme?.navFontSize ?? 14
  const navCase      = (theme?.navCase ?? 'normal') as React.CSSProperties['textTransform']
  const navDividers  = theme?.navDividers ?? false

  const navTextStyle: React.CSSProperties = { fontSize: navFontSize, textTransform: navCase }

  // Normalised once. Everything below reads plain fields off this rather than
  // guessing at whatever the JSON column happens to hold.
  const drawer: DrawerConfig = resolveDrawer(theme?.drawer)

  /*
   * Which categories the drawer lists.
   *
   * An empty pick means all of them, which is what a drawer shows before
   * anyone has chosen. A pick is honoured in the order it was arranged, and
   * ids that no longer exist simply drop out rather than leaving a gap.
   */
  /*
   * The carousel cards' corners.
   *
   * Blank follows the shop's own curvature, which is what the cards did when
   * the radius was a Tailwind class. It has to be an inline value now rather
   * than that class: the storefront layout maps every rounded-* utility onto
   * the theme radius with !important, so a class here could not be overridden
   * by a setting, only by the theme it was meant to depart from.
   */
  const cardRadius = drawer.carousel.radius || theme?.borderRadius || '0.75rem'

  const drawerCategories = drawer.categories.ids.length
    ? drawer.categories.ids
        .map(id => categories.find(c => c.id === id))
        .filter((c): c is Category => !!c)
    : categories

  /*
   * The carousel's products.
   *
   * Fetched rather than passed down, because the header is rendered by every
   * page including ones that never load a product, and asking each of them to
   * carry a list for a panel that may never be opened is how a shop page ends
   * up doing a query for a menu.
   */
  const wantsCarousel = drawer.carousel.show && drawer.carousel.productIds.length > 0
  useEffect(() => {
    if (!wantsCarousel) return
    let alive = true
    fetch(`/api/storefront/${subdomain}/products?limit=48`)
      .then(r => (r.ok ? r.json() : { products: [] }))
      .then(d => { if (alive) setDrawerCatalogue(d.products ?? []) })
      .catch(() => {})
    return () => { alive = false }
  }, [wantsCarousel, subdomain])

  // Resolved at render rather than stored, so the order is always the order
  // that is currently configured and a product removed from the pick leaves
  // immediately instead of waiting for the next fetch.
  const drawerProducts = wantsCarousel
    ? drawer.carousel.productIds
        .map(id => drawerCatalogue.find(p => p.id === id))
        .filter((p): p is DrawerProduct => !!p)
    : []

  useEffect(() => {
    fetch(`/api/storefront/${subdomain}/categories`)
      .then(r => r.ok ? r.json() : { categories: [] })
      .then(d => setCategories(d.categories ?? []))
      .catch(() => {})
  }, [subdomain])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/storefront/${subdomain}/products?q=${encodeURIComponent(query)}&limit=6`)
        if (res.ok) {
          const d = await res.json()
          setResults(d.products ?? [])
        }
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query, subdomain])

  useEffect(() => {
    if (!searchOpen) return
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) closeSearch()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [searchOpen])

  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    if (drawerOpen && !drawerClosing) document.body.style.overflow = 'hidden'
    else            document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen, drawerClosing])

  function closeSearch() {
    setSearchOpen(false)
    setQuery('')
    setResults([])
  }

  const [scrolledPastHero, setScrolledPastHero] = useState(false)
  useEffect(() => {
    if (!((theme?.headerTransparent ?? false) && isHome && (theme?.headerSticky ?? true))) return
    const onScroll = () => setScrolledPastHero(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [theme?.headerTransparent, theme?.headerSticky, isHome])

  /*
   * In the editor this both opens the drawer and asks for its panel.
   *
   * It used to only send the message, so the one control whose whole job is to
   * reveal the drawer was the one place you could not see it: a merchant could
   * edit the drawer's contents and never look at them. It is a panel that
   * opens, not a link that navigates, so there is nothing to protect the
   * editor from by keeping it shut.
   */
  function handleHamburgerClick() {
    openDrawer()
    if (isEditor) {
      window.parent.postMessage({ type: 'section:edit', section: 'drawer' }, '*')
    }
  }

  // The editor opens and closes it from its own panel, so opening Drawer in
  // the sidebar shows the thing you are editing without hunting for the
  // hamburger at a width where it may not even be rendered.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'drawer:open') openDrawer()
      if (e.data?.type === 'drawer:close') closeDrawer()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // ── Header layout ──
  // Menu position is the explicit choice, so it wins: picking a centred menu
  // moves the logo to the left, since only one of them can own the middle.
  const menuPos = (theme?.menuPosition ?? 'auto') as 'auto' | 'left' | 'center' | 'right'
  const logoCentered = (theme?.headerLayout ?? 'left') === 'centered'
  const menuSlot: 'left' | 'center' | 'right' =
    menuPos === 'auto' ? (logoCentered ? 'left' : 'center') : menuPos
  const centered = logoCentered && menuSlot !== 'center'

  // The bar always renders exactly three slots — left, centre, right — so the
  // menu resolves into one of them rather than being appended as an extra
  // child, which overflowed the grid and wrapped the utilities onto a row of
  // their own.
  const menuInLeft  = menuSlot === 'left'
  const menuInMid   = menuSlot === 'center'
  const menuInRight = menuSlot === 'right'

  // ── Header appearance, all defaulting to the previous hardcoded values ──
  const sticky      = theme?.headerSticky ?? true
  const heightPad   = { compact: 'py-2', standard: 'py-4', tall: 'py-7' }[theme?.headerHeight ?? 'standard'] ?? 'py-4'
  const widthCls    = (theme?.headerWidth ?? 'page') === 'full' ? 'w-full' : 'max-w-7xl mx-auto w-full'
  const borderW     = Math.max(0, Math.min(theme?.headerBorderWidth ?? 1, 8))
  // Blank keeps the translucent white that pairs with backdrop-blur.
  const headerBg    = theme?.headerBgColor || 'rgba(255,255,255,0.92)'
  /*
   * The bar's ink, checked against the bar's own ground.
   *
   * Background and text are set in two separate controls, so a colour picked
   * while the header was white is still sitting there when it is painted
   * black. Blank used to mean "inherit the page", which is near-black on a
   * light theme, so a black header came out with black type on it and the
   * whole menu disappeared.
   *
   * Blank still lands on the page's own text colour when the header is light,
   * which is what inheriting did, so nothing moves for a shop that never
   * touched this.
   */
  const headerInk   = theme?.headerTextColor?.trim() || ''
  const headerFg    = headerInk
    ? ensureReadable(headerInk, headerBg)
    : readableText(headerBg, '#ffffff', theme?.textColor || '#09090b')
  const utilityText = (theme?.utilityStyle ?? 'icons') === 'text'

  // ── Transparent header (home page only) ──
  // The bar sits over the hero instead of above it, then fades to its solid
  // colours once you scroll past the fold.
  const wantsTransparent = (theme?.headerTransparent ?? false) && isHome
  // A bar that scrolls away is only ever over the hero, so it never needs to
  // fade to its solid colours; doing it anyway made it change colour on the
  // way out of view.
  const isTransparent = wantsTransparent && (!sticky || !scrolledPastHero)
  // Falls back to the normal logo, so enabling this without an inverse mark
  // still works — it just may not contrast well.
  const activeLogoUrl = isTransparent
    ? (theme?.headerInverseLogoUrl || theme?.logoUrl)
    : theme?.logoUrl

  // Whatever colour the bar is currently painting its text in — used to decide
  // whether the descendant override below is needed.
  const barFg = isTransparent ? (theme?.headerTransparentText || '#ffffff') : headerFg

  /*
   * The bar's own chrome, mixed from whatever colour it is writing in.
   *
   * Every one of these was a fixed grey before, which only worked on a white
   * header. Mixing from the foreground means a dark bar gets pale hovers and
   * a light bar gets dark ones, with no branch for either, and the
   * transparent state over a hero comes out right for free.
   */
  const fg = barFg || '#09090b'
  const chrome = {
    /** Behind an icon button under the pointer. */
    hover: `color-mix(in srgb, ${fg} 8%, transparent)`,
    /** Behind the search field and other recessed things. */
    well: `color-mix(in srgb, ${fg} 5%, transparent)`,
    /** The hairline under the bar, and around a field. */
    line: `color-mix(in srgb, ${fg} 12%, transparent)`,
    /** A nav link at rest. Full strength on hover. */
    muted: `color-mix(in srgb, ${fg} 62%, transparent)`,
    /** Placeholder text and the quietest labels. */
    faint: `color-mix(in srgb, ${fg} 40%, transparent)`,
  }

  // The brand markup is identical in both header layouts and in both editor and
  // live modes, so it is built once here rather than duplicated four ways.
  /** Every icon button in the bar shares one hover, lit from the bar's own colour. */
  const iconButton = {
    className: 'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = chrome.hover },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = 'transparent' },
  }

  /*
   * The drawer's ground.
   *
   * The bar's own default is translucent white, which pairs with a blur over
   * whatever is behind it. A drawer has a page behind it rather than a hero,
   * so a translucent panel would show the shop through the menu; it takes the
   * page's ground in that case and the header's colour whenever one is set.
   */
  const drawerBg = theme?.headerBgColor || 'var(--store-bg, #ffffff)'
  /** Every row in the drawer lights the same way the bar's icons do. */
  const drawerHover = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = chrome.hover },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = 'transparent' },
  }

  const logoNode = activeLogoUrl ? (
    <img
      src={activeLogoUrl}
      alt={store.name}
      // Caps on both axes: a stacked logo sized by width alone rendered at its
      // own aspect ratio and stretched the header down the page.
      style={{ maxWidth: theme?.logoWidth ?? 120, maxHeight: theme?.logoHeight ?? 48 }}
      className="w-auto h-auto object-contain"
    />
  ) : (
    <span className="text-2xl font-bold tracking-tight" style={{ color: theme?.accentColor ?? 'inherit' }}>
      {store.name}
    </span>
  )

  // One EditorItem around the whole menu rather than one per link: the nav is a
  // single thing you edit (its links, typography and dividers all live in one
  // panel), so selecting it should outline the menu, not an individual word.
  const navList = (
    <EditorItem section="header" field="header-nav" label="Menu" isEditor={isEditor} onEdit={notify}>
      <span className="flex items-center">
        {navLinks.map(({ label, href }, i) => (
          <Fragment key={`${label}-${i}`}>
            {navDividers && i > 0 && (
              <span className="w-px h-4 shrink-0 mx-3.5" style={{ backgroundColor: chrome.line }} />
            )}
            {isEditor ? (
              <span
                className="font-semibold transition-colors cursor-default px-3 whitespace-nowrap"
                style={{ ...navTextStyle, color: chrome.muted }}
              >
                {label}
              </span>
            ) : (
              // The underline grows from the middle on hover and stays put on
              // the page you are on, so the menu says where you are rather
              // than only where you could go.
              <Link
                href={buildHref(storeBase, href)}
                className="group/nav relative font-semibold transition-colors px-3 py-1 whitespace-nowrap"
                style={{ ...navTextStyle, color: isCurrent(href) ? fg : chrome.muted }}
                onMouseEnter={e => (e.currentTarget.style.color = fg)}
                onMouseLeave={e => (e.currentTarget.style.color = isCurrent(href) ? fg : chrome.muted)}
              >
                {label}
                <span
                  className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px origin-center scale-x-0 transition-transform duration-200 group-hover/nav:scale-x-100"
                  style={{ backgroundColor: fg, transform: isCurrent(href) ? 'scaleX(1)' : undefined }}
                />
              </Link>
            )}
          </Fragment>
        ))}
      </span>
    </EditorItem>
  )

  const brand = (
    <EditorItem section="header" field="header-logo" label="Logo" isEditor={isEditor} onEdit={notify} block>
      {isEditor ? (
        <span className="hover:opacity-80 transition-opacity cursor-default flex items-center">{logoNode}</span>
      ) : (
        <Link href={buildHref(storeBase, '/')} className="hover:opacity-80 transition-opacity flex items-center">
          {logoNode}
        </Link>
      )}
    </EditorItem>
  )



  return (
    <>
      {barFg && (
        <style
          dangerouslySetInnerHTML={{
            __html: `[data-header-fg] a, [data-header-fg] button, [data-header-fg] nav span { color: inherit; }`,
          }}
        />
      )}
      {/*
        * Four positions, from two independent settings.
        *
        * Transparent decides whether the bar sits over the hero or above it;
        * sticky decides whether it stays when the page moves. They used to be
        * read as one: transparent won outright and pinned the bar with
        * `fixed`, so on a shop with a transparent header the sticky switch did
        * nothing at all.
        *
        * Absolute is the one that was missing. It puts the bar over the hero
        * exactly as fixed does, and then lets it leave with the rest of the
        * page, which is what "scrolls away" means.
        */}
      <header
        className={`z-40 w-full ${
          wantsTransparent
            ? sticky
              ? 'fixed top-0 left-0 right-0'
              : 'absolute top-0 left-0 right-0'
            : sticky
              ? 'sticky top-0'
              : 'relative'
        }`}
      >
        {/* ── Main bar ── */}
        <div
          {...(barFg ? { 'data-header-fg': '' } : {})}
          className={`px-6 md:px-10 ${heightPad} border-b transition-colors duration-300 ${
            isTransparent ? '' : 'backdrop-blur-md'
          }`}
          style={{
            backgroundColor: isTransparent ? 'transparent' : headerBg,
            borderColor: chrome.line,
            borderBottomWidth: isTransparent ? 0 : borderW,
            ...(isTransparent
              ? { color: theme?.headerTransparentText || '#ffffff' }
              : headerFg
              ? { color: headerFg }
              : {}),
          }}
        >
        <div
          className={`${widthCls} ${
            centered
              // minmax(auto,1fr): the side columns stay balanced so the logo is
              // page-centred, but never shrink below their own content — that
              // is what folded the utilities onto a second line.
              ? 'grid grid-cols-[minmax(auto,1fr)_auto_minmax(auto,1fr)] items-center gap-4'
              : 'flex items-center justify-between'
          }`}
        >
          {/* Left: hamburger (mobile) + brand, or the nav when centred */}
          <div className={`flex items-center gap-2 ${centered ? 'justify-start' : ''}`}>
            {/* Hamburger, mobile only */}
            <button
              onClick={handleHamburgerClick}
              {...iconButton}
              className={iconButton.className + ' md:hidden'}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {!centered && brand}
            {menuInLeft && <div className="hidden md:flex items-center">{navList}</div>}
          </div>

          {/* Centre slot, the brand when centred, otherwise the menu (or an
              empty spacer, so justify-between still has three children). */}
          {centered ? (
            <div className="flex justify-center">{brand}</div>
          ) : menuInMid ? (
            <nav className="hidden md:flex items-center">{navList}</nav>
          ) : (
            <div aria-hidden />
          )}


          {/* Right: menu (when placed here) + search + auth + cart */}
          <div className={`flex items-center gap-2 flex-nowrap ${centered ? 'justify-end' : ''}`}>
            {/* The menu reads better before the utility icons than wedged
                between them. */}
            {menuInRight && (
              <div className="hidden md:flex items-center shrink-0 mr-1">{navList}</div>
            )}
            {/* Search */}
            <div ref={searchRef} className="relative">
              {searchOpen ? (
                <div
                  className="flex items-center gap-2 rounded-xl px-3 h-10 w-52 md:w-72 transition-all"
                  style={{ backgroundColor: chrome.well, border: `1px solid ${chrome.line}` }}
                >
                  <Search className="w-4 h-4 shrink-0" style={{ color: chrome.faint }} />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search products"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-60"
                  />
                  <button onClick={closeSearch} aria-label="Close search" className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  {...iconButton}
                  className={utilityText ? 'flex h-10 items-center gap-1.5 rounded-xl px-3 transition-colors' : iconButton.className}
                  aria-label="Search"
                >
                  <Search className={`w-5 h-5 ${utilityText ? 'md:hidden' : ''}`} />
                  {utilityText && (
                    <span className="hidden md:inline text-sm font-semibold">Search</span>
                  )}
                </button>
              )}

              {/* Search dropdown */}
              {searchOpen && (query.trim() || searching) && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 rounded-2xl z-50 overflow-hidden shadow-[0_16px_40px_-12px_rgba(0,0,0,0.25)]"
                  style={{ backgroundColor: 'var(--store-bg, #ffffff)', color: 'var(--store-text, #09090b)', border: '1px solid var(--store-card-border, #f1f1f1)' }}
                >
                  {searching && (
                    <div className="px-4 py-3 text-sm opacity-50">Searching…</div>
                  )}
                  {!searching && results.length === 0 && query.trim() && (
                    <div className="px-4 py-3 text-sm opacity-50">
                      No results for &ldquo;{query}&rdquo;
                    </div>
                  )}
                  {results.map(product => (
                    <Link
                      key={product.id}
                      href={`${storeBase}/products/${product.slug || product.id}`}
                      onClick={closeSearch}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-black/4 transition-colors border-b border-black/[0.07] last:border-0"
                    >
                      <div className="w-12 h-12 rounded-lg bg-black/6 shrink-0 overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-30">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{product.title}</p>
                        <p className="text-xs font-bold mt-0.5" style={{ color: primaryColor }}>
                          {price(product.price)}
                        </p>
                      </div>
                    </Link>
                  ))}
                  {results.length > 0 && (
                    <Link
                      href={`${storeBase}/products?q=${encodeURIComponent(query)}`}
                      onClick={closeSearch}
                      className="block text-center px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-t border-black/[0.07] hover:bg-black/4 transition-colors"
                      style={{ color: primaryColor }}
                    >
                      View all results
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Auth */}
            {customer ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  {...iconButton}
                  className="flex h-10 items-center gap-1.5 rounded-xl px-2 transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: primaryColor, color: readableText(primaryColor) }}
                  >
                    {((customer.name ?? customer.email)[0] ?? '?').toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-semibold max-w-24 truncate">
                    {customer.name ?? customer.email.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 hidden md:block" style={{ color: chrome.faint }} />
                </button>
                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl z-50 overflow-hidden shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)]"
                    style={{ backgroundColor: 'var(--store-bg, #ffffff)', color: 'var(--store-text, #09090b)', border: '1px solid var(--store-card-border, #f1f1f1)' }}
                  >
                    <Link
                      href={`${storeBase}/account`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-black/4 transition-colors"
                    >
                      <User className="w-4 h-4" /> My Account
                    </Link>
                    <Link
                      href={`${storeBase}/account/orders`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-black/4 transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" /> My Orders
                    </Link>
                    <div className="border-t border-black/[0.07]" />
                    <button
                      onClick={() => { logout(subdomain); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={`${storeBase}/login`}
                aria-label="Sign in"
                {...iconButton}
                className={`text-sm font-semibold shrink-0 whitespace-nowrap ${
                  utilityText ? 'flex h-10 items-center gap-1.5 rounded-xl px-3 transition-colors' : iconButton.className
                }`}
              >
                <User className={`w-5 h-5 ${utilityText ? 'md:hidden' : ''}`} />
                {utilityText && <span className="hidden md:block whitespace-nowrap">Sign In</span>}
              </Link>
            )}


            <CartIcon />
          </div>
        </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Dark overlay */}
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${
              drawerClosing ? 'drawer-dim-out' : 'drawer-dim-in'
            }`}
            onClick={closeDrawer}
          />
          {/* Slide panel.

              It takes the header's colours, not the page's. This is the menu
              opening out of the bar, so a black header used to produce a white
              drawer, and the rules and hovers inside it were fixed blacks that
              vanished on anything dark. Everything below is mixed from the
              same foreground the bar uses. */}
          <div
            className={`relative w-72 max-w-[85vw] h-full shadow-2xl flex flex-col overflow-y-auto ${
              drawerClosing ? 'drawer-out' : 'drawer-in'
            }`}
            style={{ backgroundColor: drawerBg, color: fg }}
            /* The panel's own animation is the one that decides when the
               drawer is gone. Children animate too and their events bubble,
               so only the panel's own is listened for. */
            onAnimationEnd={e => {
              if (e.target !== e.currentTarget) return
              if (drawerClosing) { setDrawerClosing(false); setDrawerOpen(false) }
            }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: chrome.line }}
            >
              <Link
                href={buildHref(storeBase, '/')}
                onClick={closeDrawer}
                className="hover:opacity-80 transition-opacity"
              >
                {theme?.logoUrl ? (
                  <img
                    src={theme.logoUrl}
                    alt={store.name}
                    style={{ maxWidth: Math.min(theme.logoWidth ?? 120, 110), maxHeight: theme.logoHeight ?? 48 }}
                    className="w-auto h-auto object-contain"
                  />
                ) : (
                  <span className="text-xl font-bold tracking-tight" style={{ color: theme?.accentColor ?? 'inherit' }}>
                    {store.name}
                  </span>
                )}
              </Link>
              {/* Not an X, and not only a glyph.
                  A cross is what a browser puts on a dialog. This panel came
                  in from the left, so what sends it back points that way, and
                  it says so in words: small caps on a wide track, the register
                  the rest of an editorial storefront is set in.

                  The whole thing sits at just over half strength and comes to
                  full on hover, and the chevron slides a little further left
                  as it does, in the direction it is about to send the drawer.
                  The control previews its own result.

                  A rule under the word rather than a box around it, drawn from
                  the drawer's own ink so it works on any colour, and grown from
                  the left so the reveal travels the same way as everything
                  else here. */}
              <button
                onClick={closeDrawer}
                aria-label="Close menu"
                className="group/close -mr-1 flex shrink-0 items-center gap-1 rounded-md py-1 pl-1 pr-1 opacity-55 transition-opacity duration-200 hover:opacity-100"
              >
                <ChevronLeft
                  className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/close:-translate-x-0.5"
                  strokeWidth={1.75}
                />
                <span className="relative text-[10px] font-semibold uppercase tracking-[0.16em] leading-none">
                  Close
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-1 left-0 right-0 h-px origin-left scale-x-0 transition-transform duration-300 ease-out group-hover/close:scale-x-100"
                    style={{ backgroundColor: 'currentColor' }}
                  />
                </span>
              </button>
            </div>

            {/* Every block below is optional and separately editable, so the
                rules between them are drawn by the blocks themselves rather
                than hardcoded between fixed sections. */}

            {/* Menu links. The header's own list, shown a second way. */}
            {drawer.links.show && navLinks.length > 0 && (
              <DrawerBlock label={drawer.links.label} line={chrome.line} first beat={0} still={drawerClosing}>
                {navLinks.map(({ label, href }, i) => (
                  <Link
                    key={`${label}-${i}`}
                    href={buildHref(storeBase, href)}
                    onClick={closeDrawer}
                    className="px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    style={navTextStyle}
                    {...drawerHover}
                  >
                    {label}
                  </Link>
                ))}
              </DrawerBlock>
            )}

            {drawer.allProducts.show && (
              <DrawerBlock line={chrome.line} first={!drawer.links.show} beat={1} still={drawerClosing}>
                <Link
                  href={`${storeBase}/products`}
                  onClick={closeDrawer}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  {...drawerHover}
                >
                  {drawer.allProducts.label || 'All products'}
                </Link>
              </DrawerBlock>
            )}

            {drawer.categories.show && drawerCategories.length > 0 && (
              <DrawerBlock label={drawer.categories.label} line={chrome.line} beat={2} still={drawerClosing}>
                {drawerCategories.map(cat => (
                  <Link
                    key={cat.id}
                    href={`${storeBase}/products?category=${cat.slug}`}
                    onClick={closeDrawer}
                    className="px-3 py-2 rounded-xl text-sm font-medium opacity-80 hover:opacity-100 transition-colors"
                    {...drawerHover}
                  >
                    {cat.name}
                  </Link>
                ))}
              </DrawerBlock>
            )}

            {/* A row that scrolls sideways rather than a grid: the drawer is
                288px wide, and two columns of product card in it are thumbnails
                of a thumbnail. */}
            {drawer.carousel.show && drawerProducts.length > 0 && (
              <DrawerBlock label={drawer.carousel.label} line={chrome.line} flush beat={3} still={drawerClosing}>
                {/* Snapped, so a flick lands a card square in the panel
                    rather than halfway off the edge of a 288px drawer. */}
                <div className="flex gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory scroll-px-3 px-3 pb-1">
                  {drawerProducts.map((pr, i) => (
                    <Link
                      key={pr.id}
                      href={`${storeBase}/products/${pr.slug || pr.id}`}
                      onClick={closeDrawer}
                      className={`shrink-0 w-32 snap-start group/dp ${drawerClosing ? '' : 'drawer-card-in'}`}
                      // Capped at six: past that the last card would still be
                      // waiting to appear after the drawer has finished
                      // opening, which reads as the page being slow.
                      style={drawerClosing ? undefined : { animationDelay: `${260 + Math.min(i, 6) * 60}ms` }}
                    >
                      <div
                        className="w-32 h-32 overflow-hidden transition-shadow duration-300 group-hover/dp:shadow-lg"
                        style={{ backgroundColor: chrome.well, borderRadius: cardRadius }}
                      >
                        {pr.imageUrl && (
                          <img
                            src={pr.imageUrl}
                            alt={pr.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover/dp:scale-105"
                          />
                        )}
                      </div>
                      {drawer.carousel.showTitle && (
                        <p className="mt-2 text-[12px] font-medium leading-snug line-clamp-2">{pr.title}</p>
                      )}
                      {drawer.carousel.showPrice && (
                        <p className="mt-0.5 text-[12px] font-bold">{price(pr.price)}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </DrawerBlock>
            )}

            {drawer.contact.show && (
              <DrawerBlock label={drawer.contact.label} line={chrome.line} beat={4} still={drawerClosing}>
                {drawer.contact.text.trim() ? (
                  <p className="px-3 text-[13px] leading-relaxed opacity-70 whitespace-pre-wrap">
                    {drawer.contact.text}
                  </p>
                ) : (
                  <Link
                    href={buildHref(storeBase, '/contact')}
                    onClick={closeDrawer}
                    className="px-3 py-2 rounded-xl text-sm font-medium opacity-80 hover:opacity-100 transition-colors"
                    {...drawerHover}
                  >
                    {drawer.contact.label || 'Contact'}
                  </Link>
                )}
              </DrawerBlock>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/**
 * One block of the drawer.
 *
 * Draws its own rule above it, so blocks can be switched off in any
 * combination without leaving a stray line where a section used to be. The
 * first one visible skips the rule, since the drawer's own header already
 * drew one.
 */
function DrawerBlock({
  label,
  line,
  first = false,
  flush = false,
  beat = 0,
  still = false,
  children,
}: {
  label?: string
  line: string
  first?: boolean
  /** The child manages its own horizontal padding, e.g. a sideways scroller
      that has to bleed to the edge to look scrollable. */
  flush?: boolean
  /** How many places down the drawer this block sits, for the stagger. */
  beat?: number
  /** No entrance while the drawer is leaving: the panel is the only thing
      that should be moving then, and blocks rising into a sliding panel reads
      as two animations fighting. */
  still?: boolean
  children: React.ReactNode
}) {
  return (
    <>
      {!first && <div className="mx-5 border-t" style={{ borderColor: line }} />}
      <div
        className={`py-4 ${flush ? '' : 'px-4'} ${still ? '' : 'drawer-block-in'}`}
        style={still ? undefined : { animationDelay: `${90 + beat * 55}ms` }}
      >
        {label?.trim() && (
          <p className={`mb-2 text-[10px] font-bold uppercase tracking-widest opacity-50 ${flush ? 'px-7' : 'px-3'}`}>
            {label}
          </p>
        )}
        <div className={flush ? '' : 'flex flex-col gap-1'}>{children}</div>
      </div>
    </>
  )
}
