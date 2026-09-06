'use client'

import { useState } from 'react'
import { HiPhoto, HiSparkles, HiArrowPath, HiCheck, HiClipboard } from 'react-icons/hi2'
import AiModalShell from './AiModalShell'

const SUGGESTIONS = [
  'on a linen backdrop, soft daylight',
  'on a marble surface with a single shadow',
  'floating on a plain warm-grey background',
  'held in hand, blurred cafe behind',
]

/** Icon prompts want a subject and a colour, not a set and lighting. */
const ICON_SUGGESTIONS = [
  'in one bold colour on a cream circle',
  'as a simple outline on a dark square',
  'monogram of the first letter',
  'flat two-colour badge',
]

const COPY = {
  product: {
    title: 'Generate a product photo',
    subtitle: 'Describe the shot you want and get an image back.',
    field: 'Describe the photo',
    placeholder: 'e.g. a matte black water bottle on a linen backdrop',
    working: 'Painting your product...',
    apply: 'Use this photo',
    note: 'Generated images are a starting point. Check them before publishing — a real photo of the actual item is still what sells best.',
  },
  icon: {
    title: 'Generate a favicon',
    subtitle: 'Describe a simple mark that reads at the size of a browser tab.',
    field: 'Describe the icon',
    placeholder: 'e.g. a single donut with pink glaze',
    working: 'Drawing your icon...',
    apply: 'Use this icon',
    note: 'Keep it to one bold shape. Anything detailed turns to mush at 16 pixels, which is the size this is actually seen at.',
  },
}

const inputCls =
  'w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600'

/**
 * Generates an image and stores it in the shop's media library, so applying it
 * only has to hand back a URL — the same kind an uploaded file would have.
 *
 * `style` changes both the prompt sent to the model and the wording here: a
 * favicon needs a flat mark, and asking for it as though it were a product shot
 * produces something unreadable at tab size.
 */
export default function AiImageModal({
  open,
  onClose,
  storeId,
  seed,
  style = 'product',
  onApply,
}: {
  open: boolean
  onClose: () => void
  storeId: string
  /** Prefills the box, usually with the product title. */
  seed?: string
  /** "icon" asks for a flat mark instead of a photograph, for favicons. */
  style?: 'product' | 'icon'
  onApply: (url: string) => void
}) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [url, setUrl] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  // Set when the account is out of generations. The written prompt still has
  // value, so it is offered rather than thrown away with the error.
  const [quotaPrompt, setQuotaPrompt] = useState('')
  const [copied, setCopied] = useState(false)

  // Until the seller types, the product title is a sensible starting point.
  const value = touched ? description : (description || seed || '')
  const copy = COPY[style]
  const chips = style === 'icon' ? ICON_SUGGESTIONS : SUGGESTIONS

  async function run() {
    const text = value.trim()
    if (!text || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/ai/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text, style }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.quota) setQuotaPrompt(data.prompt || text)
        throw new Error(data.error || 'Could not generate that image')
      }
      setQuotaPrompt('')
      setUrl(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function close() {
    setUrl(null)
    setError('')
    setQuotaPrompt('')
    onClose()
  }

  return (
    <AiModalShell
      open={open}
      onClose={close}
      title={copy.title}
      subtitle={copy.subtitle}
      icon={<HiPhoto className="w-4 h-4" />}
      footer={
        <>
          <button
            onClick={close}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          {url ? (
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
                onClick={() => { onApply(url); close() }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                <HiCheck className="w-3.5 h-3.5" /> {copy.apply}
              </button>
            </>
          ) : (
            <button
              onClick={run}
              disabled={!value.trim() || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-40"
            >
              {loading ? <HiArrowPath className="w-3.5 h-3.5 animate-spin" /> : <HiSparkles className="w-3.5 h-3.5" />}
              {loading ? 'Generating...' : 'Generate'}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5 block">
            {copy.field}
          </label>
          <textarea
            value={value}
            onChange={e => { setTouched(true); setDescription(e.target.value) }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run() }}
            rows={3}
            autoFocus
            maxLength={500}
            placeholder={copy.placeholder}
            className={`${inputCls} resize-none`}
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {chips.map(s => (
              <button
                key={s}
                onClick={() => {
                  setTouched(true)
                  setDescription(v => {
                    const base = (touched ? v : v || seed || '').trim()
                    return base ? `${base}, ${s}` : s
                  })
                }}
                className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {quotaPrompt && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Use this prompt elsewhere
              </p>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(quotaPrompt)
                    .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
                    .catch(() => {})
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
              >
                {copied
                  ? <><HiCheck className="w-3 h-3" /> Copied</>
                  : <><HiClipboard className="w-3 h-3" /> Copy</>}
              </button>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-mono break-words">
              {quotaPrompt}
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">
              Paste it into Gemini, or any image tool, and upload the result through
              Choose from Library.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 aspect-square max-h-80 mx-auto w-full max-w-80 flex items-center justify-center overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-500">
              <HiArrowPath className="w-5 h-5 animate-spin" />
              <p className="text-[11px] font-medium">{copy.working}</p>
              <p className="text-[10px]">This takes about 10 seconds</p>
            </div>
          ) : url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Generated product" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-600">
              <HiPhoto className="w-6 h-6" />
              <p className="text-[11px] font-medium">Your image appears here</p>
            </div>
          )}
        </div>

        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center">{copy.note}</p>
      </div>
    </AiModalShell>
  )
}
