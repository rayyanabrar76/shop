'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentType, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/currency'
import { buildCommands, scoreText } from '@/lib/admin-commands'
import { storeInitials } from '@/lib/store-initials'
import { useAdminTheme } from './AdminThemeProvider'
import {
  Search, Clock, Wand2, X, CornerDownLeft, SearchX, Loader2, ArrowUpRight,
} from 'lucide-react'
import {
  HiHome, HiCube, HiTag, HiPaintBrush, HiCog6Tooth, HiClipboardDocumentList, HiUser,
  HiSquares2X2, HiRectangleStack, HiBolt,
} from 'react-icons/hi2'

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>

type Group = 'Navigation' | 'Settings' | 'Actions' | 'Customization' | 'Products' | 'Categories' | 'Orders' | 'Customers'

type Row = {
  id: string
  group: Group
  label: string
  sub?: string
  href: string
  /** Per-item icon. Falls back to the group's icon when absent. */
  icon?: Icon
  /** A photo in place of the icon: product shots and category covers. */
  image?: string | null
  /** Initials in a disc in place of the icon: customers have no photo. */
  avatar?: string
  badge?: { label: string; tone: 'green' | 'amber' | 'red' | 'violet' }
  /** Right-aligned detail such as a price. */
  trailing?: string
  /** Extra words this row answers to, beyond its label. */
  keywords?: string[]
  /** Performed on Enter instead of navigating. */
  run?: () => void
  /** Handed to the browser rather than the router (a file download). */
  external?: boolean
}

const GROUP_ICONS: Record<Group, Icon> = {
  Navigation: HiHome, Settings: HiCog6Tooth, Actions: Wand2, Customization: HiPaintBrush,
  Products: HiCube, Categories: HiTag, Orders: HiClipboardDocumentList, Customers: HiUser,
}

/**
 * The rail down the left of the panel. Each entry is a scope: a slice of
 * everything the search knows, with a count beside it that follows what is
 * typed. "Pages" gathers every place you can go (the sidebar, the settings
 * sub-pages, the editor panels) so the rail stays seven items long.
 */
type Scope = 'all' | 'Products' | 'Categories' | 'Orders' | 'Customers' | 'Pages' | 'Actions'
const RAIL: { id: Scope; label: string; icon: Icon; groups: Group[] | null; page?: string }[] = [
  { id: 'all', label: 'Everything', icon: HiSquares2X2, groups: null },
  { id: 'Products', label: 'Products', icon: HiCube, groups: ['Products'], page: 'products' },
  { id: 'Categories', label: 'Categories', icon: HiTag, groups: ['Categories'], page: 'categories' },
  { id: 'Orders', label: 'Orders', icon: HiClipboardDocumentList, groups: ['Orders'], page: 'orders' },
  { id: 'Customers', label: 'Customers', icon: HiUser, groups: ['Customers'], page: 'customers' },
  { id: 'Pages', label: 'Pages', icon: HiRectangleStack, groups: ['Navigation', 'Settings', 'Customization'] },
  { id: 'Actions', label: 'Actions', icon: HiBolt, groups: ['Actions'] },
]
const railOf = (scope: Scope) => RAIL.find(r => r.id === scope)!

/**
 * The header's own breakpoint. Below it the field is a short slot between the
 * menu button and the store chip, and the results have to leave it.
 */
const PHONE = '(max-width: 767px)'
const phoneStore = {
  subscribe(cb: () => void) {
    const mq = window.matchMedia(PHONE)
    mq.addEventListener('change', cb)
    return () => mq.removeEventListener('change', cb)
  },
  get: () => window.matchMedia(PHONE).matches,
  server: () => false,
}
const inScope = (row: Row, scope: Scope) => {
  const groups = railOf(scope).groups
  return groups === null || groups.includes(row.group)
}

/** What the idle "Everything" view is made of, and what it calls each part. */
const IDLE_TITLES: Partial<Record<Group, string>> = { Orders: 'Latest orders', Actions: 'Quick actions' }
const QUICK_ACTIONS = ['act-add-product', 'act-add-category', 'act-export-orders']

const ORDER_STATUS: Record<string, NonNullable<Row['badge']>> = {
  PAID: { label: 'Paid', tone: 'green' },
  PENDING: { label: 'Pending', tone: 'amber' },
  CANCELLED: { label: 'Cancelled', tone: 'red' },
  REFUNDED: { label: 'Refunded', tone: 'violet' },
}
const TONE = {
  green: 'bg-green-500/12 text-green-800 dark:text-green-300',
  amber: 'bg-amber-500/14 text-amber-800 dark:text-amber-300',
  red: 'bg-red-500/12 text-red-800 dark:text-red-300',
  violet: 'bg-violet-500/12 text-violet-800 dark:text-violet-300',
}
const DOT = { green: 'bg-green-500', amber: 'bg-amber-500', red: 'bg-red-500', violet: 'bg-violet-500' }

const RECENTS_KEY = 'shopflow_admin_recent_searches'
const MAX_RECENTS = 5

// ── Surface tokens ─────────────────────────────────────────────────────────
// Every tint here is mixed from the theme's own text colour, so the same
// values read correctly on the light and dark admin without a second set.
const tint = (pct: number) => `color-mix(in srgb, var(--admin-text) ${pct}%, transparent)`
// The field sits on the dark header rail rather than on the page, so it
// mixes from the bar's own text colour. The panel below it is a normal
// card on the page and keeps using tint().
const barTint = (pct: number) => `color-mix(in srgb, var(--admin-header-text) ${pct}%, transparent)`

const shortDate = (d: string | Date) =>
  new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : (word.endsWith('h') ? 'es' : 's')}`

/** Wraps the matched part of a label so the eye lands on why this row is
    here. Only the first occurrence: highlighting every "a" in a title is
    noise, not signal. */
function highlight(label: string, term: string): ReactNode {
  if (!term) return label
  const i = label.toLowerCase().indexOf(term.toLowerCase())
  if (i < 0) return label
  return (
    <>
      {label.slice(0, i)}
      <mark className="bg-transparent font-semibold" style={{ color: 'var(--admin-text)' }}>
        {label.slice(i, i + term.length)}
      </mark>
      {label.slice(i + term.length)}
    </>
  )
}

/**
 * Search across a store's admin: products, categories, orders, customers,
 * and the dashboard's own pages and actions.
 *
 * The panel folds down out of the header field and is split in two: a rail
 * of scopes on the left, results on the right. Typing filters whatever scope
 * is chosen and updates the count beside every other one, so a word that
 * finds nothing in products still shows where it would land. Tab walks the
 * rail; Escape backs out of a scope before it closes the panel.
 *
 * Idle, it shows the store's latest orders and a few quick actions rather
 * than a menu of pages: the pages are one Tab away in the rail.
 */
export default function AdminSearch({ storeId, currency }: { storeId: string; currency?: string }) {
  const router = useRouter()
  const { setMode } = useAdminTheme()
  const setModeRef = useRef(setMode)
  useEffect(() => { setModeRef.current = setMode }, [setMode])
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const phone = useSyncExternalStore(phoneStore.subscribe, phoneStore.get, phoneStore.server)

  // The page stays visible under the sheet, dimmed, and must not scroll
  // when a finger overshoots the list onto it.
  useEffect(() => {
    if (!(open && phone)) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open, phone])
  const [rows, setRows] = useState<Row[]>([])
  const [active, setActive] = useState(0)
  const [scope, setScopeState] = useState<Scope>('all')
  const [recents, setRecents] = useState<string[]>([])
  const [isMac, setIsMac] = useState(false)
  /** Bumped on each open. Keys the result list so its rows remount and
      their entrance replays, without remounting the panel itself. */
  const [openSeq, setOpenSeq] = useState(0)
  /** True while the store's data is being fetched, so an empty list can say
      "loading" instead of "nothing" for the first half-second. */
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const loaded = useRef<string | null>(null)
  const base = `/dashboard/stores/${storeId}`

  function setScope(next: Scope) {
    setScopeState(next)
    setActive(0)
    inputRef.current?.focus()
  }

  // Recent searches persist per browser, not per session: they are a
  // convenience for the person at this machine, not part of the store's data.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY)
      if (raw) setRecents(JSON.parse(raw))
    } catch {
      /* storage can be unavailable or corrupt; losing recents is not worth an error */
    }
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform))
  }, [])

  function saveRecent(term: string) {
    const trimmed = term.trim()
    if (trimmed.length < 2) return
    setRecents(prev => {
      const next = [trimmed, ...prev.filter(r => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENTS)
      try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  function clearRecents() {
    setRecents([])
    try { localStorage.removeItem(RECENTS_KEY) } catch { /* ignore */ }
  }

  // Fetched on every open, not once per store: a product added a moment ago
  // has to be findable a moment later. Rows already in hand stay on screen
  // while the fresh ones load, so reopening never flashes empty; only a
  // store switch clears them first.
  useEffect(() => {
    if (!open || !storeId) return
    if (loaded.current !== storeId) { setRows([]); loaded.current = storeId }
    setLoading(true)
    const get = (path: string) => fetch(`/api/stores/${storeId}/${path}`).then(r => (r.ok ? r.json() : []))
    Promise.allSettled([get('products'), get('categories'), get('orders'), get('customers')]).then(([p, c, o, u]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list = (x: PromiseSettledResult<any>) => (x.status === 'fulfilled' && Array.isArray(x.value) ? x.value : [])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const products: Row[] = list(p).map((x: any) => {
        const stock = Number(x.inventory) || 0
        return {
          id: `p-${x.id}`, group: 'Products', label: x.title,
          sub: stock > 0 ? `${stock} available` : 'Out of stock',
          trailing: formatPrice(x.price, currency),
          image: x.imageUrl ?? null,
          badge: x.status === 'active' ? { label: 'Active', tone: 'green' } : { label: 'Draft', tone: 'amber' },
          href: `${base}/products/${x.id}`,
        }
      })

      const catsRaw = c.status === 'fulfilled' ? (Array.isArray(c.value) ? c.value : c.value?.categories ?? []) : []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const categories: Row[] = catsRaw.map((x: any) => ({
        id: `c-${x.id}`, group: 'Categories', label: x.name,
        sub: typeof x._count?.products === 'number' ? plural(x._count.products, 'product') : undefined,
        image: x.imageUrl ?? null,
        href: `${base}/categories/${x.id}`,
      }))

      // An order answers to the person, the id, the status and what was in
      // it: "cinnamon" finds every order with that donut, "pending" every
      // one still waiting.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orders: Row[] = list(o).map((x: any) => {
        const status = ORDER_STATUS[x.status] ?? { label: x.status, tone: 'amber' as const }
        return {
          id: `o-${x.id}`, group: 'Orders',
          label: x.customerName || x.customerEmail || 'Guest order',
          sub: [`#${x.id.slice(0, 7)}`, shortDate(x.createdAt), plural(x.itemCount ?? 0, 'item')].join(' · '),
          trailing: formatPrice(x.total, currency),
          badge: status,
          keywords: [x.id, x.id.slice(0, 7), status.label, x.customerEmail ?? '', ...(x.itemTitles ?? [])].filter(Boolean),
          href: `${base}/orders/${x.id}`,
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customers: Row[] = list(u).map((x: any) => ({
        id: `u-${x.id}`, group: 'Customers',
        label: x.name || x.email,
        sub: [x.name ? x.email : null, x.orders > 0 ? plural(x.orders, 'order') : 'No orders yet'].filter(Boolean).join(' · '),
        trailing: x.spent > 0 ? formatPrice(x.spent, currency) : undefined,
        avatar: storeInitials(x.name || x.email.split('@')[0]),
        keywords: [x.email, x.name ?? ''].filter(Boolean),
        href: `${base}/customers?q=${encodeURIComponent(x.email)}`,
      }))

      setRows([...products, ...categories, ...orders, ...customers])
    }).finally(() => setLoading(false))
  }, [open, storeId, currency, base])

  useEffect(() => {
    if (open) {
      setOpenSeq(n => n + 1)
      const t = setTimeout(() => inputRef.current?.focus(), 20)
      return () => clearTimeout(t)
    }
    // Cleared after the fold-up, so typing again within it is not wiped.
    const t = setTimeout(() => { setQ(''); setActive(0); setScopeState('all') }, 150)
    return () => clearTimeout(t)
  }, [open])

  // Keyboard users move the highlight faster than they can read; keep the
  // active row on screen without yanking the list around for mouse users.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  // Cmd/Ctrl-K anywhere. Escape backs out one layer: a scope first, then
  // the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(v => !v) }
      if (e.key === 'Escape') {
        if (scope !== 'all') { setScopeState('all'); setActive(0); return }
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [scope])

  // Close on outside click. Capture phase on mousedown so this fires before
  // any click handler underneath reacts to the same gesture. Deliberately no
  // scroll listener: the field is fixed in the header, so the panel stays put
  // while the page moves under it.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown, true)
    return () => document.removeEventListener('mousedown', onPointerDown, true)
  }, [open])

  const term = q.trim().toLowerCase()
  // "#a1b2c3" is how an order id is written on screen; the hash is not part
  // of what is stored.
  const tokens = useMemo(() => term.split(/\s+/).map(t => t.replace(/^#/, '')).filter(Boolean), [term])

  // Every place and action in the admin, with the words people use for
  // them. Built once per store; the theme actions close over a ref so the
  // list does not rebuild every time the provider re-renders.
  const commandRows = useMemo<Row[]>(
    () =>
      buildCommands(storeId).map(c => ({
        id: c.id,
        group: c.group,
        label: c.label,
        sub: c.sub,
        href: c.href ?? '',
        icon: c.icon,
        keywords: c.keywords,
        external: c.external,
        run:
          c.action === 'theme:dark' ? () => setModeRef.current('dark')
          : c.action === 'theme:light' ? () => setModeRef.current('light')
          : c.action === 'theme:system' ? () => setModeRef.current('system')
          : undefined,
      })),
    [storeId],
  )

  const all = useMemo(() => [...commandRows, ...rows], [commandRows, rows])

  // Idle: every count is a size. Typing: every count is a number of hits,
  // so the rail doubles as a map of where the word lands.
  const counts = useMemo(() => {
    const out = {} as Record<Scope, number>
    for (const r of RAIL) {
      const pool = all.filter(x => inScope(x, r.id))
      out[r.id] = tokens.length ? pool.filter(x => scoreText(x, tokens) > 0).length : pool.length
    }
    return out
  }, [all, tokens])

  const results = useMemo(() => {
    const pool = all.filter(r => inScope(r, scope))
    if (!tokens.length) {
      if (scope !== 'all') return pool.slice(0, 80)
      // The idle overview: the three newest orders, then the actions a
      // merchant reaches for most. Pages live in the rail.
      return [
        ...rows.filter(r => r.group === 'Orders').slice(0, 3),
        ...commandRows.filter(r => QUICK_ACTIONS.includes(r.id)),
      ]
    }
    // Ranked by how well each row answers the words, not by where a
    // substring happens to fall: "dark" puts the theme switch first, and
    // "stripe" finds Payments even though the word appears nowhere in its
    // title.
    return pool
      .map(r => ({ r, score: scoreText(r, tokens) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || a.r.label.localeCompare(b.r.label))
      .slice(0, scope === 'all' ? 16 : 80)
      .map(x => x.r)
  }, [all, rows, commandRows, tokens, scope])

  function go(row: Row) {
    if (q.trim()) saveRecent(q)
    setOpen(false)
    // An action is done, not visited: the theme flips under the panel as
    // it closes, which is the whole point of searching "dark".
    if (row.run) { row.run(); return }
    if (row.external) { window.open(row.href, '_blank', 'noopener'); return }
    router.push(row.href)
  }

  function runRecent(t: string) {
    setQ(t)
    setActive(0)
    inputRef.current?.focus()
  }

  function stepScope(dir: 1 | -1) {
    const i = RAIL.findIndex(r => r.id === scope)
    setScope(RAIL[(i + dir + RAIL.length) % RAIL.length].id)
  }

  const typing = tokens.length > 0
  const idleAll = !typing && scope === 'all'
  const showRecents = idleAll && recents.length > 0
  const rail = railOf(scope)

  // One heading per group, not one per row. Under a single scope the rail
  // already names the group, so no heading at all.
  const grouped = useMemo(
    () =>
      Object.entries(
        results.reduce<Record<string, { row: Row; index: number }[]>>((acc, row, index) => {
          ;(acc[row.group] ??= []).push({ row, index })
          return acc
        }, {}),
      ),
    [results],
  )

  return (
    <>
      {/* The rest of the admin steps back while you search. Rendered outside
          rootRef on purpose: the outside-click handler treats anything inside
          it as "still searching", and a scrim is the opposite of that. */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-119 transition-opacity duration-200"
        style={{
          background: 'rgba(0,0,0,0.45)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

    <div ref={rootRef} className="relative w-full min-h-9">
      {/* ── Field ───────────────────────────────────────────────────────── */}
      <div
        // Width and height live in the branch, not the base: a fixed element
        // given left, right AND w-full overflows by its insets, and h-9 next
        // to h-10 is the same-group conflict that has bitten this codebase
        // three times today.
        className={`group/field z-121 flex items-center gap-2.5 pl-3 pr-1.5 rounded-lg text-left transition-[background,border-color,box-shadow,color] duration-200 ${
          open && phone ? 'fixed left-2 right-2 top-2.5 h-10' : 'relative w-full h-9'
        } ${
          open ? '' : 'bg-(--admin-header-field) hover:bg-white/9'
        }`}
        style={{
          // Closed, a tinted well in the black bar. Open, an input sitting
          // inside the card that has appeared around it.
          background: open ? 'var(--admin-card)' : undefined,
          border: `1px solid ${open ? tint(60) : barTint(10)}`,
          boxShadow: open ? `0 0 0 1px ${tint(60)}` : 'inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {open && loading ? (
          <Loader2 className="w-4 h-4 shrink-0 animate-spin" style={{ color: 'var(--admin-text-2)' }} strokeWidth={2.25} />
        ) : (
          <Search
            className="w-4 h-4 shrink-0 transition-colors duration-200"
            style={{ color: open ? 'var(--admin-text-2)' : 'var(--admin-header-text-3)' }}
            strokeWidth={2.25}
          />
        )}
        <input
          ref={inputRef}
          value={q}
          onFocus={() => setOpen(true)}
          onChange={e => { setQ(e.target.value); setActive(0); setOpen(true) }}
          onKeyDown={e => {
            if (e.key === 'Tab') { e.preventDefault(); stepScope(e.shiftKey ? -1 : 1) }
            if (e.key === 'Backspace' && !q && scope !== 'all') { e.preventDefault(); setScope('all') }
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
            if (e.key === 'Enter' && results[active]) go(results[active])
          }}
          placeholder={scope === 'all' ? 'Search products, orders, customers, settings…' : `Search ${rail.label.toLowerCase()}…`}
          className={`${open ? 'admin-panel-field' : 'admin-header-field'} flex-1 min-w-0 bg-transparent text-[13.5px] max-md:text-[13px] outline-none transition-colors duration-200`}
          style={{ color: open ? 'var(--admin-text)' : 'var(--admin-header-text)' }}
        />

        {q ? (
          <button
            onMouseDown={e => e.preventDefault() /* keep focus in the input */}
            onClick={() => { setQ(''); setActive(0); inputRef.current?.focus() }}
            aria-label="Clear search"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors"
            style={{ color: 'var(--admin-text-3)' }}
            onMouseEnter={e => (e.currentTarget.style.background = tint(8))}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        ) : !open ? (
          <kbd
            className="hidden md:inline-flex h-6 shrink-0 items-center gap-0.5 px-1.5 rounded-md font-sans text-[10.5px] font-medium leading-none tracking-wide select-none"
            style={{
              color: 'var(--admin-header-text-3)',
              background: barTint(9),
              border: `1px solid ${barTint(14)}`,
            }}
          >
            {isMac ? '⌘' : 'Ctrl'}
            <span style={{ opacity: 0.5 }}>+</span>K
          </kbd>
        ) : null}
      </div>

      {/* ── Panel ───────────────────────────────────────────────────────── */}
      <div
        inert={!open}
        aria-hidden={!open}
        className={phone
          ? 'fixed inset-x-0 top-0 z-120 max-h-[78dvh] rounded-b-2xl overflow-hidden flex flex-col'
          : 'absolute -left-3 -right-3 -top-2 z-120 rounded-2xl overflow-hidden origin-top'}
        style={{
          // The card surrounds the field: it starts above and outside it and
          // its content begins beneath it, so the input reads as living
          // inside the card rather than the card hanging off the input. On a
          // phone the card hangs from the top edge and the field is a bar
          // across it, so the padding is that bar's height.
          paddingTop: phone ? '3.75rem' : 'calc(0.5rem + 2.25rem + 0.5rem)',
          // A fold, not a fade. The card is hinged along its top edge and
          // swings down out of the search bar in shallow 3D, settling flat.
          // It folds back up faster, on a plain ease-in, the way a physical
          // flap drops open slowly and snaps shut.
          transformOrigin: 'top center',
          transitionProperty: 'opacity, transform',
          transitionDuration: open ? '280ms' : '160ms',
          transitionTimingFunction: open ? 'cubic-bezier(0.2, 0.9, 0.25, 1.05)' : 'cubic-bezier(0.4, 0, 1, 1)',
          opacity: open ? 1 : 0,
          // A sheet does not hinge; a full-screen surface tilting in
          // perspective reads as the whole phone warping. It just rises.
          transform: phone
            ? (open ? 'translateY(0)' : 'translateY(10px)')
            : open
              ? 'perspective(1400px) rotateX(0deg) translateY(0)'
              : 'perspective(1400px) rotateX(-16deg) translateY(-6px)',
          backfaceVisibility: 'hidden',
          willChange: 'transform, opacity',
          pointerEvents: open ? 'auto' : 'none',
          background: 'var(--admin-card)',
          boxShadow: [
            `0 0 0 1px ${tint(8)}`,
            '0 8px 16px -8px rgba(0,0,0,0.25)',
            '0 32px 72px -16px rgba(0,0,0,0.5)',
          ].join(', '),
        }}
      >
        <div className="flex flex-col sm:flex-row max-md:flex-1 max-md:min-h-0" style={{ borderTop: `1px solid ${tint(6)}` }}>
          {/* ── Rail ──
              A strip of scopes on a slightly recessed ground. On a phone it
              lies along the top and scrolls sideways; on a desktop it stands
              down the left. The chosen scope is a filled pill; the others
              carry their count in a quieter tone, and a scope with nothing
              for the current word fades rather than disappears, so the rail
              never jumps under the pointer. */}
          <nav
            aria-label="Search in"
            className="flex sm:flex-col gap-0.5 p-1.5 shrink-0 overflow-x-auto sm:overflow-visible sm:w-35 border-b sm:border-b-0 sm:border-r [scrollbar-width:none]"
            style={{ background: tint(2.5), borderColor: tint(6) }}
          >
            {RAIL.map(r => {
              const on = r.id === scope
              const n = counts[r.id] ?? 0
              const dim = typing && n === 0 && !on
              const RailIcon = r.icon
              return (
                <button
                  key={r.id}
                  type="button"
                  onMouseDown={e => e.preventDefault() /* keep focus in the input */}
                  onClick={() => setScope(on && r.id !== 'all' ? 'all' : r.id)}
                  aria-pressed={on}
                  className="flex h-8 max-md:h-7 shrink-0 items-center gap-2 max-md:gap-1.5 rounded-md pl-2 pr-1.5 text-left text-[12.5px] max-md:text-[11.5px] transition-[background,color,opacity] duration-150"
                  style={{
                    background: on ? 'var(--admin-text)' : 'transparent',
                    color: on ? 'var(--admin-bg)' : 'var(--admin-text-2)',
                    opacity: dim ? 0.45 : 1,
                  }}
                  onMouseEnter={e => { if (!on) e.currentTarget.style.background = tint(6) }}
                  onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent' }}
                >
                  <RailIcon className="w-4 h-4 shrink-0" />
                  <span className={`flex-1 truncate ${on ? 'font-semibold' : 'font-medium'}`}>{r.label}</span>
                  <span
                    className="hidden sm:inline min-w-4.5 text-center text-[10.5px] tabular-nums px-1 rounded"
                    style={{
                      color: on ? 'var(--admin-bg)' : 'var(--admin-text-4)',
                      background: on ? 'rgba(255,255,255,0.18)' : 'transparent',
                    }}
                  >
                    {n}
                  </span>
                </button>
              )
            })}
          </nav>

          {/* ── Pane ── */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col">
            {/* Under a scope, one line says how much is here and where the
                whole list lives. Under "Everything" the group headings do
                that job. */}
            {scope !== 'all' && (
              <div
                className="flex items-center justify-between h-8 max-md:h-7 pl-3.5 max-md:pl-3 pr-2 text-[11px] max-md:text-[10.5px]"
                style={{ color: 'var(--admin-text-3)', borderBottom: `1px solid ${tint(6)}` }}
              >
                <span className="tabular-nums">
                  {typing
                    ? `${plural(results.length, 'match')} in ${rail.label.toLowerCase()}`
                    : loading && counts[scope] === 0 ? 'Loading…' : `${counts[scope]} ${rail.label.toLowerCase()}`}
                </span>
                {rail.page && (
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => { setOpen(false); router.push(`${base}/${rail.page}`) }}
                    className="flex h-6 items-center gap-0.5 rounded-md px-1.5 font-medium transition-colors"
                    style={{ color: 'var(--admin-text-2)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = tint(6))}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    Open all
                    <ArrowUpRight className="w-3 h-3" strokeWidth={2.25} />
                  </button>
                )}
              </div>
            )}

            {showRecents && (
              <div className="px-2 pt-1.5 pb-1" style={{ borderBottom: `1px solid ${tint(6)}` }}>
                <div className="flex items-center justify-between px-2.5 pb-0.5">
                  <span className="text-[10.5px] max-md:text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--admin-text-4)' }}>
                    Recent
                  </span>
                  <button
                    onClick={clearRecents}
                    className="text-[11px] max-md:text-[10.5px] font-medium hover:underline"
                    style={{ color: 'var(--admin-text-3)' }}
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 px-1 pb-1">
                  {recents.map(t => (
                    <button
                      key={t}
                      onClick={() => runRecent(t)}
                      className="flex h-6.5 max-md:h-6 max-w-full items-center gap-1.5 rounded-md pl-1.5 pr-2 text-[12px] max-md:text-[11px] transition-colors"
                      style={{ background: tint(5), color: 'var(--admin-text-2)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = tint(9))}
                      onMouseLeave={e => (e.currentTarget.style.background = tint(5))}
                    >
                      <Clock className="w-3 h-3 shrink-0" strokeWidth={2.25} style={{ color: 'var(--admin-text-4)' }} />
                      <span className="truncate">{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div
              key={openSeq}
              ref={listRef}
              className="max-h-[min(56vh,380px)] max-md:max-h-none max-md:flex-1 overflow-y-auto overscroll-contain px-2 max-md:px-1.5 pt-1.5 pb-2 mask-[linear-gradient(to_bottom,transparent,black_8px,black_calc(100%-10px),transparent)]"
            >
              {results.length === 0 && loading ? (
                // Placeholder rows in the shape of real ones, so the pane
                // does not jump when they arrive.
                <div className="px-2 py-2 space-y-1" aria-busy>
                  {[0, 1, 2, 3].map(k => (
                    <div key={k} className="h-11 flex items-center gap-2.5 px-2.5">
                      <span className="h-7 w-7 shrink-0 rounded-md animate-pulse" style={{ background: tint(6) }} />
                      <span className="flex-1 space-y-1.5">
                        <span className="block h-2.5 w-2/5 rounded animate-pulse" style={{ background: tint(6) }} />
                        <span className="block h-2 w-1/4 rounded animate-pulse" style={{ background: tint(4) }} />
                      </span>
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center px-4 pt-7 pb-8 text-center">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: tint(5), color: 'var(--admin-text-3)' }}
                  >
                    <SearchX className="w-4.5 h-4.5" strokeWidth={2} />
                  </span>
                  <p className="mt-3 text-[13px] max-md:text-[12px] font-medium" style={{ color: 'var(--admin-text)' }}>
                    {typing
                      ? scope === 'all' ? <>No results for “{q.trim()}”</> : <>No {rail.label.toLowerCase()} match “{q.trim()}”</>
                      : scope === 'all' ? 'Nothing here yet' : `No ${rail.label.toLowerCase()} yet`}
                  </p>
                  <p className="mt-0.5 text-[12px] max-md:text-[11px]" style={{ color: 'var(--admin-text-3)' }}>
                    {typing
                      ? scope === 'all' ? 'Try “dark theme”, “currency”, “logo”, or a product name' : 'Try another word, or widen the search.'
                      : scope === 'all' ? 'Orders and quick actions will show up here.' : 'Add one and it will show up here.'}
                  </p>
                  {typing && scope !== 'all' && counts.all > 0 && (
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => setScope('all')}
                      className="mt-3 h-7 rounded-md px-2.5 text-[12px] font-medium transition-colors"
                      style={{ background: tint(7), color: 'var(--admin-text)' }}
                    >
                      Search everything ({counts.all})
                    </button>
                  )}
                </div>
              ) : (
                grouped.map(([group, entries], gi) => {
                  const heading = scope === 'all'
                  return (
                    <div
                      key={group}
                      className={gi > 0 && heading ? 'mt-1.5 pt-1.5' : ''}
                      style={{ borderTop: gi > 0 && heading ? `1px solid ${tint(6)}` : 'none' }}
                    >
                      {heading && (
                        <div className="flex items-center justify-between px-2.5 pt-1.5 pb-1">
                          <p className="text-[10.5px] max-md:text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--admin-text-4)' }}>
                            {(idleAll && IDLE_TITLES[group as Group]) || group}
                          </p>
                          {!idleAll && (
                            <span className="text-[10.5px] tabular-nums" style={{ color: 'var(--admin-text-4)' }}>
                              {entries.length}
                            </span>
                          )}
                        </div>
                      )}
                      {entries.map(({ row: r, index: i }) => {
                        const RowIcon = r.icon ?? GROUP_ICONS[r.group]
                        const isActive = i === active
                        return (
                          <button
                            key={r.id}
                            role="option"
                            aria-selected={isActive}
                            data-active={isActive}
                            onClick={() => go(r)}
                            onMouseMove={() => { if (!isActive) setActive(i) }}
                            className="admin-row-in w-full h-11 max-md:h-10 flex items-center gap-2.5 max-md:gap-2 rounded-lg px-2.5 max-md:px-2 text-left transition-[background,box-shadow] duration-100"
                            style={{
                              background: isActive ? tint(6) : 'transparent',
                              boxShadow: isActive ? `inset 0 0 0 1px ${tint(6)}` : 'none',
                              animationDelay: `${Math.min(i, 8) * 22}ms`,
                            }}
                          >
                            {/* A photo keeps a tile, initials a disc, a glyph sits bare. */}
                            {r.image ? (
                              <span
                                className="flex h-7 w-7 max-md:h-6 max-md:w-6 shrink-0 items-center justify-center overflow-hidden rounded-md"
                                style={{ background: 'var(--admin-bg)', boxShadow: `inset 0 0 0 1px ${tint(10)}` }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={r.image} alt="" className="h-full w-full object-cover" />
                              </span>
                            ) : r.avatar ? (
                              <span
                                className="flex h-7 w-7 max-md:h-6 max-md:w-6 shrink-0 items-center justify-center rounded-full text-[10px] max-md:text-[9px] font-bold tracking-wide"
                                style={{ background: tint(8), color: 'var(--admin-text)' }}
                              >
                                {r.avatar}
                              </span>
                            ) : (
                              <span
                                className="flex w-6 shrink-0 items-center justify-center transition-colors duration-100"
                                style={{ color: isActive ? 'var(--admin-text)' : 'var(--admin-text-2)' }}
                              >
                                <RowIcon className="w-4 h-4 max-md:w-3.5 max-md:h-3.5" />
                              </span>
                            )}

                            <span className="flex-1 min-w-0">
                              <span className="flex items-center gap-2 min-w-0">
                                <span className="text-[13px] max-md:text-[12px] font-medium truncate" style={{ color: 'var(--admin-text)' }}>
                                  {highlight(r.label, tokens[0] ?? '')}
                                </span>
                                {r.badge && (
                                  <span className={`inline-flex shrink-0 items-center gap-1 pl-1.5 pr-2 h-4.5 max-md:h-4 max-md:pr-1.5 rounded-full text-[10.5px] max-md:text-[9.5px] font-medium ${TONE[r.badge.tone]}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${DOT[r.badge.tone]}`} />
                                    {r.badge.label}
                                  </span>
                                )}
                              </span>
                              {r.sub && (
                                <span className="block text-[11.5px] max-md:text-[10.5px] truncate mt-px" style={{ color: 'var(--admin-text-3)' }}>
                                  {r.sub}
                                </span>
                              )}
                            </span>

                            {r.trailing && (
                              <span className="shrink-0 text-[12px] max-md:text-[11px] tabular-nums" style={{ color: 'var(--admin-text-3)' }}>
                                {r.trailing}
                              </span>
                            )}

                            {/* The Enter affordance only on the row Enter would open. */}
                            <span
                              className="hidden md:flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-opacity duration-100"
                              style={{
                                opacity: isActive ? 1 : 0,
                                color: 'var(--admin-text-3)',
                                background: 'var(--admin-bg)',
                                boxShadow: `inset 0 0 0 1px ${tint(10)}`,
                              }}
                            >
                              <CornerDownLeft className="w-3 h-3" strokeWidth={2.25} />
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer: keyboard hints. Desktop only; there are no arrow keys on a
            phone, and the strip would just steal a row of results. */}
        <div
          className="hidden md:flex items-center gap-3.5 px-3.5 h-8 text-[10.5px]"
          style={{ color: 'var(--admin-text-3)', borderTop: `1px solid ${tint(7)}`, background: tint(2.5) }}
        >
          <Hint keys={['↑', '↓']}>navigate</Hint>
          <Hint keys={['tab']}>scope</Hint>
          <Hint keys={['↵']}>open</Hint>
          <Hint keys={['esc']}>{scope === 'all' ? 'close' : 'back'}</Hint>
        </div>
      </div>
    </div>
    </>
  )
}

function Hint({ keys, children }: { keys: string[]; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex gap-0.5">
        {keys.map(k => (
          <kbd
            key={k}
            className="inline-flex h-4 min-w-4 items-center justify-center rounded px-1 font-sans text-[9.5px] font-medium leading-none"
            style={{ color: 'var(--admin-text-3)', background: 'var(--admin-bg)', boxShadow: `inset 0 0 0 1px ${tint(10)}, inset 0 -1px 0 ${tint(8)}` }}
          >
            {k}
          </kbd>
        ))}
      </span>
      {children}
    </span>
  )
}
