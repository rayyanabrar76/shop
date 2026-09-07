'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Package, Tag, FileText, Compass } from 'lucide-react'

type Row = {
  id: string
  group: 'Navigation' | 'Products' | 'Categories' | 'Pages'
  label: string
  sub?: string
  href: string
}

const NAV = (storeId: string): Row[] => [
  { id: 'n-home',      group: 'Navigation', label: 'Home',                 href: `/dashboard/stores/${storeId}` },
  { id: 'n-products',  group: 'Navigation', label: 'Products',             sub: 'Add and update your products', href: `/dashboard/stores/${storeId}/products` },
  { id: 'n-cats',      group: 'Navigation', label: 'Categories',           href: `/dashboard/stores/${storeId}/categories` },
  { id: 'n-orders',    group: 'Navigation', label: 'Orders',               href: `/dashboard/stores/${storeId}/orders` },
  { id: 'n-customers', group: 'Navigation', label: 'Customers',            href: `/dashboard/stores/${storeId}/customers` },
  { id: 'n-analytics', group: 'Navigation', label: 'Analytics',            href: `/dashboard/stores/${storeId}/analytics` },
  { id: 'n-theme',     group: 'Navigation', label: 'Customization',        sub: 'Edit the look of your store', href: `/dashboard/stores/${storeId}/theme` },
  { id: 'n-editor',    group: 'Navigation', label: 'Visual editor',        href: `/dashboard/stores/${storeId}/theme/editor` },
  { id: 'n-ship',      group: 'Navigation', label: 'Discounts & Shipping', href: `/dashboard/stores/${storeId}/discounts` },
  { id: 'n-pay',       group: 'Navigation', label: 'Payments',             href: `/dashboard/stores/${storeId}/settings/payments` },
  { id: 'n-settings',  group: 'Navigation', label: 'Settings',             href: `/dashboard/stores/${storeId}/settings` },
]

const ICONS = { Navigation: Compass, Products: Package, Categories: Tag, Pages: FileText }

/**
 * Search across a store's admin: its pages, its products, its categories and
 * the dashboard's own sections.
 *
 * Navigation is listed from a static table rather than crawled, because the
 * useful thing to match is what the merchant would call a page ("shipping"),
 * not the route it lives at.
 */
export default function AdminSearch({ storeId }: { storeId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const loaded = useRef(false)

  // Content is fetched the first time the panel opens, not on every page load:
  // most visits to the dashboard never search.
  useEffect(() => {
    if (!open || loaded.current || !storeId) return
    loaded.current = true
    Promise.allSettled([
      fetch(`/api/stores/${storeId}/products`).then(r => (r.ok ? r.json() : [])),
      fetch(`/api/stores/${storeId}/categories`).then(r => (r.ok ? r.json() : [])),
      fetch(`/api/stores/${storeId}/pages`).then(r => (r.ok ? r.json() : [])),
    ]).then(([p, c, pg]) => {
      const products: Row[] = (p.status === 'fulfilled' ? p.value ?? [] : []).map((x: any) => ({
        id: `p-${x.id}`, group: 'Products', label: x.title, sub: x.category || undefined,
        href: `/dashboard/stores/${storeId}/products/${x.id}`,
      }))
      const catsRaw = c.status === 'fulfilled' ? (Array.isArray(c.value) ? c.value : c.value?.categories ?? []) : []
      const categories: Row[] = catsRaw.map((x: any) => ({
        id: `c-${x.id}`, group: 'Categories', label: x.name,
        href: `/dashboard/stores/${storeId}/categories/${x.id}`,
      }))
      const pages: Row[] = (pg.status === 'fulfilled' ? pg.value ?? [] : []).map((x: any) => ({
        id: `g-${x.id}`, group: 'Pages', label: x.name, sub: `/${x.slug}`,
        href: `/dashboard/stores/${storeId}/theme/editor`,
      }))
      setRows([...products, ...categories, ...pages])
    })
  }, [open, storeId])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30)
    else { setQ(''); setActive(0) }
  }, [open])

  // Cmd/Ctrl-K anywhere, Escape to leave.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(v => !v) }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const all = [...NAV(storeId), ...rows]
    const term = q.trim().toLowerCase()
    if (!term) return all.filter(r => r.group === 'Navigation').slice(0, 6)
    return all
      .filter(r => r.label.toLowerCase().includes(term) || r.sub?.toLowerCase().includes(term))
      // A page called "Products" should beat a product whose title merely
      // contains the word, so a match at the start of the label wins.
      .sort((a, b) => a.label.toLowerCase().indexOf(term) - b.label.toLowerCase().indexOf(term))
      .slice(0, 12)
  }, [q, rows, storeId])

  function go(row: Row) {
    setOpen(false)
    router.push(row.href)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 min-w-0 flex items-center gap-2 h-9 px-3 rounded-full text-left"
        style={{ background: 'var(--admin-bg-muted)', border: '1px solid var(--admin-border)' }}
      >
        <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--admin-text-3)' }} />
        <span className="text-[13px] truncate" style={{ color: 'var(--admin-text-3)' }}>Search</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center p-3 sm:p-8">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}
          >
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid var(--admin-border)' }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--admin-text-3)' }} />
              <input
                ref={inputRef}
                value={q}
                onChange={e => { setQ(e.target.value); setActive(0) }}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)) }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
                  if (e.key === 'Enter' && results[active]) go(results[active])
                }}
                placeholder="Search products, pages and settings"
                className="flex-1 bg-transparent text-[14px] outline-none"
                style={{ color: 'var(--admin-text)' }}
              />
              <button onClick={() => setOpen(false)} aria-label="Close search" className="p-1 rounded-lg shrink-0">
                <X className="w-4 h-4" style={{ color: 'var(--admin-text-3)' }} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto py-1.5">
              {results.length === 0 ? (
                <p className="px-4 py-6 text-center text-[13px]" style={{ color: 'var(--admin-text-3)' }}>
                  Nothing matches “{q}”
                </p>
              ) : (
                results.map((r, i) => {
                  const Icon = ICONS[r.group]
                  return (
                    <button
                      key={r.id}
                      onClick={() => go(r)}
                      onMouseEnter={() => setActive(i)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                      style={{ background: i === active ? 'var(--admin-bg-muted)' : '' }}
                    >
                      <Icon className="w-4 h-4 shrink-0" style={{ color: 'var(--admin-text-3)' }} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] truncate" style={{ color: 'var(--admin-text)' }}>{r.label}</span>
                        {r.sub && (
                          <span className="block text-[11px] truncate" style={{ color: 'var(--admin-text-3)' }}>{r.sub}</span>
                        )}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider shrink-0" style={{ color: 'var(--admin-text-3)' }}>
                        {r.group}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
