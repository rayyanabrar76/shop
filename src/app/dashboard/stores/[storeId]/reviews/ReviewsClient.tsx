'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, Check, EyeOff, Trash2, CheckCircle2, MessageSquare, Reply, Send } from 'lucide-react'
import PageHeader from '@/components/dashboard/PageHeader'
import { inputCls } from '@/components/dashboard/field-styles'

type Status = 'PENDING' | 'PUBLISHED' | 'HIDDEN'

export interface AdminReview {
  id: string
  authorName: string
  authorEmail: string | null
  rating: number
  title: string | null
  body: string | null
  status: Status
  /** The shop's public answer, rendered under the review on the storefront. */
  reply: string | null
  verified: boolean
  createdAt: string
  product: { id: string; title: string; imageUrl: string | null }
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 shrink-0" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= value ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`}
        />
      ))}
    </span>
  )
}

const TABS: { id: Status; label: string }[] = [
  { id: 'PENDING', label: 'Pending' },
  { id: 'PUBLISHED', label: 'Published' },
  { id: 'HIDDEN', label: 'Hidden' },
]

/**
 * Review moderation.
 *
 * Pending is the landing tab because it is the only one with work in it: a
 * review sitting unapproved is a rating the shop has earned and is not being
 * credited for in search results.
 */
export default function ReviewsClient({
  storeId,
  reviews: initial,
}: {
  storeId: string
  reviews: AdminReview[]
}) {
  const [reviews, setReviews] = useState(initial)
  const [tab, setTab] = useState<Status>(
    initial.some(r => r.status === 'PENDING') ? 'PENDING' : 'PUBLISHED',
  )
  const [busy, setBusy] = useState<string | null>(null)
  /** Which review's reply box is open, and what is in it. */
  const [replying, setReplying] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [asking, setAsking] = useState(false)
  const [asked, setAsked] = useState<string | null>(null)

  const shown = reviews.filter(r => r.status === tab)
  const counts = {
    PENDING: reviews.filter(r => r.status === 'PENDING').length,
    PUBLISHED: reviews.filter(r => r.status === 'PUBLISHED').length,
    HIDDEN: reviews.filter(r => r.status === 'HIDDEN').length,
  }

  const published = reviews.filter(r => r.status === 'PUBLISHED')
  const average = published.length
    ? published.reduce((s, r) => s + r.rating, 0) / published.length
    : 0

  async function setStatus(id: string, status: Status) {
    setBusy(id)
    try {
      const res = await fetch(`/api/stores/${storeId}/reviews`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) setReviews(rs => rs.map(r => (r.id === id ? { ...r, status } : r)))
    } finally {
      setBusy(null)
    }
  }

  async function saveReply(id: string) {
    setBusy(id)
    try {
      const res = await fetch(`/api/stores/${storeId}/reviews`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reply: draft }),
      })
      if (res.ok) {
        const reply = draft.trim() || null
        setReviews(rs => rs.map(r => (r.id === id ? { ...r, reply } : r)))
        setReplying(null)
        setDraft('')
      }
    } finally {
      setBusy(null)
    }
  }

  /**
   * Asks recent buyers what they thought, now rather than on tomorrow's run.
   *
   * The same job the daily schedule runs, so an order already asked is not
   * asked twice however many times this is pressed.
   */
  async function askForReviews() {
    setAsking(true)
    setAsked(null)
    try {
      const res = await fetch(`/api/stores/${storeId}/reviews/request`, { method: 'POST' })
      const data = await res.json()
      setAsked(res.ok
        ? data.sent > 0
          ? `Asked ${data.sent} customer${data.sent === 1 ? '' : 's'}.`
          : 'Nobody new to ask right now.'
        : data.error ?? 'Could not send those')
    } catch {
      setAsked('Could not send those')
    } finally {
      setAsking(false)
    }
  }

  async function remove(id: string) {
    setBusy(id)
    try {
      const res = await fetch(`/api/stores/${storeId}/reviews?id=${id}`, { method: 'DELETE' })
      if (res.ok) setReviews(rs => rs.filter(r => r.id !== id))
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader
        storeId={storeId}
        icon={<MessageSquare className="w-5 h-5" />}
        title="Reviews"
        count={reviews.length}
        meta={published.length ? `${average.toFixed(1)} average from ${published.length} published` : undefined}
        action={
          <div className="flex items-center gap-2">
            {asked && <span className="text-[11.5px] text-zinc-500">{asked}</span>}
            <button
              onClick={askForReviews}
              disabled={asking}
              title="Email recent buyers and ask them to review what they bought"
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-(--admin-border) bg-(--admin-card) px-3 text-[11.5px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {asking ? 'Sending…' : 'Ask for reviews'}
            </button>
          </div>
        }
      />

      <div className="max-w-6xl px-6 pb-10">
        <div className="flex items-center gap-1.5 mb-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex h-7 items-center gap-1.5 rounded-full pl-3 pr-2.5 text-[12px] font-medium transition-colors ${
                tab === t.id
                  ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900'
                  : 'bg-(--admin-card) border border-(--admin-border) text-zinc-600 dark:text-zinc-300 hover:border-(--admin-field-border)'
              }`}
            >
              {t.label}
              <span className={`text-[11px] tabular-nums ${tab === t.id ? 'opacity-70' : 'text-zinc-500'}`}>
                {counts[t.id]}
              </span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="bg-(--admin-card) border border-(--admin-border) rounded-2xl py-16 flex flex-col items-center text-center">
            <div className="w-11 h-11 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-3">
              <Star className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
            </div>
            <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
              {tab === 'PENDING' ? 'Nothing waiting' : tab === 'PUBLISHED' ? 'No published reviews yet' : 'Nothing hidden'}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-64">
              {tab === 'PUBLISHED'
                ? 'Published reviews show on the product page and give you stars in Google results.'
                : 'Reviews left on your storefront arrive here first.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {shown.map(r => (
              <div
                key={r.id}
                className="bg-(--admin-card) border border-(--admin-border) rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  <Link
                    href={`/dashboard/stores/${storeId}/products/${r.product.id}`}
                    className="w-10 h-10 shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-200/70 dark:ring-zinc-700/70"
                  >
                    {r.product.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.product.imageUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <Stars value={r.rating} />
                      <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-50">{r.authorName}</span>
                      {r.verified && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Verified purchase
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-500">
                        {new Date(r.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/stores/${storeId}/products/${r.product.id}`}
                      className="block text-[11px] text-zinc-500 truncate mt-0.5 hover:underline"
                    >
                      {r.product.title}
                    </Link>

                    {r.title && (
                      <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-50 mt-2">{r.title}</p>
                    )}
                    {r.body && (
                      <p className="text-[13px] text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed whitespace-pre-line">
                        {r.body}
                      </p>
                    )}

                    {/* Answering in public is how a shop turns a bad review
                        into something a reader trusts. Shown indented under
                        the review it answers, the way it renders on the
                        storefront, so what is written here is what is seen. */}
                    {replying === r.id ? (
                      <div className="mt-3">
                        <textarea
                          value={draft}
                          onChange={e => setDraft(e.target.value)}
                          rows={3}
                          autoFocus
                          maxLength={1000}
                          placeholder="Thanks for letting us know…"
                          className={`${inputCls} resize-none`}
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => saveReply(r.id)}
                            disabled={busy === r.id}
                            className="flex h-8 items-center rounded-lg bg-zinc-900 dark:bg-zinc-50 px-3 text-[11px] font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors disabled:opacity-50"
                          >
                            {busy === r.id ? 'Saving…' : r.reply ? 'Update reply' : 'Post reply'}
                          </button>
                          <button
                            onClick={() => { setReplying(null); setDraft('') }}
                            className="h-8 px-2 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          >
                            Cancel
                          </button>
                          {r.reply && (
                            <button
                              onClick={() => { setDraft(''); saveReply(r.id) }}
                              className="h-8 px-2 text-[11px] font-semibold text-zinc-500 hover:text-red-600 transition-colors ml-auto"
                            >
                              Remove reply
                            </button>
                          )}
                        </div>
                      </div>
                    ) : r.reply ? (
                      <div className="mt-3 ml-1 pl-3 border-l-2 border-(--admin-field-border)">
                        <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-50">Your reply</p>
                        <p className="text-[13px] text-zinc-600 dark:text-zinc-300 mt-0.5 leading-relaxed whitespace-pre-line">{r.reply}</p>
                        <button
                          onClick={() => { setReplying(r.id); setDraft(r.reply ?? '') }}
                          className="mt-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setReplying(r.id); setDraft('') }}
                        className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      >
                        <Reply className="w-3.5 h-3.5" /> Reply publicly
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {r.status !== 'PUBLISHED' && (
                      <button
                        onClick={() => setStatus(r.id, 'PUBLISHED')}
                        disabled={busy === r.id}
                        title="Publish on the product page"
                        className="flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-3 text-[11px] font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Publish
                      </button>
                    )}
                    {r.status !== 'HIDDEN' && (
                      <button
                        onClick={() => setStatus(r.id, 'HIDDEN')}
                        disabled={busy === r.id}
                        title="Hide from the product page"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-(--admin-border) text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors disabled:opacity-50"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => remove(r.id)}
                      disabled={busy === r.id}
                      title="Delete permanently"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-(--admin-border) text-zinc-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
