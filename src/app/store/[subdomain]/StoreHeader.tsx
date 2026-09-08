'use client'

import { Fragment, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, X, User, LogOut, ShoppingBag, ChevronDown, Menu } from 'lucide-react'
import CartIcon from './cart-icon'
import { useAuth } from './auth-context'
import { EditorItem } from './EditorHighlight'
import { usePrice } from '@/components/CurrencyProvider'
import { useStoreBase } from '@/components/StoreBaseProvider'
import { readableText } from '@/lib/contrast'

interface NavLink {
  label: string
  href: string
}

interface Category {
  id: string
  name: string
  slug: string
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

export default function StoreHeader({ store, theme, subdomain, isEditor = false, isHome = false, onEdit }: StoreHeaderProps) {
  const storeBase = useStoreBase()
  const price = usePrice()
  const notify = onEdit ?? (() => {})
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

  const searchRef   = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  const primaryColor = theme?.primaryColor ?? '#0a0a0a'
  const navLinks     = theme?.navLinks?.length ? theme.navLinks : DEFAULT_NAV_LINKS
  const navFontSize  = theme?.navFontSize ?? 14
  const navCase      = (theme?.navCase ?? 'normal') as React.CSSProperties['textTransform']
  const navDividers  = theme?.navDividers ?? false

  const navTextStyle: React.CSSProperties = { fontSize: navFontSize, textTransform: navCase }

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
    if (drawerOpen) document.body.style.overflow = 'hidden'
    else            document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  function closeSearch() {
    setSearchOpen(false)
    setQuery('')
    setResults([])
  }

  const [scrolledPastHero, setScrolledPastHero] = useState(false)
  useEffect(() => {
    if (!((theme?.headerTransparent ?? false) && isHome)) return
    const onScroll = () => setScrolledPastHero(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [theme?.headerTransparent, isHome])

  function handleHamburgerClick() {
    if (isEditor) {
      window.parent.postMessage({ type: 'field:focus', section: 'header', field: 'header-nav' }, '*')
    } else {
      setDrawerOpen(true)
    }
  }

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
  const headerFg    = theme?.headerTextColor || undefined
  const utilityText = (theme?.utilityStyle ?? 'icons') === 'text'

  // ── Transparent header (home page only) ──
  // The bar sits over the hero instead of above it, then fades to its solid
  // colours once you scroll past the fold.
  const wantsTransparent = (theme?.headerTransparent ?? false) && isHome
  const isTransparent = wantsTransparent && !scrolledPastHero
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
      <header
        className={`z-40 w-full ${
          wantsTransparent ? 'fixed top-0 left-0 right-0' : sticky ? 'sticky top-0' : 'relative'
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Slide panel */}
          <div className="relative drawer-slide-in w-72 max-w-[85vw] h-full shadow-2xl flex flex-col overflow-y-auto"
            style={{ backgroundColor: 'var(--store-bg, #ffffff)', color: 'var(--store-text, #09090b)' }}>
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.07]">
              <Link
                href={buildHref(storeBase, '/')}
                onClick={() => setDrawerOpen(false)}
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
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl hover:bg-black/5 transition-colors opacity-60"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map(({ label, href }, i) => (
                <Link
                  key={`${label}-${i}`}
                  href={buildHref(storeBase, href)}
                  onClick={() => setDrawerOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-black/5 transition-colors"
                  style={navTextStyle}
                >
                  {label}
                </Link>
              ))}

            </nav>

            {/* Categories */}
            {categories.length > 0 && (
              <>
                <div className="mx-5 border-t border-black/[0.07]" />
                <div className="px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2 px-3">
                    Categories
                  </p>
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`${storeBase}/products`}
                      onClick={() => setDrawerOpen(false)}
                      className="px-3 py-2 rounded-xl text-sm font-medium opacity-80 hover:opacity-100 hover:bg-black/5 transition-colors"
                    >
                      All Products
                    </Link>
                    {categories.map(cat => (
                      <Link
                        key={cat.id}
                        href={`${storeBase}/products?category=${cat.slug}`}
                        onClick={() => setDrawerOpen(false)}
                        className="px-3 py-2 rounded-xl text-sm font-medium opacity-80 hover:opacity-100 hover:bg-black/5 transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
