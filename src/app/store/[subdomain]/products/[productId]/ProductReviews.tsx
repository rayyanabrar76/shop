'use client'

import { useState } from 'react'
import { Star, CheckCircle2 } from 'lucide-react'

export interface PublicReview {
  id: string
  authorName: string
  rating: number
  title: string | null
  body: string | null
  verified: boolean
  createdAt: string
}

/** Five stars, filled to `value`. Half stars are rounded down deliberately:
    a 4.4 average shown as 4.5 stars is a small lie told at scale. */
function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i <= Math.floor(value) ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}
        />
      ))}
    </span>
  )
}

/**
 * Ratings and reviews for one product.
 *
 * The list is rendered because Google only counts an aggregateRating that a
 * visitor can actually see; markup for stars that appear nowhere on the page
 * is a structured data violation, not a shortcut to them.
 */
export default function ProductReviews({
  subdomain,
  productSlug,
  reviews,
  average,
  theme,
}: {
  subdomain: string
  productSlug: string
  reviews: PublicReview[]
  average: number
  theme: { primary: string; radius: string; textColor: string }
}) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit() {
    if (sending) return
    setError('')
    if (rating < 1) { setError('Choose a rating.'); return }
    if (!name.trim()) { setError('Please add your name.'); return }
    setSending(true)
    try {
      const res = await fetch(
        `/api/storefront/${subdomain}/products/${productSlug}/reviews`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorName: name, authorEmail: email, rating, title, body }),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send that')
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  const inputCls =
    'w-full border border-zinc-300 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-zinc-900 placeholder:text-zinc-400'

  return (
    <section className="mt-20" id="reviews">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-4 w-1 rounded-full" style={{ backgroundColor: theme.primary }} />
        <h2 className="text-lg font-bold">Reviews</h2>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        {reviews.length > 0 ? (
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold tabular-nums">{average.toFixed(1)}</span>
            <div>
              <Stars value={average} size={16} />
              <p className="text-xs text-zinc-500 mt-0.5">
                {reviews.length} review{reviews.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No reviews yet. Be the first.</p>
        )}

        {!open && !done && (
          <button
            onClick={() => setOpen(true)}
            className="px-5 py-2.5 text-sm font-semibold border border-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors"
            style={{ borderRadius: theme.radius }}
          >
            Write a review
          </button>
        )}
      </div>

      {done && (
        <div
          className="mb-8 p-4 border border-zinc-200 bg-zinc-50 text-sm"
          style={{ borderRadius: theme.radius }}
        >
          <p className="font-semibold">Thank you.</p>
          <p className="text-zinc-600 mt-0.5">
            Your review has been sent to the shop and will appear here once it is approved.
          </p>
        </div>
      )}

      {open && !done && (
        <div
          className="mb-10 p-5 border border-zinc-200 space-y-4"
          style={{ borderRadius: theme.radius }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Your rating</p>
            <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHovered(i)}
                  aria-label={`${i} star${i === 1 ? '' : 's'}`}
                  className="p-0.5"
                >
                  <Star
                    width={24}
                    height={24}
                    className={i <= (hovered || rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className={inputCls}
              style={{ borderRadius: theme.radius }}
            />
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              placeholder="Email (not shown publicly)"
              className={inputCls}
              style={{ borderRadius: theme.radius }}
            />
          </div>

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Sum it up in a line (optional)"
            className={inputCls}
            style={{ borderRadius: theme.radius }}
          />

          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={4}
            placeholder="What did you think?"
            className={`${inputCls} resize-none`}
            style={{ borderRadius: theme.radius }}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              onClick={submit}
              disabled={sending}
              className="px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: theme.primary, borderRadius: theme.radius }}
            >
              {sending ? 'Sending…' : 'Submit review'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-zinc-400">
            Your email is only used to check you bought this, and is never shown.
          </p>
        </div>
      )}

      {reviews.length > 0 && (
        <ul className="space-y-6">
          {reviews.map(r => (
            <li key={r.id} className="border-t border-zinc-100 pt-6 first:border-0 first:pt-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5">
                <Stars value={r.rating} />
                <span className="text-sm font-semibold">{r.authorName}</span>
                {r.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" /> Verified purchase
                  </span>
                )}
                <span className="text-xs text-zinc-400">
                  {new Date(r.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
              </div>
              {r.title && <p className="text-sm font-semibold mb-1">{r.title}</p>}
              {r.body && <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
