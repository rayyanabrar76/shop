'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronsUpDown, Search } from 'lucide-react'

export type SelectOption = {
  value: string
  label: string
  /** Optional second line, e.g. a currency's sample formatting. */
  hint?: string
}

/**
 * The admin's dropdown, in place of a native <select>.
 *
 * A native select hands its list to the operating system, which renders it
 * wherever it likes -- on Windows that is often straight over the field, in a
 * font and metric that belong to no part of this UI. It also cannot be
 * searched, so finding "Pakistan" in a list of thirty-four means scrolling.
 *
 * The menu is portalled to <body> and positioned by hand: the settings panel
 * scrolls and clips its overflow, so a menu rendered in place would be cut off
 * at the panel's edge. Being free of the panel, it can also flip above the
 * trigger when there is more room up there.
 */
export default function Select({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Select…',
  searchable,
  ariaLabel,
}: {
  value: string
  options: SelectOption[]
  onChange: (v: string) => void
  disabled?: boolean
  placeholder?: string
  /** Defaults on once the list is long enough that scanning it is work. */
  searchable?: boolean
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const withSearch = searchable ?? options.length > 12
  const current = options.find(o => o.value === value)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  }, [options, query])

  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number } | null>(null)

  function place() {
    const r = triggerRef.current?.getBoundingClientRect()
    if (!r) return
    const gap = 6
    const below = window.innerHeight - r.bottom - gap - 8
    const above = r.top - gap - 8
    // Prefer below, but flip when the space up there is genuinely better --
    // a menu that opens into 40px of screen is no menu at all.
    const flip = below < 220 && above > below
    setPos({
      left: r.left,
      width: r.width,
      maxHeight: Math.max(160, Math.min(320, flip ? above : below)),
      ...(flip ? { bottom: window.innerHeight - r.top + gap } : { top: r.bottom + gap }),
    })
  }

  // Before paint, so the menu never shows at the wrong place for a frame.
  useLayoutEffect(() => {
    if (!open) return
    place()
    // Capture phase: scrolling inside the settings panel does not bubble to
    // window, and a menu that trails behind its trigger looks broken.
    const onMove = () => place()
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shown.length])

  useEffect(() => {
    if (!open) { setQuery(''); return }
    setActive(Math.max(0, options.findIndex(o => o.value === value)))
    if (withSearch) setTimeout(() => searchRef.current?.focus(), 20)
  }, [open, options, value, withSearch])

  // Keep the highlighted row on screen while arrowing through a long list.
  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      // The menu lives outside this subtree, so it needs its own check --
      // otherwise picking an option closes the menu before the click lands.
      if (!rootRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function commit(v: string) {
    onChange(v)
    setOpen(false)
    triggerRef.current?.focus()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); return }
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) { e.preventDefault(); setOpen(true); return }
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, shown.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) commit(shown[active].value) }
  }

  return (
    <div ref={rootRef} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`w-full flex items-center justify-between gap-2 border rounded-xl px-3.5 py-2.5 text-[13px] text-left transition-[border-color,box-shadow] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50 disabled:text-zinc-400 dark:disabled:text-zinc-500 disabled:cursor-not-allowed ${
          open
            ? 'border-(--admin-field-border-focus) ring-4 ring-zinc-900/5 dark:ring-white/10'
            : 'border-(--admin-field-border) hover:border-(--admin-field-border-hover)'
        }`}
      >
        <span className={`truncate ${current ? '' : 'text-zinc-500'}`}>
          {current?.label ?? placeholder}
        </span>
        <ChevronsUpDown className="w-4 h-4 shrink-0 text-zinc-500" />
      </button>

      {open && pos && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
          className="z-200 flex flex-col overflow-hidden rounded-xl border border-(--admin-border) bg-white dark:bg-zinc-800 shadow-[0_16px_40px_-12px_rgba(9,9,11,0.35)]"
        >
          {withSearch && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-(--admin-edge) shrink-0">
              <Search className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
              <input
                ref={searchRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setActive(0) }}
                placeholder="Search…"
                className="flex-1 min-w-0 bg-transparent text-sm outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500"
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-1">
            {shown.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">No matches</p>
            ) : (
              shown.map((o, i) => {
                const selected = o.value === value
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    data-active={i === active}
                    onMouseMove={() => { if (i !== active) setActive(i) }}
                    onClick={() => commit(o.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                      i === active ? 'bg-zinc-100 dark:bg-zinc-700/60' : ''
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 shrink-0 ${selected ? 'text-zinc-900 dark:text-zinc-50' : 'text-transparent'}`} />
                    <span className="flex-1 min-w-0">
                      <span className={`block truncate ${selected ? 'font-medium' : ''} text-zinc-900 dark:text-zinc-50`}>
                        {o.label}
                      </span>
                      {o.hint && (
                        <span className="block truncate text-[11px] text-zinc-500">{o.hint}</span>
                      )}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
