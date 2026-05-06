'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store, ArrowRight, Globe } from 'lucide-react'

export default function CreateStorePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleNameChange(val: string) {
    setName(val)
    if (!subdomain || subdomain === name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')) {
      setSubdomain(val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, ''))
    }
  }

  async function onCreate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subdomain }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create store'); setLoading(false); return }
      router.push(`/dashboard/stores/${data.id}`)
    } catch {
      setError('Failed to create store')
      setLoading(false)
    }
  }

  const isValid = name.trim().length > 0 && subdomain.trim().length > 0

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Store className="w-7 h-7 text-white dark:text-zinc-900" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Create your store</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1.5">Set up your online store in seconds</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">Store Name</label>
            <input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="My Awesome Store"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">Subdomain</label>
            <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 transition-all bg-white dark:bg-zinc-800 overflow-hidden">
              <div className="flex items-center gap-1.5 pl-3 pr-2 shrink-0">
                <Globe className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
              </div>
              <input
                value={subdomain}
                onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
                placeholder="e.g. my-store"
                className="flex-1 py-3 pr-4 text-sm outline-none bg-transparent text-zinc-900 dark:text-zinc-50 font-medium placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
              />
            </div>
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

        <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 mt-5">
          You can change your store name and settings anytime.
        </p>
      </div>
    </div>
  )
}
