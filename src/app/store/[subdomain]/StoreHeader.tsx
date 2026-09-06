'use client'

import { Fragment, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, X, User, LogOut, ShoppingBag, ChevronDown, Menu, Sun, Moon } from 'lucide-react'
import CartIcon from './cart-icon'
import { useAuth } from './auth-context'
import { EditorItem } from './EditorHighlight'
import { usePrice } from '@/components/CurrencyProvider'

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
    accentColor?: string | null
    primaryColor?: string | null
    backgroundColor?: string | null
    textColor?: string | null
    showSearch?: boolean | null
    navLinks?: NavLink[] | null
    navFontSize?: number | null
    navCase?: string | null
    navDividers?: boolean | null
    darkMode?: boolean | null
    showDarkToggle?: boolean | null
    footerColor?: string | null
    productGridBg?: string | null
  } | null
  subdomain: string
  isEditor?: boolean
  onEdit?: (s: string) => void
}

const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: 'Home',    href: '/' },
  { label: 'Catalog', href: '/products' },
  { label: 'Contact', href: '/contact' },
]

function buildHref(subdomain: string, href: string): string {
  if (href === '/') return `/store/${subdomain}`
  return `/store/${subdomain}${href.startsWith('/') ? href : '/' + href}`
}

export default function StoreHeader({ store, theme, subdomain, isEditor = false, onEdit }: StoreHeaderProps) {
  const price = usePrice()
  const notify = onEdit ?? (() => {})
  const { customer, logout } = useAuth()

  // ── Dark mode state (managed here so it works on every page) ──────────────
  const [customerDark, setCustomerDark] = useState<boolean | null>(null)

  useEffect(() => {
    if (isEditor) return
    const stored = localStorage.getItem(`sf-dark-${subdomain}`)
    if (stored !== null) setCustomerDark(stored === 'true')
  }, [isEditor, subdomain])

  const themeDark = theme?.darkMode ?? false
  const isDark = isEditor
    ? themeDark
    : (customerDark !== null ? customerDark : themeDark)

  useEffect(() => {
    const el = document.documentElement
    if (isDark) {
      el.setAttribute('data-dark', 'true')
      el.style.setProperty('--store-bg', '#09090b')
      el.style.setProperty('--store-text', '#fafafa')
      el.style.setProperty('--store-footer', '#09090b')
      el.style.setProperty('--store-pg-bg', '#09090b')
      el.style.setProperty('--store-divider', 'rgba(255,255,255,0.12)')
      el.style.setProperty('--store-card-border', 'rgba(255,255,255,0.08)')
    } else {
      el.removeAttribute('data-dark')
      // When darkMode is saved ON in DB, the theme colors are the dark preset colors.
      // Fall back to light defaults so toggling to light actually shows a light store.
      const bg     = themeDark ? '#ffffff' : (theme?.backgroundColor ?? '#ffffff')
      const text   = themeDark ? '#09090b' : (theme?.textColor       ?? '#09090b')
      const footer = themeDark ? '#f4f4f5' : (theme?.footerColor     ?? '#f4f4f5')
      const pgBg   = themeDark ? '#ffffff' : (theme?.productGridBg   ?? '#ffffff')
      el.style.setProperty('--store-bg', bg)
      el.style.setProperty('--store-text', text)
      el.style.setProperty('--store-footer', footer)
      el.style.setProperty('--store-pg-bg', pgBg)
      el.style.setProperty('--store-divider', 'rgba(0,0,0,0.08)')
      el.style.setProperty('--store-card-border', '#f1f1f1')
    }
  }, [isDark, themeDark, theme?.backgroundColor, theme?.textColor, theme?.footerColor])

  function toggleDarkMode() {
    const next = !isDark
    if (isEditor) {
      window.parent.postMessage({ type: 'theme:dark-toggle', darkMode: next }, '*')
    } else {
      setCustomerDark(next)
      localStorage.setItem(`sf-dark-${subdomain}`, String(next))
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

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

  const primaryColor = theme?.primaryColor ?? '#6c47ff'
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

  function handleHamburgerClick() {
    if (isEditor) {
      window.parent.postMessage({ type: 'field:focus', section: 'header', field: 'header-nav' }, '*')
    } else {
      setDrawerOpen(true)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full">
        {/* ── Main bar ── */}
        <div
          className="px-6 md:px-10 py-4 border-b flex items-center justify-between backdrop-blur-md"
          style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderColor: 'rgba(0,0,0,0.06)' }}
        >
          {/* Left: hamburger (mobile) + Brand */}
          <div className="flex items-center gap-2">
            {/* Hamburger — mobile only */}
            <button
              onClick={handleHamburgerClick}
              className="md:hidden p-2 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-600 hover:text-zinc-900"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand */}
            <EditorItem section="header" field="header-logo" label="Logo" isEditor={isEditor} onEdit={notify} block>
              {isEditor ? (
                <span className="hover:opacity-80 transition-opacity cursor-default flex items-center">
                  {theme?.logoUrl ? (
                    <img src={theme.logoUrl} alt={store.name} style={{ width: theme.logoWidth ?? 120 }} className="object-contain" />
                  ) : (
                    <span className="text-2xl font-bold tracking-tight" style={{ color: theme?.accentColor ?? 'inherit' }}>
                      {store.name}
                    </span>
                  )}
                </span>
              ) : (
                <Link href={`/store/${subdomain}`} className="hover:opacity-80 transition-opacity flex items-center">
                  {theme?.logoUrl ? (
                    <img src={theme.logoUrl} alt={store.name} style={{ width: theme.logoWidth ?? 120 }} className="object-contain" />
                  ) : (
                    <span className="text-2xl font-bold tracking-tight" style={{ color: theme?.accentColor ?? 'inherit' }}>
                      {store.name}
                    </span>
                  )}
                </Link>
              )}
            </EditorItem>
          </div>

          {/* Centre nav — desktop only */}
          <nav className="hidden md:flex items-center">
            {navLinks.map(({ label, href }, i) => (
              <Fragment key={`${label}-${i}`}>
                {navDividers && i > 0 && (
                  <span className="w-px h-4 bg-zinc-200 shrink-0 mx-3.5" />
                )}
                <EditorItem section="header" field="header-nav" label="Nav links" isEditor={isEditor} onEdit={notify}>
                  {isEditor ? (
                    <span
                      className="font-semibold text-zinc-500 hover:text-zinc-900 transition-colors cursor-default px-3"
                      style={navTextStyle}
                    >
                      {label}
                    </span>
                  ) : (
                    <Link
                      href={buildHref(subdomain, href)}
                      className="font-semibold text-zinc-500 hover:text-zinc-900 transition-colors px-3"
                      style={navTextStyle}
                    >
                      {label}
                    </Link>
                  )}
                </EditorItem>
              </Fragment>
            ))}
          </nav>

          {/* Right: search + auth + cart */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div ref={searchRef} className="relative">
              {searchOpen ? (
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 w-52 md:w-72 transition-all">
                  <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search products..."
                    className="flex-1 bg-transparent text-sm outline-none text-zinc-800 placeholder:text-zinc-400"
                  />
                  <button onClick={closeSearch}>
                    <X className="w-4 h-4 text-zinc-400 hover:text-zinc-700 transition-colors" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-600 hover:text-zinc-900"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Search dropdown */}
              {searchOpen && (query.trim() || searching) && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {searching && (
                    <div className="px-4 py-3 text-sm text-zinc-400">Searching…</div>
                  )}
                  {!searching && results.length === 0 && query.trim() && (
                    <div className="px-4 py-3 text-sm text-zinc-400">
                      No results for &ldquo;{query}&rdquo;
                    </div>
                  )}
                  {results.map(product => (
                    <Link
                      key={product.id}
                      href={`/store/${subdomain}/products/${product.id}`}
                      onClick={closeSearch}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0"
                    >
                      <div className="w-12 h-12 rounded-lg bg-zinc-100 shrink-0 overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-300">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-800 truncate">{product.title}</p>
                        <p className="text-xs font-bold mt-0.5" style={{ color: primaryColor }}>
                          {price(product.price)}
                        </p>
                      </div>
                    </Link>
                  ))}
                  {results.length > 0 && (
                    <Link
                      href={`/store/${subdomain}/products?q=${encodeURIComponent(query)}`}
                      onClick={closeSearch}
                      className="block text-center px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-t border-zinc-100 hover:bg-zinc-50 transition-colors"
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
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-zinc-100 transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {((customer.name ?? customer.email)[0] ?? '?').toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-semibold text-zinc-700 max-w-24 truncate">
                    {customer.name ?? customer.email.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden md:block" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <Link
                      href={`/store/${subdomain}/account`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors text-zinc-700"
                    >
                      <User className="w-4 h-4" /> My Account
                    </Link>
                    <Link
                      href={`/store/${subdomain}/account/orders`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors text-zinc-700"
                    >
                      <ShoppingBag className="w-4 h-4" /> My Orders
                    </Link>
                    <div className="border-t border-zinc-100" />
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
                href={`/store/${subdomain}/login`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors hover:bg-zinc-100 text-zinc-700"
              >
                <User className="w-4 h-4" />
                <span className="hidden md:block">Sign In</span>
              </Link>
            )}

            {/* Dark / light mode toggle */}
            {theme?.showDarkToggle !== false && (
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-600 hover:text-zinc-900"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            )}

            <CartIcon />
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
          <div className="relative drawer-slide-in w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col overflow-y-auto">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              {theme?.logoUrl ? (
                <img
                  src={theme.logoUrl}
                  alt={store.name}
                  style={{ width: Math.min(theme.logoWidth ?? 120, 110) }}
                  className="object-contain"
                />
              ) : (
                <span className="text-xl font-bold tracking-tight" style={{ color: theme?.accentColor ?? 'inherit' }}>
                  {store.name}
                </span>
              )}
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-500"
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
                  href={buildHref(subdomain, href)}
                  onClick={() => setDrawerOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  style={navTextStyle}
                >
                  {label}
                </Link>
              ))}

              {/* Dark / light toggle row */}
              {theme?.showDarkToggle !== false && (
                <button
                  onClick={() => { toggleDarkMode(); setDrawerOpen(false) }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors w-full text-left"
                >
                  {isDark ? <Moon className="w-4 h-4 shrink-0" /> : <Sun className="w-4 h-4 shrink-0" />}
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </button>
              )}
            </nav>

            {/* Categories */}
            {categories.length > 0 && (
              <>
                <div className="mx-5 border-t border-zinc-100" />
                <div className="px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 px-3">
                    Categories
                  </p>
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/store/${subdomain}/products`}
                      onClick={() => setDrawerOpen(false)}
                      className="px-3 py-2 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                    >
                      All Products
                    </Link>
                    {categories.map(cat => (
                      <Link
                        key={cat.id}
                        href={`/store/${subdomain}/products?category=${cat.slug}`}
                        onClick={() => setDrawerOpen(false)}
                        className="px-3 py-2 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
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
