'use client'

import { useState } from 'react'
import {
  Megaphone, LayoutGrid, Image as ImageIcon, Layout, Type,
  ChevronRight, Code2, Search, Plus, Rows3, GripVertical,
} from 'lucide-react'
import { isCustomKey, customIdFromKey } from '@/lib/section-order'

interface CustomSectionRow {
  id: string
  name: string
  layout: string
}

interface SectionsListProps {
  onSectionClick: (section: string) => void
  /** Opens the custom-sections panel focused on one section. */
  onCustomSectionClick: (id: string) => void
  /** Opens the "add a section" picker. */
  onAddSection: () => void
  customSections: CustomSectionRow[]
  /** Resolved order of the movable sections, as section-order keys. */
  order: string[]
  onReorder: (keys: string[]) => void
  /** Fires while a row is being dragged, so the preview can pull back and show
      the whole page instead of the slice that happens to be scrolled to. */
  onDragChange?: (dragging: boolean) => void
}

/**
 * The page outline, grouped the way a theme actually stacks: what is above the
 * page, the page itself, and what is below it. Custom sections are listed by
 * name inside Template rather than hidden behind one "Custom Sections" entry —
 * a section you added is a section, and should read like the built-in ones.
 *
 * Only Template is reorderable. The announcement bar and header are always
 * above the page and the footer always below, and the header's sticky and
 * transparent modes both assume it is at the top.
 */
export default function SectionsList({
  onSectionClick,
  onCustomSectionClick,
  onAddSection,
  customSections,
  order,
  onReorder,
  onDragChange,
}: SectionsListProps) {
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)

  function handleDrop(target: string) {
    if (!dragKey || dragKey === target) { setDragKey(null); setOverKey(null); return }
    const next = order.filter(k => k !== dragKey)
    const at = next.indexOf(target)
    next.splice(at < 0 ? next.length : at, 0, dragKey)
    onReorder(next)
    setDragKey(null)
    setOverKey(null)
  }

  /** What each key in the order actually renders as. */
  function rowFor(key: string) {
    if (key === 'hero') return { icon: ImageIcon, label: 'Hero Slides', open: () => onSectionClick('hero') }
    if (key === 'products') return { icon: LayoutGrid, label: 'Product Grid', open: () => onSectionClick('products') }
    if (!isCustomKey(key)) return null
    const id = customIdFromKey(key)
    const cs = customSections.find(c => c.id === id)
    if (!cs) return null
    return { icon: Rows3, label: cs.name || 'Untitled section', open: () => onCustomSectionClick(id) }
  }

  return (
    <div className="py-2">
      <Row icon={Search} label="SEO & Favicon" onClick={() => onSectionClick('seo')} />

      <Group label="Header">
        <Row icon={Megaphone} label="Announcement Banner" onClick={() => onSectionClick('banner')} />
        <Row icon={Layout} label="Header" onClick={() => onSectionClick('header')} />
        <AddRow onClick={onAddSection} />
      </Group>

      <Group label="Template">
        {order.map(key => {
          const row = rowFor(key)
          if (!row) return null
          return (
            <Row
              key={key}
              icon={row.icon}
              label={row.label}
              onClick={row.open}
              draggable
              dragging={dragKey === key}
              dropTarget={overKey === key && dragKey !== key}
              onDragStart={() => { setDragKey(key); onDragChange?.(true) }}
              onDragEnd={() => { setDragKey(null); setOverKey(null); onDragChange?.(false) }}
              onDragOver={() => setOverKey(key)}
              onDrop={() => handleDrop(key)}
            />
          )
        })}
        <AddRow onClick={onAddSection} />
      </Group>

      <Group label="Footer">
        <Row icon={Type} label="Footer" onClick={() => onSectionClick('footer')} />
        <AddRow onClick={onAddSection} />
      </Group>

      <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1">
        <Row icon={Code2} label="Custom Code" onClick={() => onSectionClick('code')} />
      </div>
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-2 first:border-t-0 first:mt-0">
      <p className="px-4 pb-1 text-[11px] font-bold text-zinc-800 dark:text-zinc-200">{label}</p>
      {children}
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  onClick,
  draggable = false,
  dragging = false,
  dropTarget = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
  draggable?: boolean
  dragging?: boolean
  dropTarget?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
  onDragOver?: () => void
  onDrop?: () => void
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={e => { if (draggable) { e.preventDefault(); onDragOver?.() } }}
      onDrop={e => { if (draggable) { e.preventDefault(); onDrop?.() } }}
      className={`group/row flex items-center gap-1 pr-3 transition-colors ${
        dragging ? 'opacity-40' : ''
      } ${dropTarget ? 'border-t-2 border-blue-500' : 'border-t-2 border-transparent'} hover:bg-zinc-50 dark:hover:bg-zinc-800`}
    >
      {draggable ? (
        <span
          className="pl-1.5 py-2 cursor-grab active:cursor-grabbing text-zinc-300 dark:text-zinc-600 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"
          title="Drag to reorder"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </span>
      ) : (
        <span className="pl-1.5 w-5.5 shrink-0" />
      )}

      <button onClick={onClick} className="flex-1 flex items-center gap-2.5 py-2 min-w-0 text-left">
        <Icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
        <span className="flex-1 text-[13px] text-zinc-700 dark:text-zinc-200 truncate">{label}</span>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover/row:text-zinc-500 dark:group-hover/row:text-zinc-400 transition-colors shrink-0" />
      </button>
    </div>
  )
}

function AddRow({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 pl-7.5 pr-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
    >
      <Plus className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />
      <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Add section</span>
    </button>
  )
}
