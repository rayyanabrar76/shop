'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X, ChevronsUpDown, Check } from 'lucide-react'

export interface TableFilter {
  /** The chosen option's value. An empty string means every row. */
  value: string
  onChange: (next: string) => void
  /** "All" is added automatically and does not belong here. */
  options: { value: string; label: string }[]
}

/**
 * The filter row that sits at the top of a list card.
 *
 * Inside the card rather than above it, sharing its top corners, because the
 * thing being filtered is the table underneath: a floating search box above a
 * separate card reads as a search of the whole page. Shopify puts it in the
 * same place for the same reason.
 *
 * Filtering happens in the page that owns the rows, not here. These lists are
 * a few hundred rows at most and already in memory, so a round trip per
 * keystroke would be slower than the filter it was asking for.
 */
export default function TableSearch({
  value,
  onChange,
  placeholder,
  matches,
  total,
  filter,
}: {
  value: string
  onChange: (next: string) => void
  placeholder: string
  /** How many rows survive. Shown whenever anything is narrowing the list. */
  matches: number
  total: number
  /** Optional dropdown on the left, e.g. status or visibility. */
  filter?: TableFilter
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searching = value.trim().length > 0
  const narrowed = searching || Boolean(filter?.value)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const options = filter ? [{ value: '', label: 'All' }, ...filter.options] : []
  const current = options.find(o => o.value === (filter?.value ?? '')) ?? options[0]

  return (
    <div
      className="flex items-center gap-2 h-11 pl-2 pr-2"
      style={{ borderBottom: '1px solid var(--admin-edge)' }}
    >
      {filter && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex h-7 items-center gap-1 rounded-md pl-2 pr-1.5 text-[12.5px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {current?.label ?? 'All'}
            <ChevronsUpDown className="w-3 h-3 text-zinc-500" strokeWidth={2.25} />
          </button>

          {open && (
            <div
              role="listbox"
              className="absolute left-0 top-full z-50 mt-1 min-w-40 rounded-xl py-1 shadow-lg"
              style={{
                background: 'var(--admin-card)',
                border: '1px solid var(--admin-border)',
              }}
            >
              {options.map(o => {
                const on = o.value === (filter.value ?? '')
                return (
                  <button
                    key={o.value || 'all'}
                    role="option"
                    aria-selected={on}
                    onClick={() => { filter.onChange(o.value); setOpen(false) }}
                    className="flex w-full items-center gap-2 px-2.5 h-8 text-left text-[13px] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Check className={`w-3.5 h-3.5 shrink-0 ${on ? 'opacity-100' : 'opacity-0'}`} strokeWidth={2.5} />
                    {o.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {filter && <span className="h-4 w-px shrink-0" style={{ background: 'var(--admin-edge)' }} />}

      <Search className="w-4 h-4 shrink-0 text-zinc-500" strokeWidth={2.25} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape' && searching) { e.preventDefault(); onChange('') } }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="flex-1 min-w-0 bg-transparent text-[13px] outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500"
      />

      {narrowed && (
        <>
          <span className="hidden sm:inline shrink-0 text-[11px] tabular-nums text-zinc-500">
            {matches} of {total}
          </span>
          <button
            type="button"
            onClick={() => { onChange(''); filter?.onChange('') }}
            aria-label="Clear filters"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </>
      )}
    </div>
  )
}
