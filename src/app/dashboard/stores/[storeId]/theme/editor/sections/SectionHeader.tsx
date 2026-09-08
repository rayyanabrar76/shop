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
    <div className="px-4 py-3.5 border-b border-(--admin-edge) flex items-center gap-2.5 sticky top-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md z-10">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Back"
          className="-ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      <div className="min-w-0">
        <p className="text-[13px] font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-50 leading-none">
          {title}
        </p>
        {description && (
          <p className="mt-1 text-[10px] leading-tight text-zinc-500">{description}</p>
        )}
      </div>
    </div>
  )
}
