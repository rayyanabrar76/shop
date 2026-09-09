'use client'

import { useState } from 'react'
import SectionHeader from './SectionHeader'
import { ThemeState, labelCls } from '../types'
import { Plus, Trash2, GripVertical } from 'lucide-react'

interface NavLink { label: string; href: string }

interface NavMenuEditProps {
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
}

const DEFAULT_LINKS: NavLink[] = [
  { label: 'Home',    href: '/' },
  { label: 'Catalog', href: '/products' },
  { label: 'Contact', href: '/contact' },
]

const CASE_OPTIONS = [
  { value: 'normal',     label: 'Aa' },
  { value: 'uppercase',  label: 'AA' },
  { value: 'lowercase',  label: 'aa' },
  { value: 'capitalize', label: 'Ab' },
]

export default function NavMenuEdit({ theme, updateTheme, onBack }: NavMenuEditProps) {
  const links: NavLink[] = theme.navLinks?.length ? theme.navLinks : DEFAULT_LINKS
  /** The row being carried, by index. Null when nothing is moving. */
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  function setLinks(next: NavLink[]) {
    updateTheme({ navLinks: next })
  }

  /*
   * Reordering.
   *
   * There has been a grip on every row since this panel was written, and it
   * did nothing: a handle that looks draggable and is not is worse than no
   * handle, because the menu looks reorderable and quietly is not.
   *
   * The list moves as the cursor crosses a row rather than on the drop, so the
   * order under the pointer is the order you get. That also means the preview,
   * which redraws from the same array, shows the menu rearranging as you drag.
   */
  function moveTo(to: number) {
    if (dragIdx === null || dragIdx === to) return
    const next = [...links]
    const [carried] = next.splice(dragIdx, 1)
    next.splice(to, 0, carried)
    setDragIdx(to)
    setLinks(next)
  }

  function addLink() {
    setLinks([...links, { label: 'New Link', href: '/new-page' }])
  }

  function removeLink(i: number) {
    setLinks(links.filter((_, idx) => idx !== i))
  }

  function updateLink(i: number, patch: Partial<NavLink>) {
    setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  return (
    <div>
      <SectionHeader title="Navigation Menu" description="Links, typography and mobile drawer" onBack={onBack} />
      <div className="p-4 space-y-5">

        {/* Nav links */}
        <div>
          <label className={labelCls}>Nav Links</label>
          <div className="space-y-2">
            {links.map((link, i) => (
              <div
                key={i}
                // Only the handle starts a drag, or selecting text in either
                // field would pick the whole row up instead.
                draggable={dragIdx === i}
                onDragEnd={() => setDragIdx(null)}
                onDragOver={e => { e.preventDefault(); moveTo(i) }}
                onDrop={e => { e.preventDefault(); setDragIdx(null) }}
                className={`flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2 border transition-[opacity,border-color] ${
                  dragIdx === i
                    ? 'opacity-50 border-zinc-400 dark:border-zinc-500'
                    : 'border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <span
                  onPointerDown={() => setDragIdx(i)}
                  onPointerUp={() => setDragIdx(null)}
                  aria-label="Drag to reorder"
                  className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
                >
                  <GripVertical className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
                </span>
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <input
                    value={link.label}
                    onChange={e => updateLink(i, { label: e.target.value })}
                    placeholder="Label"
                    className="w-full bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 text-zinc-900 dark:text-zinc-50"
                  />
                  <input
                    value={link.href}
                    onChange={e => updateLink(i, { href: e.target.value })}
                    placeholder="/page-slug"
                    className="w-full bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:border-zinc-400 dark:focus:border-zinc-500 text-zinc-500 dark:text-zinc-400"
                  />
                </div>
                <button
                  onClick={() => removeLink(i)}
                  className="text-zinc-300 dark:text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={addLink}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Link
            </button>
          </div>
        </div>

        {/* Font size */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls}>Font Size</label>
            <span className="text-[10px] font-mono text-zinc-500">{theme.navFontSize ?? 14}px</span>
          </div>
          <input
            type="range"
            min={11} max={20} step={1}
            value={theme.navFontSize ?? 14}
            onChange={e => updateTheme({ navFontSize: parseInt(e.target.value) })}
            className="w-full accent-zinc-900 h-1.5 rounded-full cursor-pointer"
          />
        </div>

        {/* Text case */}
        <div>
          <label className={labelCls}>Text Case</label>
          <div className="flex gap-1.5">
            {CASE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => updateTheme({ navCase: opt.value })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  (theme.navCase ?? 'normal') === opt.value
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                    : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dividers */}
        <div className="flex items-center justify-between">
          <label className={labelCls + ' mb-0'}>Show Dividers</label>
          <button
            onClick={() => updateTheme({ navDividers: !theme.navDividers })}
            className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${theme.navDividers ? 'bg-zinc-900' : 'bg-zinc-200 dark:bg-zinc-700'}`}
          >
            <span
              className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
              style={{ transform: theme.navDividers ? 'translateX(16px)' : 'translateX(0)' }}
            />
          </button>
        </div>

      </div>
    </div>
  )
}
