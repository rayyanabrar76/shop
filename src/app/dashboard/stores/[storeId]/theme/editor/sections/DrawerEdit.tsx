'use client'

import { useEffect, useState } from 'react'
import SectionHeader from './SectionHeader'
import { ThemeState, labelCls, inputCls } from '../types'
import { ToggleRow } from '../controls'
import {
  DRAWER_ORDER, DRAWER_SECTION_NAMES, resolveDrawer,
  type DrawerConfig, type DrawerSectionKey,
} from '@/lib/drawer'
import {
  ChevronDown, GripVertical, ImageIcon, Menu, Package, Plus, Tag, Trash2, X,
} from 'lucide-react'

interface Category { id: string; name: string; slug: string }
interface Product { id: string; title: string; price: number; imageUrl?: string | null }

interface DrawerEditProps {
  storeId: string
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
  /** Jumps to the header's link editor, which is the same list this shows. */
  onOpenPanel?: (view: string) => void
}

const ICONS: Record<DrawerSectionKey, React.ComponentType<{ className?: string }>> = {
  links: Menu,
  allProducts: Package,
  categories: Tag,
  carousel: ImageIcon,
  contact: Menu,
}

/**
 * The mobile drawer, block by block.
 *
 * Its own panel rather than a group inside Header. The header is a bar with a
 * logo and a row of links; the drawer is a page of its own that happens to
 * open out of it, and burying six collapsible blocks under the bar's colour
 * and height settings makes both harder to find.
 */
export default function DrawerEdit({ storeId, theme, updateTheme, onBack, onOpenPanel }: DrawerEditProps) {
  const drawer = resolveDrawer(theme.drawer)
  const [open, setOpen] = useState<DrawerSectionKey | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch(`/api/stores/${storeId}/categories`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setCategories(d?.categories ?? d ?? []))
      .catch(() => {})
    fetch(`/api/stores/${storeId}/products?limit=100`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setProducts(d?.products ?? d ?? []))
      .catch(() => {})
  }, [storeId])

  /** Writes one block back, leaving the rest of the config alone. */
  function patch<K extends DrawerSectionKey>(key: K, next: Partial<DrawerConfig[K]>) {
    updateTheme({ drawer: { ...drawer, [key]: { ...drawer[key], ...next } } })
  }

  // The two fields every block has. Separate from patch() because they are
  // called with a key that is the whole union, which patch's generic cannot
  // narrow, and widening it would give up the checking on the calls that do
  // name a block.
  function setShow(key: DrawerSectionKey, show: boolean) {
    updateTheme({ drawer: { ...drawer, [key]: { ...drawer[key], show } } })
  }
  function setLabel(key: DrawerSectionKey, label: string) {
    updateTheme({ drawer: { ...drawer, [key]: { ...drawer[key], label } } })
  }

  const pickedCats = drawer.categories.ids.length
    ? drawer.categories.ids.map(id => categories.find(c => c.id === id)).filter((c): c is Category => !!c)
    : []

  const pickedProducts = drawer.carousel.productIds
    .map(id => products.find(p => p.id === id))
    .filter((p): p is Product => !!p)

  return (
    <div>
      <SectionHeader title="Drawer" description="The menu that opens from the header" onBack={onBack} />
      <div className="p-4 space-y-2">
        <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 mb-3">
          Shown on phones, and whenever the header is set to a hamburger. Every
          block below can be renamed, reordered by its own controls, or switched
          off on its own.
        </p>

        {DRAWER_ORDER.map(key => {
          const Icon = ICONS[key]
          const block = drawer[key]
          const isOpen = open === key
          return (
            <div key={key} className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : key)}
                  className="flex flex-1 min-w-0 items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                  <span className="flex-1 min-w-0 truncate text-[12.5px] font-semibold text-zinc-800 dark:text-zinc-100">
                    {DRAWER_SECTION_NAMES[key]}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {/* Outside the disclosure button, so switching a block off does
                    not also open it. */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={block.show}
                  aria-label={`Show ${DRAWER_SECTION_NAMES[key]}`}
                  onClick={() => setShow(key, !block.show)}
                  className={`relative mr-3 h-5 w-9 shrink-0 rounded-full transition-colors ${
                    block.show ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white dark:bg-zinc-900 shadow transition-[left] ${
                      block.show ? 'left-[1.125rem]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/30 px-3 py-3 space-y-3">
                  {/* Every block has a heading, and blank means no heading
                      rather than no block, which is why it is a text field and
                      not part of the switch above. */}
                  <div>
                    <label className={labelCls}>
                      {key === 'allProducts' ? 'Label' : 'Heading'}
                      <span className="normal-case font-normal opacity-60">
                        {key === 'allProducts' ? '' : ' blank hides the heading'}
                      </span>
                    </label>
                    <input
                      className={inputCls}
                      value={block.label}
                      onChange={e => setLabel(key, e.target.value)}
                      placeholder={key === 'allProducts' ? 'All products' : DRAWER_SECTION_NAMES[key]}
                    />
                  </div>

                  {key === 'links' && (
                    <div className="space-y-2">
                      <p className="text-[11px] leading-relaxed text-zinc-500">
                        These are the header&apos;s links, shown a second way. One menu, so
                        a link added here is added to the bar as well.
                      </p>
                      {onOpenPanel && (
                        <button
                          type="button"
                          onClick={() => onOpenPanel('nav-menu')}
                          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-[12px] font-semibold text-zinc-700 dark:text-zinc-200 transition-colors hover:bg-white dark:hover:bg-zinc-800"
                        >
                          Edit the {theme.navLinks?.length ?? 0} menu links
                        </button>
                      )}
                    </div>
                  )}

                  {key === 'categories' && (
                    <PickList
                      empty="Every category, in the order you created them."
                      addLabel="Add a category"
                      options={categories
                        .filter(c => !drawer.categories.ids.includes(c.id))
                        .map(c => ({ id: c.id, label: c.name }))}
                      picked={pickedCats.map(c => ({ id: c.id, label: c.name }))}
                      onChange={idsNext => patch('categories', { ids: idsNext })}
                    />
                  )}

                  {key === 'carousel' && (
                    <>
                      <PickList
                        empty="Nothing picked yet, so the carousel stays hidden."
                        addLabel="Add a product"
                        options={products
                          .filter(p => !drawer.carousel.productIds.includes(p.id))
                          .map(p => ({ id: p.id, label: p.title, imageUrl: p.imageUrl }))}
                        picked={pickedProducts.map(p => ({ id: p.id, label: p.title, imageUrl: p.imageUrl }))}
                        onChange={idsNext => patch('carousel', { productIds: idsNext })}
                      />
                      <ToggleRow
                        label="Show titles"
                        on={drawer.carousel.showTitle}
                        onChange={v => patch('carousel', { showTitle: v })}
                      />
                      <ToggleRow
                        label="Show prices"
                        on={drawer.carousel.showPrice}
                        onChange={v => patch('carousel', { showPrice: v })}
                      />
                    </>
                  )}

                  {key === 'contact' && (
                    <div>
                      <label className={labelCls}>
                        Details <span className="normal-case font-normal opacity-60">blank links to your contact page</span>
                      </label>
                      <textarea
                        className={`${inputCls} resize-y min-h-24 leading-relaxed`}
                        value={drawer.contact.text}
                        onChange={e => patch('contact', { text: e.target.value })}
                        placeholder={'hello@yourshop.com\n+92 300 0000000\nOpen 9 to 6, every day'}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * A chosen, ordered subset of something.
 *
 * Order is the point: a merchant who wants Wallets first should not have to
 * rename anything to get it, so the picked list moves with its own handles and
 * the drawer draws it exactly as it reads here.
 */
function PickList({
  picked,
  options,
  onChange,
  empty,
  addLabel,
}: {
  picked: { id: string; label: string; imageUrl?: string | null }[]
  options: { id: string; label: string; imageUrl?: string | null }[]
  onChange: (ids: string[]) => void
  empty: string
  addLabel: string
}) {
  const [adding, setAdding] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)

  function move(from: string, to: string) {
    if (from === to) return
    const ids = picked.map(p => p.id)
    const next = ids.filter(id => id !== from)
    next.splice(next.indexOf(to), 0, from)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {picked.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-[11px] text-zinc-500">
          {empty}
        </p>
      ) : (
        <div className="space-y-1">
          {picked.map(p => (
            <div
              key={p.id}
              draggable
              onDragStart={() => setDragId(p.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={e => { e.preventDefault(); if (dragId) move(dragId, p.id) }}
              className={`flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 ${
                dragId === p.id ? 'opacity-40' : ''
              }`}
            >
              <GripVertical className="w-3.5 h-3.5 shrink-0 cursor-grab text-zinc-300 dark:text-zinc-600" />
              {p.imageUrl !== undefined && (
                <span className="h-6 w-6 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                  {p.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-[12px] text-zinc-700 dark:text-zinc-200">{p.label}</span>
              <button
                type="button"
                onClick={() => onChange(picked.filter(x => x.id !== p.id).map(x => x.id))}
                aria-label={`Remove ${p.label}`}
                className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="max-h-44 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-2.5 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Pick one</span>
            <button type="button" onClick={() => setAdding(false)} aria-label="Close">
              <X className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
          {options.length === 0 ? (
            <p className="px-2.5 py-3 text-[11px] text-zinc-500">Nothing left to add.</p>
          ) : (
            options.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => { onChange([...picked.map(p => p.id), o.id]); setAdding(false) }}
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {o.imageUrl !== undefined && (
                  <span className="h-6 w-6 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                    {o.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.imageUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-[12px] text-zinc-700 dark:text-zinc-200">{o.label}</span>
              </button>
            ))
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 px-3 py-2 text-[11.5px] font-semibold text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-white dark:hover:bg-zinc-800"
        >
          <Plus className="w-3 h-3" /> {addLabel}
        </button>
      )}
    </div>
  )
}
