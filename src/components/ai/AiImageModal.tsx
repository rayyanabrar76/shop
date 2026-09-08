'use client'

import { useEffect, useRef, useState } from 'react'
import { HiPhoto, HiSparkles, HiArrowPath, HiCheck, HiClipboard } from 'react-icons/hi2'
import AiModalShell from './AiModalShell'

const COPY = {
  product: {
    title: 'Generate a product photo',
    subtitle: 'Describe the shot you want and get an image back.',
    field: 'Describe the photo',
    placeholder: 'e.g. a matte black water bottle on a linen backdrop',
    working: 'Painting your product...',
    apply: 'Use this photo',
    note: 'Generated images are a starting point. Check them before publishing. A real photo of the actual item is still what sells best.',
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

// Everything but the padding and the text size, which the field below sets
// per breakpoint. Left in here they would collide with the phone values at
// equal specificity, and which one won would come down to the order Tailwind
// happened to emit them in.
const inputCls =
  'w-full rounded-xl border border-(--admin-field-border) px-3 outline-none focus:border-(--admin-field-border-focus) transition-colors bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600'

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
  context,
  onApply,
}: {
  open: boolean
  onClose: () => void
  storeId: string
  /** Prefills the box, usually with the product title. */
  seed?: string
  /** "icon" asks for a flat mark instead of a photograph, for favicons. */
  style?: 'product' | 'icon'
  /**
   * What is being pictured, as it stands in the form right now. The endpoint
   * knows the shop from storeId; this is the part it cannot look up, because
   * the product being described may not be saved yet.
   */
  context?: string
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
  // On a touch screen the keyboard comes up over the preview the moment the
  // dialog opens, hiding the thing you came here to look at. Keyed to the
  // pointer, so a touchscreen laptop is treated the same way.
  const [autoFocusPrompt] = useState(
    () => typeof window === 'undefined' || window.matchMedia('(hover: hover)').matches,
  )

  // Until the seller types, the product title is a sensible starting point.
  const value = touched ? description : (description || seed || '')
  const copy = COPY[style]

  // Ways to shoot this particular thing, written against the shop's own
  // catalogue. Empty until they arrive, and empty for good if they do not:
  // four suggestions that have nothing to do with the item are worse than
  // none, which is what the fixed list was.
  const [chips, setChips] = useState<string[]>([])
  const [chipsDone, setChipsDone] = useState(false)

  // Read through a ref, not a dependency. `context` is the form's live text,
  // so depending on it would send a generation request per keystroke. The
  // ideas are asked for once, when the dialog opens, against whatever had
  // been typed by then.
  const about = useRef({ seed, context })
  useEffect(() => { about.current = { seed, context } }, [seed, context])

  useEffect(() => {
    if (!open) return
    let dropped = false
    const { seed: s, context: c } = about.current
    fetch(`/api/stores/${storeId}/ai/field`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: style === 'icon' ? 'icon-ideas' : 'shot-ideas',
        label: style === 'icon' ? 'favicon ideas' : 'photo ideas',
        hint: style === 'icon'
          ? 'the little icon in a browser tab'
          : 'the main photo on a product page',
        context: c || (s ? `Product title: ${s}` : ''),
      }),
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('no ideas')))
      .then((d: { text?: string }) => {
        if (dropped) return
        const list = (d.text ?? '')
          .split('|')
          .map(t => t.trim().replace(/^[-*\d.\s]+/, '').replace(/^["']|["']$/g, '').trim())
          .filter(Boolean)
          .slice(0, 4)
        setChips(list)
        setChipsDone(true)
      })
      .catch(() => { if (!dropped) setChipsDone(true) })
    return () => { dropped = true }
  }, [open, storeId, style])

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

  // Clearing on the way out would empty the dialog while it is still on
  // screen, so the last thing you see is the image blinking off rather than
  // the dialog leaving. It is cleared on the way in instead, which is the
  // moment it actually matters, and during render rather than after it, so
  // the dialog never paints last time's result.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) { setUrl(null); setError(''); setQuotaPrompt(''); setChips([]); setChipsDone(false) }
  }

  function close() {
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
            className="flex h-9 sm:h-auto shrink-0 items-center px-2.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          {url ? (
            <>
              <button
                onClick={run}
                disabled={loading}
                className="flex h-9 sm:h-auto shrink-0 items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-(--admin-border) text-[11px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <HiArrowPath className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Try again
              </button>
              <button
                onClick={() => { onApply(url); close() }}
                className="flex h-9 sm:h-auto min-w-0 flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-black dark:bg-white text-white dark:text-black text-[11px] sm:text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                <HiCheck className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{copy.apply}</span>
              </button>
            </>
          ) : (
            <button
              onClick={run}
              disabled={!value.trim() || loading}
              className="flex h-9 sm:h-auto flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-1.5 px-4 sm:py-2 rounded-lg sm:rounded-xl bg-black dark:bg-white text-white dark:text-black text-[11px] sm:text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-40"
            >
              {loading ? <HiArrowPath className="w-3.5 h-3.5 animate-spin" /> : <HiSparkles className="w-3.5 h-3.5" />}
              {loading ? 'Generating...' : 'Generate'}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-3 sm:space-y-5">
        <div>
          <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1 sm:mb-1.5 block">
            {copy.field}
          </label>
          <textarea
            value={value}
            onChange={e => { setTouched(true); setDescription(e.target.value) }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run() }}
            rows={3}
            autoFocus={autoFocusPrompt}
            maxLength={500}
            placeholder={copy.placeholder}
            className={`${inputCls} resize-none h-16 sm:h-auto py-2 sm:py-2.5 text-[13px] sm:text-sm`}
          />
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
            {/* Three grey pills while the ideas are being written, so the box
                does not jump the moment they land. */}
            {!chipsDone && chips.length === 0 && [64, 88, 72].map(w => (
              <span
                key={w}
                style={{ width: w }}
                className="h-7 sm:h-6 rounded-md sm:rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse"
              />
            ))}
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
                className="flex h-7 sm:h-auto items-center px-2 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border border-(--admin-border) text-[10px] sm:text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:border-(--admin-field-border) hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-[11px] sm:text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {quotaPrompt && (
          <div className="rounded-xl border border-(--admin-border) bg-zinc-50 dark:bg-zinc-800/60 p-3 sm:p-3.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
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
            <p className="text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-mono wrap-break-word">
              {quotaPrompt}
            </p>
            <p className="text-[10px] text-zinc-500 mt-2">
              Paste it into Gemini, or any image tool, and upload the result through
              Choose from Library.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-(--admin-border) bg-zinc-50 dark:bg-zinc-800/50 aspect-square max-h-44 sm:max-h-80 mx-auto w-full max-w-44 sm:max-w-80 flex items-center justify-center overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 px-3 text-center text-zinc-500">
              <HiArrowPath className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              <p className="text-[10px] sm:text-[11px] font-medium">{copy.working}</p>
              <p className="text-[9.5px] sm:text-[10px]">This takes about 10 seconds</p>
            </div>
          ) : url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Generated product" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-zinc-300 dark:text-zinc-600">
              <HiPhoto className="w-5 h-5 sm:w-6 sm:h-6" />
              <p className="text-[10px] sm:text-[11px] font-medium">Your image appears here</p>
            </div>
          )}
        </div>

        <p className="hidden sm:block text-[10px] text-zinc-500 text-center">{copy.note}</p>
      </div>
    </AiModalShell>
  )
}
