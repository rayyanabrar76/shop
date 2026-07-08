'use client'

import { useState } from 'react'
import {
  HiGlobe, HiCheck, HiX, HiExclamation,
  HiCheckCircle, HiClock, HiRefresh,
} from 'react-icons/hi'

interface DomainSettingsProps {
  storeId: string
  currentDomain: string | null
  domainVerified: boolean
  subdomain: string
}

export default function DomainSettings({
  storeId,
  currentDomain,
  domainVerified,
  subdomain,
}: DomainSettingsProps) {
  const [domain, setDomain] = useState(currentDomain ?? '')
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(domainVerified)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const rootDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost:3000'

  async function handleSaveAndVerify() {
    if (!domain.trim()) return
    setSaving(true); setVerifying(true); setError(''); setMessage('')

    try {
      const res = await fetch(`/api/stores/${storeId}/domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')

      setVerified(data.verified)
      setMessage(data.message)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
      setVerifying(false)
    }
  }

  async function handleRemove() {
    setSaving(true); setError('')
    try {
      await fetch(`/api/stores/${storeId}/domain`, { method: 'DELETE' })
      setDomain('')
      setVerified(false)
      setMessage('')
    } catch {
      setError('Failed to remove domain')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* Current store URL */}
      <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Current Store URL</p>
        <div className="flex items-center gap-2">
          <HiGlobe className="w-4 h-4 text-zinc-400" />
          <a
            href={`https://${subdomain}.${rootDomain}`}
            target="_blank"
            className="text-sm font-mono text-zinc-700 hover:text-black transition-colors"
          >
            {subdomain}.{rootDomain}
          </a>
        </div>
      </div>

      {/* Custom domain input */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Custom Domain</p>
          <p className="text-xs text-zinc-400 mb-3">Connect your own domain to your store</p>

          <div className="flex gap-2">
            <input
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="mystore.com"
              className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 transition-all bg-white font-mono placeholder:text-zinc-300 placeholder:font-sans"
            />
            <button
              onClick={handleSaveAndVerify}
              disabled={saving || !domain.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 shrink-0"
            >
              {verifying ? (
                <><HiRefresh className="w-3.5 h-3.5 animate-spin" /> Verifying...</>
              ) : (
                <><HiCheck className="w-3.5 h-3.5" /> Save & Verify</>
              )}
            </button>
          </div>
        </div>

        {/* Status */}
        {currentDomain && (
          <div className={`flex items-center justify-between p-3 rounded-xl border ${
            verified
              ? 'bg-emerald-50 border-emerald-100'
              : 'bg-amber-50 border-amber-100'
          }`}>
            <div className="flex items-center gap-2">
              {verified
                ? <HiCheckCircle className="w-4 h-4 text-emerald-500" />
                : <HiClock className="w-4 h-4 text-amber-500" />
              }
              <div>
                <p className={`text-xs font-bold ${verified ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {verified ? 'Domain verified ✓' : 'Pending verification'}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{currentDomain}</p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <HiX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {message && (
          <p className={`text-xs px-3 py-2 rounded-xl border ${
            verified
              ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
              : 'text-amber-700 bg-amber-50 border-amber-100'
          }`}>
            {message}
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl flex items-center gap-2">
            <HiExclamation className="w-3.5 h-3.5 shrink-0" /> {error}
          </p>
        )}
      </div>

      {/* DNS Instructions */}
      {domain && !verified && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">DNS Setup Instructions</p>
          <p className="text-xs text-zinc-500">
            Add these records in your domain registrar (GoDaddy, Namecheap, Cloudflare, etc):
          </p>

          <div className="space-y-3">
            {/* CNAME record */}
            <div className="rounded-xl bg-zinc-50 border border-zinc-200 overflow-hidden">
              <div className="grid grid-cols-3 px-3 py-2 bg-zinc-100 border-b border-zinc-200">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Type</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Name</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Value</span>
              </div>
              <div className="grid grid-cols-3 px-3 py-2.5">
                <span className="text-xs font-mono text-zinc-700">CNAME</span>
                <span className="text-xs font-mono text-zinc-700">@</span>
                <span className="text-xs font-mono text-violet-600">cname.vercel-dns.com</span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 text-center">— or if using an apex domain —</p>

            {/* A record */}
            <div className="rounded-xl bg-zinc-50 border border-zinc-200 overflow-hidden">
              <div className="grid grid-cols-3 px-3 py-2 bg-zinc-100 border-b border-zinc-200">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Type</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Name</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Value</span>
              </div>
              <div className="grid grid-cols-3 px-3 py-2.5">
                <span className="text-xs font-mono text-zinc-700">A</span>
                <span className="text-xs font-mono text-zinc-700">@</span>
                <span className="text-xs font-mono text-violet-600">76.76.21.21</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-zinc-400">
            DNS changes can take up to 48 hours to propagate. Click &quot;Save &amp; Verify&quot; again after adding the records.
          </p>
        </div>
      )}
    </div>
  )
}