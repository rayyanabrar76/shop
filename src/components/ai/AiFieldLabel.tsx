'use client'

import { useState } from 'react'
import { HiSparkles, HiArrowPath } from 'react-icons/hi2'

export type AiFieldKind =
  | 'heading' | 'subheading' | 'button' | 'banner' | 'paragraph' | 'tagline'
  | 'seo-title' | 'seo-description' | 'keywords'

/**
 * A field label with a "Write with AI" button that appears on hover.
 *
 * It renders only the label row, so it drops into the editor panels without
 * changing how any of them handle their own value. The button is hidden until
 * hover, because a sparkle on every field at rest would be noise in a panel
 * this dense, but the hover target has to be the whole field, so the element
 * wrapping the label AND the input must carry `group/ai`. Every call site does.
 *
 * On a touch screen there is no hover to reveal it with, so the button sits
 * there permanently instead, as a sparkle alone with a finger-sized target.
 * That is keyed to the pointer rather than the screen width: hiding it by
 * breakpoint would still lose it on a touchscreen laptop, and would pin it
 * open on a desktop window dragged narrow.
 */
export default function AiFieldLabel({
  label,
  storeId,
  kind,
  current,
  hint,
  context,
  onWrite,
  className = '',
  labelClassName = '',
  children,
}: {
  label: string
  storeId: string
  kind: AiFieldKind
  /** The field's current value, so the model writes something different. */
  current?: string
  /** Where this text appears, for context. */
  hint?: string
  /** The item being described, when the field is about one thing. */
  context?: string
  onWrite: (text: string) => void
  className?: string
  labelClassName?: string
  /** Anything extra to sit in the label row, left of the button. */
  children?: React.ReactNode
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/ai/field`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, label, current, hint, context }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not write that')
      onWrite(data.text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setTimeout(() => setError(''), 4000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex items-center justify-between gap-2 mb-1.5 ${className}`}>
      <label className={`min-w-0 truncate ${labelClassName || 'text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400'}`}>
        {label}
      </label>
      <div className="flex items-center gap-2 min-w-0">
        {children}
        {error && <span className="text-[10px] text-red-500 truncate max-w-32">{error}</span>}
        <button
          type="button"
          onClick={run}
          disabled={loading}
          title="Write this with AI"
          // The words are the button's only name on a wide screen, and they
          // are dropped on a narrow one, so it carries its own.
          aria-label={loading ? 'Writing with AI' : 'Write with AI'}
          className="flex items-center justify-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-bold text-zinc-500 opacity-0 group-hover/ai:opacity-100 focus:opacity-100 touch:opacity-100 touch:min-h-9 touch:min-w-9 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-100 transition-all disabled:opacity-100 disabled:text-zinc-400 shrink-0"
        >
          {/* The label row is already a long uppercase title against an
              optional extra control, so on a phone the words go and the
              sparkle stands on its own. */}
          {loading
            ? <><HiArrowPath className="w-3 h-3 touch:w-4 touch:h-4 animate-spin" /> <span className="hidden sm:inline">Writing</span></>
            : <><HiSparkles className="w-3 h-3 touch:w-4 touch:h-4" /> <span className="hidden sm:inline">Write with AI</span></>}
        </button>
      </div>
    </div>
  )
}
