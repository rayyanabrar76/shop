'use client'

import { useEffect } from 'react'
import { HiXMark } from 'react-icons/hi2'
import { useModalEscape } from '@/components/useModalEscape'

/**
 * Shared chrome for the two AI dialogs so they read as one feature: same
 * width, same header, same escape/scroll-lock behaviour.
 */
export default function AiModalShell({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle: string
  icon: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  useModalEscape(onClose, open)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
      onMouseDown={e => { e.stopPropagation(); if (e.target === e.currentTarget) onClose() }}
      onClick={e => e.stopPropagation()}
    >
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-(--admin-border) shadow-2xl overflow-hidden">
        <div className="flex items-start gap-3 px-6 py-5 border-b border-(--admin-edge)">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <HiXMark className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-(--admin-edge) bg-zinc-50/70 dark:bg-zinc-900/60 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
