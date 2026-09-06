'use client'

import { useEffect, useState } from 'react'
import { HiSparkles, HiArrowPath, HiPhoto, HiCheck, HiLightBulb } from 'react-icons/hi2'

/**
 * The proactive suggestion shown at the top of the AI modals.
 *
 * The photo is not generated as the suggestion arrives — that is slow and costs
 * money for something the seller may not want. It is generated when they accept
 * the suggestion, so "Use this suggestion" applies the whole thing. "Preview it
 * first" is there for anyone who wants to see the photo, or edit the prompt,
 * before committing.
 */
export default function SuggestionCard({
  storeId,
  loading,
  error,
  reason,
  title,
  empty,
  imagePrompt,
  onRetry,
  onUse,
  onImage,
  children,
}: {
  storeId: string
  loading: boolean
  error: string
  /** One line on why this was suggested. */
  reason: string
  title: string
  /** Nothing worth suggesting — `reason` explains why. */
  empty: boolean
  imagePrompt: string
  onRetry: () => void
  onUse: () => void
  /** Called with the generated image URL. Omit to hide the image control. */
  onImage?: (url: string) => void
  /** The body: what was suggested, rendered by the caller. */
  children?: React.ReactNode
}) {
  const [prompt, setPrompt] = useState(imagePrompt)
  const [editing, setEditing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [applying, setApplying] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState('')

  // The model behind this is often slow, so after a few seconds say so rather
  // than leaving a spinner that looks stuck.
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (!loading) { setSlow(false); return }
    const id = setTimeout(() => setSlow(true), 6000)
    return () => clearTimeout(id)
  }, [loading])

  // The prompt arrives with the suggestion, which lands after first render.
  const effectivePrompt = editing ? prompt : (prompt || imagePrompt)

  async function generate(): Promise<string | null> {
    const text = effectivePrompt.trim()
    if (!text || generating) return null
    setGenerating(true)
    setImageError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/ai/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not generate that image')
      setImageUrl(data.url)
      onImage?.(data.url)
      return data.url as string
    } catch (e) {
      setImageError(e instanceof Error ? e.message : 'Something went wrong')
      return null
    } finally {
      setGenerating(false)
    }
  }

  /**
   * Applying the suggestion takes the photo with it. Generating separately
   * first is optional — this covers it — but a failed generation must not
   * block the words, so the rest is applied either way.
   */
  async function useAll() {
    if (applying) return
    setApplying(true)
    try {
      if (onImage && imagePrompt && !imageUrl) await generate()
      onUse()
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/40 p-4 flex items-center gap-3">
        <HiArrowPath className="w-4 h-4 animate-spin text-zinc-400 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Reading your shop...</p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            {slow
              ? 'Taking longer than usual — the model is busy. You can start typing below instead.'
              : 'Working out what would help most.'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/40 p-3.5 flex items-center justify-between gap-3">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 min-w-0">{error}</p>
        <button
          onClick={onRetry}
          className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white shrink-0"
        >
          Try again
        </button>
      </div>
    )
  }

  if (empty) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/40 p-3.5 flex items-start gap-2.5">
        <HiCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{reason}</p>
      </div>
    )
  }

  if (!title) return null

  return (
    <div className="rounded-xl border border-zinc-900/15 dark:border-white/15 bg-white dark:bg-zinc-800/60 overflow-hidden">
      <div className="flex items-start gap-2.5 px-4 pt-3.5 pb-2">
        <span className="w-6 h-6 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0">
          <HiLightBulb className="w-3.5 h-3.5 text-white dark:text-black" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Suggested for your shop
          </p>
          {reason && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{reason}</p>
          )}
        </div>
        <button
          onClick={onRetry}
          title="Suggest something else"
          className="p-1.5 -mr-1 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shrink-0"
        >
          <HiArrowPath className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 pb-3 space-y-3">
        {children}

        {/* Cover / product photo */}
        {imagePrompt && (
          <div className="rounded-lg border border-zinc-100 dark:border-zinc-700 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Suggested photo
              </p>
              {!editing && (
                <button
                  onClick={() => { setPrompt(effectivePrompt); setEditing(true) }}
                  className="text-[10px] font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  Edit prompt
                </button>
              )}
            </div>

            {editing ? (
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-2.5 py-2 text-[11px] outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 resize-none leading-relaxed"
              />
            ) : (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed italic">
                &ldquo;{effectivePrompt}&rdquo;
              </p>
            )}

            {imageUrl ? (
              <div className="mt-2.5 flex items-center gap-2.5">
                <img src={imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700" />
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <HiCheck className="w-3.5 h-3.5" /> Added — it saves when you apply
                </p>
              </div>
            ) : (
              <button
                onClick={generate}
                disabled={generating || applying || !effectivePrompt.trim()}
                className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                {generating
                  ? <><HiArrowPath className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                  : <><HiPhoto className="w-3.5 h-3.5" /> Preview it first</>}
              </button>
            )}

            {imageError && <p className="text-[10px] text-red-500 mt-1.5">{imageError}</p>}
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/40">
        <div className="flex items-center gap-2.5">
          <button
            onClick={useAll}
            disabled={applying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-[11px] font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-60"
          >
            {applying
              ? <><HiArrowPath className="w-3.5 h-3.5 animate-spin" /> Making the photo...</>
              : <><HiSparkles className="w-3.5 h-3.5" /> Use this suggestion</>}
          </button>
          {onImage && imagePrompt && !imageUrl && !applying && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Generates the photo too</span>
          )}
        </div>
      </div>
    </div>
  )
}
