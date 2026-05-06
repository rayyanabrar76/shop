'use client'

import { Megaphone, LayoutGrid, Image as ImageIcon, Layout, Type, ChevronRight, Sparkles, Code2 } from 'lucide-react'

interface SectionsListProps {
  onSectionClick: (section: string) => void
}

export default function SectionsList({ onSectionClick }: SectionsListProps) {
  const sections = [
    { id: 'banner',   label: 'Announcement Banner', icon: Megaphone,  desc: 'Top banner with text' },
    { id: 'header',   label: 'Header',              icon: Layout,     desc: 'Logo and navigation' },
    { id: 'hero',     label: 'Hero Slides',         icon: ImageIcon,  desc: 'Welcome carousel' },
    { id: 'products', label: 'Product Grid',        icon: LayoutGrid, desc: 'Layout, shadows, cards' },
    { id: 'footer',   label: 'Footer',              icon: Type,       desc: 'Text and social links' },
  ]

  return (
    <div className="p-4 space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Page Sections</p>
      {sections.map(s => (
        <button
          key={s.id}
          onClick={() => onSectionClick(s.id)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors shrink-0">
            <s.icon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{s.label}</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{s.desc}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors shrink-0" />
        </button>
      ))}

      {/* Custom Code */}
      <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={() => onSectionClick('code')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
            <Code2 className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Custom Code</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Inject CSS, scripts & head tags</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors shrink-0" />
        </button>
      </div>

      {/* Custom Sections — special highlight */}
      <div className="mt-2">
        <button
          onClick={() => onSectionClick('custom')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-900 dark:hover:border-zinc-400 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-linear-to-brrom-violet-500 to-pink-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Custom Sections</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Add your own content blocks</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors shrink-0" />
        </button>
      </div>
    </div>
  )
}
