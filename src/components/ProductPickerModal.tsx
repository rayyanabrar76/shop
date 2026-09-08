'use client'

import { useState } from 'react'
import { Check, ImageIcon, Search, X } from 'lucide-react'
import { useModalEscape } from '@/components/useModalEscape'

export interface PickableProduct {
  id: string
  title: string
  imageUrl?: string | null
}

/**
 * "Select products to include" — a focused picker that opens over whatever
 * form needs it.
 *
 * The selection is held locally and only handed back on Add, so Cancel really
 * cancels. Keeping it out of the category form also stops a long product title
 * from squeezing that form's layout.
 */
export default function ProductPickerModal({
  products,
  initialSelected,
  onCancel,
  onConfirm,
}: {
  products: PickableProduct[]
  initialSelected: string[]
  onCancel: () => void
  onConfirm: (ids: string[]) => void
}) {
  const [selected, setSelected] = useState<string[]>(initialSelected)
  const [query, setQuery] = useState('')
  // Keyed to the pointer rather than the width: a touchscreen laptop should
  // not get the keyboard thrown at it either. Read once, on mount.
  const [autoFocusSearch] = useState(
    () => typeof window === 'undefined' || window.matchMedia('(hover: hover)').matches,
  )

  useModalEscape(onCancel)

  const filtered = products.filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
  const toggle = (id: string) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))

  return (
    <div
      className="fixed inset-0 z-120 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-3 sm:p-4 dialog-dim"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-xl max-h-[76dvh] sm:max-h-[70vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-(--admin-edge) shadow-[0_32px_80px_-20px_rgba(0,0,0,0.45)] overflow-hidden dialog-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-(--admin-edge) shrink-0">
          <h3 className="min-w-0 truncate text-[13px] sm:text-sm font-bold text-zinc-900 dark:text-zinc-50">Select products to include</h3>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-(--admin-edge) shrink-0">
          <div className="flex items-center gap-2 rounded-xl border border-(--admin-edge) px-3 py-1.5 sm:py-2 focus-within:border-(--admin-field-border-focus) focus-within:ring-4 focus-within:ring-black/5 transition-shadow">
            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input
              autoFocus={autoFocusSearch}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search products"
              className="flex-1 min-w-0 bg-transparent h-8 sm:h-auto text-[13px] sm:text-sm outline-none text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-(--admin-edge)">
          {filtered.length === 0 && (
            <div className="px-4 sm:px-5 py-10 sm:py-14 text-center">
              <p className="text-[11px] sm:text-xs text-zinc-400">
                {products.length === 0 ? 'No products yet.' : 'Nothing matches that search.'}
              </p>
            </div>
          )}
          {filtered.map(p => {
            const on = selected.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={`w-full min-w-0 flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-3 sm:py-3 min-h-11 sm:min-h-0 text-[13px] sm:text-sm text-left transition-colors ${
                  on ? 'bg-zinc-50 dark:bg-zinc-800/60' : 'hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40'
                }`}
              >
                <span
                  className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    on
                      ? 'bg-zinc-900 border-zinc-900 dark:bg-zinc-100 dark:border-zinc-100'
                      : 'border-(--admin-field-border)'
                  }`}
                >
                  {on && <Check className="w-3 h-3 text-white dark:text-zinc-900" strokeWidth={3} />}
                </span>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover shrink-0 border border-(--admin-edge)" />
                ) : (
                  <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-zinc-700 dark:text-zinc-200">{p.title}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 sm:py-3.5 border-t border-(--admin-edge) bg-zinc-50/60 dark:bg-zinc-900 shrink-0">
          <span className="text-[11px] font-semibold text-zinc-400 tabular-nums shrink-0">{selected.length} selected</span>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex h-9 sm:h-auto items-center px-3.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-(--admin-edge) text-[13px] sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selected)}
              className="flex h-9 sm:h-auto items-center px-4 sm:px-5 sm:py-2 rounded-lg sm:rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[13px] sm:text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
