'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, Search } from 'lucide-react'
import CategoryFormModal from '@/components/CategoryFormModal'

export interface PickableCategory {
  id: string
  name: string
  slug: string
}

/**
 * Multi-select for the Shop by Category section: a dropdown of checkboxes with
 * a search box and an inline "Create category" modal, so a merchant can add a
 * missing category without leaving the theme editor.
 *
 * Selection is stored as a comma-separated id list on the section; an empty
 * list means "show every category", which is what a new section does.
 */
export default function CategoryPicker({
  storeId,
  value,
  onChange,
}: {
  storeId: string
  value: string
  onChange: (next: string) => void
}) {
  const [categories, setCategories] = useState<PickableCategory[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)

  const selected = value.split(',').map(s => s.trim()).filter(Boolean)

  /** Tell the preview iframe to re-pull categories. */
  function refreshPreview() {
    document
      .querySelectorAll<HTMLIFrameElement>('iframe')
      .forEach(f => f.contentWindow?.postMessage({ type: 'categories:refresh' }, '*'))
  }

  useEffect(() => {
    fetch(`/api/stores/${storeId}/categories`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        setCategories(d?.categories ?? [])
        setLoaded(true)
        refreshPreview()
      })
      .catch(() => {})
  }, [storeId])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function toggle(id: string) {
    const next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]
    onChange(next.join(','))
  }



  const filtered = categories.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
  const liveSelected = loaded
    ? selected.filter(id => categories.some(c => c.id === id))
    : selected
  const summary =
    liveSelected.length === 0
      ? 'All categories'
      : `${liveSelected.length} selected`

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-left hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
      >
        <span className={liveSelected.length ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-500'}>
          {summary}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 min-w-0 bg-transparent text-sm outline-none text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>

          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="px-3.5 py-3 text-xs text-zinc-400">
                {categories.length === 0 ? 'No categories yet.' : 'No matches.'}
              </p>
            )}
            {filtered.map(cat => {
              const on = selected.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggle(cat.id)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      on
                        ? 'bg-zinc-900 border-zinc-900 dark:bg-zinc-100 dark:border-zinc-100'
                        : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {on && <Check className="w-3 h-3 text-white dark:text-zinc-900" />}
                  </span>
                  <span className="truncate text-zinc-700 dark:text-zinc-200">{cat.name}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => { setCreating(true); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-200"
          >
            <Plus className="w-3.5 h-3.5" /> Create category
          </button>
        </div>
      )}

      {liveSelected.length > 0 && (
        <button
          onClick={() => onChange('')}
          className="mt-1.5 text-[10px] text-zinc-400 hover:text-zinc-600 underline"
        >
          Show all categories instead
        </button>
      )}

      {creating && (
        <CategoryFormModal
          storeId={storeId}
          onClose={() => setCreating(false)}
          onCreated={created => {
            setCategories(prev => [...prev, created])
            refreshPreview()
            // Creating one from here implies wanting it selected.
            onChange([...selected, created.id].join(','))
            setCreating(false)
          }}
        />
      )}
    </div>
  )
}
