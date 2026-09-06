'use client'

import { useEffect, useState } from 'react'
import { HiSparkles, HiArrowPath, HiCheck } from 'react-icons/hi2'
import AiModalShell from './AiModalShell'
import SuggestionCard from './SuggestionCard'

export interface AiCategory {
  title: string
  description: string
  productIds: string[]
}

interface ProductRow {
  id: string
  title: string
  imageUrl?: string | null
}

const TONES = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'premium', label: 'Premium' },
  { value: 'playful', label: 'Playful' },
  { value: 'technical', label: 'Technical' },
]

const inputCls =
  'w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600'

/**
 * Names a category, describes it, and picks which products go in it.
 *
 * The product picks are the reason this is separate from the product writer:
 * the model only sees titles, so the seller reviews them before anything is
 * applied. Nothing touches the form until they hit Use this.
 */
export default function AiCategoryModal({
  open,
  onClose,
  storeId,
  products,
  onApply,
  onImage,
}: {
  open: boolean
  onClose: () => void
  storeId: string
  /** Used to show what the suggested ids actually are. */
  products: ProductRow[]
  onApply: (
    result: AiCategory,
    pick: { title: boolean; description: boolean; products: boolean },
  ) => void
  /** Applies a cover image generated from the suggestion. */
  onImage?: (url: string) => void
}) {
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState('friendly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AiCategory | null>(null)
  const [pick, setPick] = useState({ title: true, description: true, products: true })

  // Proactive suggestion, fetched when the modal opens.
  const [sug, setSug] = useState<{
    title: string
    description: string
    productIds: string[]
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
        body: JSON.stringify({ kind: 'category', force }),
        // Slightly past the server's own budget, so its message wins when it
        // has one and this only fires if the request itself is stuck.
        signal: AbortSignal.timeout(80_000),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not read your shop')
      setSug({
        title: data.title ?? '',
        description: data.description ?? '',
        productIds: data.productIds ?? [],
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

  // Only on the way open, so closing and reopening asks again but typing does not.
  useEffect(() => {
    if (open) loadSuggestion()
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
        body: JSON.stringify({ kind: 'category', prompt: prompt.trim(), tone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not write that')
      setResult({
        title: data.title,
        description: data.description,
        productIds: data.productIds ?? [],
      })
      setPick({ title: true, description: true, products: true })
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

  const suggested = result
    ? result.productIds
        .map(id => products.find(p => p.id === id))
        .filter((p): p is ProductRow => Boolean(p))
    : []

  const anyPicked = result && (pick.title || pick.description || pick.products)

  return (
    <AiModalShell
      open={open}
      onClose={close}
      title="Name it with AI"
      subtitle="Describe the group and get a title, a description and the products that fit."
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <HiArrowPath className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Try again
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
              {loading ? 'Thinking...' : 'Write it'}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {/* What the shop looks like it needs, before the seller types anything */}
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
              { title: sug.title, description: sug.description, productIds: sug.productIds },
              { title: true, description: true, products: true },
            )
            close()
          }}
        >
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{sug?.title}</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{sug?.description}</p>
          </div>
          {(sug?.productIds.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {sug!.productIds
                .map(id => products.find(p => p.id === id))
                .filter((p): p is ProductRow => Boolean(p))
                .map(p => (
                  <span key={p.id} className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-700/60">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt="" className="w-5 h-5 rounded object-cover" />
                      : <span className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-600" />}
                    <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200 max-w-40 truncate">{p.title}</span>
                  </span>
                ))}
            </div>
          )}
        </SuggestionCard>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5 block">
            Or describe your own
          </label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run() }}
            rows={3}
            autoFocus
            placeholder="e.g. everything chocolate, for people who want the richest thing on the menu"
            className={`${inputCls} resize-none`}
          />
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">
            It reads your product titles and suggests which ones belong.
          </p>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5 block">
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
                    : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
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
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Draft — untick anything you want to keep as it is
            </p>

            <Section label="Title" checked={pick.title} onToggle={() => setPick(p => ({ ...p, title: !p.title }))}>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{result.title}</p>
            </Section>

            <Section
              label="Description"
              checked={pick.description}
              onToggle={() => setPick(p => ({ ...p, description: !p.description }))}
            >
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{result.description}</p>
            </Section>

            <Section
              label={`Products (${suggested.length})`}
              checked={pick.products}
              onToggle={() => setPick(p => ({ ...p, products: !p.products }))}
            >
              {suggested.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Nothing in your catalogue clearly fits — pick products yourself after applying.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {suggested.map(p => (
                    <span
                      key={p.id}
                      className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800"
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-5 h-5 rounded object-cover" />
                      ) : (
                        <span className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-700" />
                      )}
                      <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200 max-w-40 truncate">
                        {p.title}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </Section>
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
          ? 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50'
          : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900 opacity-50'
      }`}
    >
      <button onClick={onToggle} className="flex items-center gap-2 mb-2 group">
        <span
          className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-colors ${
            checked
              ? 'bg-black dark:bg-white border-black dark:border-white'
              : 'border-zinc-300 dark:border-zinc-600 group-hover:border-zinc-400'
          }`}
        >
          {checked && <HiCheck className="w-3 h-3 text-white dark:text-black" />}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {label}
        </span>
      </button>
      {children}
    </div>
  )
}
