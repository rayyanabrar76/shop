'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store, ArrowRight, Globe, Check, Loader2 } from 'lucide-react'
import { APP_DOMAIN } from '@/lib/config'
import { normalizeSubdomainInput, slugifySubdomain, validateSubdomain } from '@/lib/subdomain'

export const metadata = { title: 'Create a store · Shopflow' }

/** Result of the last completed availability check, tagged with what was checked. */
type CheckResult = { value: string; error: string | null }

export default function CreateStorePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checked, setChecked] = useState<CheckResult | null>(null)

  // Once the user edits the subdomain themselves, stop overwriting it from the
  // store name. (The old version compared the field against a slug of the
  // previous name, which stopped matching as soon as the name contained a
  // space — "The Donuts Factory" got stuck on "the".)
  const subdomainTouched = useRef(false)

  function handleNameChange(val: string) {
    setName(val)
    if (!subdomainTouched.current) setSubdomain(slugifySubdomain(val))
  }

  function handleSubdomainChange(val: string) {
    subdomainTouched.current = true
    setSubdomain(normalizeSubdomainInput(val))
  }

  const formatError = subdomain ? validateSubdomain(subdomain) : null

  // Debounced availability check. Only the async result is written to state —
  // "checking" is derived below from the result not yet matching the input.
  useEffect(() => {
    if (!subdomain || formatError) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stores/check-subdomain?value=${encodeURIComponent(subdomain)}`, {
          signal: controller.signal,
        })
        const data = await res.json()
        setChecked({
          value: subdomain,
          error: data.available ? null : (data.error || 'That subdomain is unavailable.'),
        })
      } catch {
        // Aborted (the user kept typing) or offline — leave it unverified; the
        // server re-checks on submit either way.
      }
    }, 400)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [subdomain, formatError])

  const result = checked?.value === subdomain ? checked : null
  const checking = Boolean(subdomain) && !formatError && !result
  const takenError = result?.error ?? null

  async function onCreate() {
    const cleaned = slugifySubdomain(subdomain)
    setSubdomain(cleaned)

    const invalid = validateSubdomain(cleaned)
    if (invalid) { setError(invalid); return }
    if (!name.trim()) { setError('Store name is required.'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), subdomain: cleaned }),
      })

      // The server can fail before it produces JSON (e.g. a 500 HTML page), so
      // parse defensively instead of letting res.json() throw away the status.
      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.id) {
        setError(data?.error || `Failed to create store (${res.status})`)
        setLoading(false)
        return
      }
      router.push(`/dashboard/stores/${data.id}`)
      router.refresh()
    } catch {
      setError('Network error, please check your connection and try again.')
      setLoading(false)
    }
  }

  const isValid = name.trim().length > 0 && !validateSubdomain(subdomain) && !takenError
  const hint = formatError ?? takenError

  return (
    <div className="min-h-full bg-(--admin-page) flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Store className="w-7 h-7 text-white dark:text-zinc-900" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Create your store</h1>
          <p className="text-sm text-zinc-500 mt-1.5">Set up your online store in seconds</p>
        </div>

        <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) shadow-sm p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 block">Store Name</label>
            <input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && isValid && !loading) onCreate() }}
              placeholder="My Awesome Store"
              maxLength={100}
              className="w-full rounded-xl border border-(--admin-field-border) px-4 py-3 text-sm outline-none focus:border-(--admin-field-border-focus) transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 block">Subdomain</label>
            <div className={`flex items-center rounded-xl border transition-all bg-white dark:bg-zinc-800 overflow-hidden ${
              hint
                ? 'border-red-300 dark:border-red-800'
                : 'border-(--admin-border) focus-within:border-(--admin-field-border-focus)'
            }`}>
              <div className="flex items-center gap-1.5 pl-3 pr-2 shrink-0">
                <Globe className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
              </div>
              <input
                value={subdomain}
                onChange={e => handleSubdomainChange(e.target.value)}
                onBlur={() => setSubdomain(s => slugifySubdomain(s))}
                onKeyDown={e => { if (e.key === 'Enter' && isValid && !loading) onCreate() }}
                placeholder="my-store"
                className="flex-1 min-w-0 py-3 text-sm outline-none bg-transparent text-zinc-900 dark:text-zinc-50 font-medium placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
              />
              <span className="pr-3 pl-1 text-sm text-zinc-500 shrink-0 select-none">.{APP_DOMAIN}</span>
              {checking && (
                <Loader2 className="w-3.5 h-3.5 mr-3 shrink-0 animate-spin text-zinc-300 dark:text-zinc-600" />
              )}
              {result && !result.error && (
                <Check className="w-4 h-4 mr-3 shrink-0 text-emerald-500" />
              )}
            </div>
            {hint ? (
              <p className="text-[11px] text-red-500 dark:text-red-400 font-medium pt-0.5">{hint}</p>
            ) : (
              <p className="text-[11px] text-zinc-500 pt-0.5">
                Lowercase letters, numbers and hyphens. This is your store&apos;s web address.
              </p>
            )}
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={onCreate}
            disabled={!isValid || loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
                Creating store…
              </span>
            ) : (
              <>Create Store <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        <p className="text-center text-[11px] text-zinc-500 mt-5">
          You can change your store name and settings anytime.
        </p>
      </div>
    </div>
  )
}
