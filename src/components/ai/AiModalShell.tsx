'use client'

import { useEffect, useState } from 'react'
import { HiXMark } from 'react-icons/hi2'
import { useModalEscape } from '@/components/useModalEscape'

/** How long the closing animation runs, in step with .dialog-out in globals. */
const EXIT_MS = 140

/**
 * Shared chrome for the AI dialogs so they read as one feature: same width,
 * same header, same escape/scroll-lock behaviour.
 *
 * Closing is held back by one animation. `open` going false starts the dialog
 * receding and the unmount happens after, so it leaves the way it arrived
 * instead of being cut. Someone who asked for reduced motion gets neither, and
 * no wait either, which is why the delay is read from the same query rather
 * than being a fixed number.
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
  // `open` is what the parent wants. `mounted` is what is on screen, which
  // lags behind it by the length of the exit. Opening is immediate, so it is
  // adjusted during render rather than in an effect, which would cost a frame
  // of an empty dialog. Closing is the one that waits.
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)
  const closing = mounted && !open

  useEffect(() => {
    if (!closing) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => setMounted(false), still ? 0 : EXIT_MS)
    return () => clearTimeout(t)
  }, [closing])

  useModalEscape(onClose, open)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!mounted) return null

  // A dialog on its way out does not take clicks. Without this a second click
  // on the backdrop fires onClose again while it is already leaving.
  const request = () => { if (!closing) onClose() }

  return (
    <div
      className={`fixed inset-0 z-120 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-[2px] ${closing ? 'dialog-dim-out' : 'dialog-dim'}`}
      onMouseDown={e => { e.stopPropagation(); if (e.target === e.currentTarget) request() }}
      onClick={e => e.stopPropagation()}
    >
      {/* Sized for a desk from sm up, exactly as it was. Below that it gives
          up the padding a phone cannot spare. */}
      <div className={`w-full max-w-2xl max-h-[85dvh] sm:max-h-[88vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-(--admin-border) shadow-2xl overflow-hidden ${closing ? 'dialog-out' : 'dialog-in'}`}>
        <div className="flex items-start gap-2.5 sm:gap-3 px-3.5 sm:px-6 py-2.5 sm:py-5 border-b border-(--admin-edge) shrink-0">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[12.5px] sm:text-sm font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
            <p className="text-[10.5px] sm:text-xs text-zinc-500 leading-snug mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={request}
            className="p-1.5 -mr-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <HiXMark className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-3.5 sm:px-6 py-3 sm:py-5">{children}</div>

        {footer && (
          <div className="px-3.5 sm:px-6 py-2.5 sm:py-4 border-t border-(--admin-edge) bg-zinc-50/70 dark:bg-zinc-900/60 flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
