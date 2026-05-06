'use client'

import { ChevronLeft } from 'lucide-react'

export default function SectionHeader({
  title,
  description,
  onBack,
}: {
  title: string
  description?: string
  onBack?: () => void
}) {
  return (
    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2 sticky top-0 bg-white dark:bg-zinc-900 z-10">
      {onBack && (
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      <div className="min-w-0">
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{title}</p>
        {description && <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{description}</p>}
      </div>
    </div>
  )
}
