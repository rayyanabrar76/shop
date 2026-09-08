'use client'

import { useState } from 'react'
import { HiSparkles, HiArrowPath } from 'react-icons/hi2'
import { inputCls, hintCls } from './field-styles'

/**
 * An image's alt text, with Gemini able to look at the actual photograph.
 *
 * Deliberately not a suggestion card you accept or dismiss. The field is
 * nearly always empty when you press the button, so an extra confirmation
 * step would be a click asking permission to fill in a blank. It writes
 * straight into the field instead, and offers Undo when it replaced
 * something you had already written.
 *
 * It reports when the model could not fetch the image, because alt text
 * written from a product title alone is a guess about what the photo shows,
 * and the merchant is the one who can see it.
 */
export default function AltTextField({
  storeId,
  imageUrl,
  title,
  value,
  onChange,
  context,
  placeholder = 'Describe this image',
  showHint = true,
}: {
  storeId: string
  /** The photo to look at. Without one the model writes from the title. */
  imageUrl: string | null
  /** The product name, for context. */
  title?: string
  value: string
  onChange: (v: string) => void
  /** Anything extra worth knowing, e.g. "one of several gallery shots". */
  context?: string
  placeholder?: string
  showHint?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previous, setPrevious] = useState<string | null>(null)
  const [blind, setBlind] = useState(false)

  async function suggest() {
    if (loading) return
    setLoading(true)
    setError('')
    setBlind(false)
    try {
      const res = await fetch(`/api/stores/${storeId}/ai/alt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, title, context }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not write that')
      setPrevious(value)
      setBlind(data.sawImage === false)
      onChange(data.text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setTimeout(() => setError(''), 4000)
    } finally {
      setLoading(false)
    }
  }

  function undo() {
    onChange(previous ?? '')
    setPrevious(null)
    setBlind(false)
  }

  return (
    <div>
      <div className="relative">
        <input
          value={value}
          onChange={e => { onChange(e.target.value); setPrevious(null) }}
          placeholder={placeholder}
          // Room for the button, so a long description does not run under it.
          className={inputCls + ' pr-28'}
        />
        <button
          type="button"
          onClick={suggest}
          disabled={loading}
          title={imageUrl ? 'Let AI look at the image and describe it' : 'Write from the product title'}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors disabled:opacity-70"
        >
          {loading
            ? <><HiArrowPath className="w-3.5 h-3.5 animate-spin" /> Looking…</>
            : <><HiSparkles className="w-3.5 h-3.5" /> Suggest</>}
        </button>
      </div>

      {error && <p className="mt-1.5 text-[11px] text-red-500">{error}</p>}

      {blind && !error && (
        <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
          Written from the title; the image could not be read. Worth checking it matches the photo.
        </p>
      )}

      {previous !== null && !error && (
        <button
          type="button"
          onClick={undo}
          className="mt-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 underline"
        >
          Undo
        </button>
      )}

      {showHint && !error && !blind && previous === null && (
        <p className={hintCls}>
          Read aloud by screen readers, and how image search understands the photo.
        </p>
      )}
    </div>
  )
}
