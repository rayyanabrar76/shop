'use client'

import { useEffect, useState } from 'react'
import { HiSparkles, HiArrowPath, HiCheck } from 'react-icons/hi2'
import AiModalShell from './AiModalShell'
import SuggestionCard from './SuggestionCard'

export interface AiCopy {
  title: string
  description: string
  tags: string[]
}

const TONES = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'premium', label: 'Premium' },
  { value: 'playful', label: 'Playful' },
  { value: 'technical', label: 'Technical' },
]

const inputCls =
  'w-full rounded-xl border border-(--admin-field-border) px-3 py-2.5 text-sm outline-none focus:border-(--admin-field-border-focus) transition-colors bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600'

/**
 * Writes a listing from a one-line description. The seller reviews the draft
 * and chooses which parts to keep — nothing is written into the form until
 * they apply it.
 */
export default function AiWriteModal({
  open,
  onClose,
  storeId,
  existingTitle,
  onApply,
  onImage,
}: {
  open: boolean
  onClose: () => void
  storeId: string
  existingTitle?: string
  onApply: (copy: AiCopy, pick: { title: boolean; description: boolean; tags: boolean }) => void
  /** Applies a photo generated from the suggestion. */
  onImage?: (url: string) => void
}) {
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState('friendly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AiCopy | null>(null)
  const [pick, setPick] = useState({ title: true, description: true, tags: true })

  // What the shop looks like it is missing, fetched when the modal opens.
  const [sug, setSug] = useState<{
    title: string
    description: string
    tags: string[]
    imagePrompt: string
    reason: string
    empty: boolean
  } | null>(null)
  const [sugLoading, setSugLoading] = useState(false)
  const [sugError, setSugError] = useState('')

  async function loadSuggestion(force = false) {
    setSugLoading(true)
    setSugError('')
    setSug(null)
    try {
      const res = await fetch(`/api/stores/${storeId}/ai/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'product', force }),
        // Slightly past the server's own budget, so its message wins when it
        // has one and this only fires if the request itself is stuck.
        signal: AbortSignal.timeout(80_000),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not read your shop')
      setSug({
        title: data.title ?? '',
        description: data.description ?? '',
        tags: data.tags ?? [],
        imagePrompt: data.imagePrompt ?? '',
        reason: data.reason ?? '',
        empty: Boolean(data.empty),
      })
    } catch (e) {
      setSugError(
        e instanceof Error && e.name === 'TimeoutError'
          ? 'The assistant is busy and took too long. Describe it yourself below, or try again.'
          : e instanceof Error ? e.message : 'Could not read your shop',
      )
    } finally {
      setSugLoading(false)
    }
  }

  // Only when it opens: editing an existing product should not be interrupted
  // by a proposal for a different one.
  useEffect(() => {
    if (open && !existingTitle?.trim()) loadSuggestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function run() {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/ai/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), tone, existingTitle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not write that')
      setResult({ title: data.title, description: data.description, tags: data.tags ?? [] })
      setPick({ title: true, description: true, tags: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function close() {
    setResult(null)
    setError('')
    setSug(null)
    onClose()
  }

  const anyPicked = result && (pick.title || pick.description || pick.tags)

  return (
    <AiModalShell
      open={open}
      onClose={close}
      title="Write with AI"
      subtitle="Describe what you sell and get a title, description and tags."
      icon={<HiSparkles className="w-4 h-4" />}
      footer={
        <>
          <button
            onClick={close}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          {result ? (
            <>
              <button
                onClick={run}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-(--admin-border) text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <HiArrowPath className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Rewrite
              </button>
              <button
                onClick={() => { onApply(result, pick); close() }}
                disabled={!anyPicked}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-40"
              >
                <HiCheck className="w-3.5 h-3.5" /> Use this
              </button>
            </>
          ) : (
            <button
              onClick={run}
              disabled={!prompt.trim() || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-40"
            >
              {loading ? <HiArrowPath className="w-3.5 h-3.5 animate-spin" /> : <HiSparkles className="w-3.5 h-3.5" />}
              {loading ? 'Writing...' : 'Write it'}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {/* A gap in the catalogue, proposed before the seller types anything */}
        {(sugLoading || sugError || sug) && (
          <SuggestionCard
            storeId={storeId}
            loading={sugLoading}
            error={sugError}
            reason={sug?.reason ?? ''}
            title={sug?.title ?? ''}
            empty={sug?.empty ?? false}
            imagePrompt={sug?.imagePrompt ?? ''}
            onRetry={() => loadSuggestion(true)}
            onImage={onImage}
            onUse={() => {
              if (!sug) return
              onApply(
                { title: sug.title, description: sug.description, tags: sug.tags },
                { title: true, description: true, tags: true },
              )
              close()
            }}
          >
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{sug?.title}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-3">
                {sug?.description}
              </p>
            </div>
            {(sug?.tags.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sug!.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-700/60 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </SuggestionCard>
        )}

        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">
            Or describe your own
          </label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run() }}
            rows={3}
            autoFocus
            placeholder="e.g. handmade soy candle, jasmine and cedar, 40 hour burn, poured in small batches"
            className={`${inputCls} resize-none`}
          />
          <p className="text-[10px] text-zinc-500 mt-1.5">
            Plain words are fine. Details like material, size or who it suits make the copy better.
          </p>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">
            Tone
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TONES.map(t => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  tone === t.value
                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                    : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-(--admin-border) hover:border-(--admin-field-border)'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {result && (
          <div className="space-y-3 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              Draft, untick anything you want to keep as it is
            </p>

            <Section
              label="Title"
              checked={pick.title}
              onToggle={() => setPick(p => ({ ...p, title: !p.title }))}
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{result.title}</p>
            </Section>

            <Section
              label="Description"
              checked={pick.description}
              onToggle={() => setPick(p => ({ ...p, description: !p.description }))}
            >
              <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {result.description}
              </p>
            </Section>

            {result.tags.length > 0 && (
              <Section
                label="Tags"
                checked={pick.tags}
                onToggle={() => setPick(p => ({ ...p, tags: !p.tags }))}
              >
                <div className="flex flex-wrap gap-1.5">
                  {result.tags.map(t => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </AiModalShell>
  )
}

function Section({
  label,
  checked,
  onToggle,
  children,
}: {
  label: string
  checked: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 transition-colors ${
        checked
          ? 'border-(--admin-border) bg-white dark:bg-zinc-800/50'
          : 'border-(--admin-edge) bg-zinc-50/60 dark:bg-zinc-900 opacity-50'
      }`}
    >
      <button onClick={onToggle} className="flex items-center gap-2 mb-2 group">
        <span
          className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-colors ${
            checked
              ? 'bg-black dark:bg-white border-black dark:border-white'
              : 'border-(--admin-field-border) group-hover:border-(--admin-field-border-hover)'
          }`}
        >
          {checked && <HiCheck className="w-3 h-3 text-white dark:text-black" />}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {label}
        </span>
      </button>
      {children}
    </div>
  )
}
