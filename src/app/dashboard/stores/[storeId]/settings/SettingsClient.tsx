'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Store, Globe, Trash2, Save, ArrowLeft,
  CheckCircle2, AlertCircle, ExternalLink,
  Copy, ShieldAlert, Settings, RefreshCw, Palette,
  Sun, Moon, Monitor,
} from 'lucide-react'
import {
  HiCheck, HiX, HiCheckCircle, HiClock,
  HiExclamation,
} from 'react-icons/hi'
import { useAdminTheme, type AdminThemeMode } from '@/components/dashboard/AdminThemeProvider'
import { APP_URL } from '@/lib/config'
import { normalizeSubdomainInput, slugifySubdomain, validateSubdomain } from '@/lib/subdomain'
import { CURRENCIES, formatPrice } from '@/lib/currency'

interface StoreData {
  id: string
  name: string
  subdomain: string
  currency: string
  customDomain: string | null
  domainVerified: boolean
  createdAt: Date
  theme: { primaryColor: string } | null
}

export default function SettingsClient({ store, orderCount = 0 }: { store: StoreData; orderCount?: number }) {
  const router = useRouter()
  const { mode: adminThemeMode, setMode: setAdminThemeMode } = useAdminTheme()

  const [name, setName] = useState(store.name)
  const [subdomain, setSubdomain] = useState(store.subdomain)
  const [currency, setCurrency] = useState(store.currency)
  const [activeSection, setActiveSection] = useState<'general' | 'appearance' | 'domain' | 'danger'>('general')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const [customDomain, setCustomDomain] = useState(store.customDomain ?? '')
  const [domainVerified, setDomainVerified] = useState(store.domainVerified)
  const [domainSaving, setDomainSaving] = useState(false)
  const [domainMessage, setDomainMessage] = useState('')
  const [domainError, setDomainError] = useState('')

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteInput, setShowDeleteInput] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const primary = store.theme?.primaryColor ?? '#6c47ff'
  // Built from NEXT_PUBLIC_APP_URL — this used to be hardcoded to
  // localhost:3000, so the deployed dashboard showed (and copied) a URL that
  // only worked on the developer's own machine.
  const storeUrl = `${APP_URL}/store/${store.subdomain}`
  const storeUrlDisplay = storeUrl.replace(/^https?:\/\//, '')
  const subdomainError = validateSubdomain(subdomain)

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await fetch(`/api/stores/${store.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subdomain, currency }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAndVerifyDomain() {
    if (!customDomain.trim()) return
    setDomainSaving(true); setDomainError(''); setDomainMessage('')
    try {
      const res = await fetch(`/api/stores/${store.id}/domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: customDomain.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setDomainVerified(data.verified)
      setDomainMessage(data.message)
      router.refresh()
    } catch (e: any) {
      setDomainError(e.message)
    } finally {
      setDomainSaving(false)
    }
  }

  async function handleRemoveDomain() {
    setDomainSaving(true); setDomainError('')
    try {
      await fetch(`/api/stores/${store.id}/domain`, { method: 'DELETE' })
      setCustomDomain('')
      setDomainVerified(false)
      setDomainMessage('')
      router.refresh()
    } catch {
      setDomainError('Failed to remove domain')
    } finally {
      setDomainSaving(false)
    }
  }

  async function handleDelete() {
    if (deleteConfirm !== store.name) return
    setDeleting(true); setDeleteError('')
    try {
      const res = await fetch(`/api/stores/${store.id}/settings`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete')
      window.location.href = '/dashboard'
    } catch (e: any) {
      setDeleteError(e.message)
      setDeleting(false)
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(storeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const NAV = [
    { id: 'general',    label: 'General',      icon: Settings },
    { id: 'appearance', label: 'Appearance',   icon: Palette },
    { id: 'domain',     label: 'Domain & URL', icon: Globe },
    { id: 'danger',     label: 'Danger Zone',  icon: ShieldAlert },
  ] as const

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Top bar */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/stores/${store.id}`} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200">
              <ArrowLeft size={17} />
            </Link>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: primary }}>
                <Store size={12} className="text-white" />
              </div>
              <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">{store.name}</span>
              <span className="text-zinc-400 dark:text-zinc-600 text-sm">/</span>
              <span className="text-zinc-500 dark:text-zinc-400 text-sm">Settings</span>
            </div>
          </div>
          <Link href={`/store/${store.subdomain}`} target="_blank" className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors">
            <ExternalLink size={13} /> View Store
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 flex gap-8">
        {/* Sidebar nav */}
        <aside className="w-48 shrink-0">
          <nav className="flex flex-col gap-1 sticky top-24">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all
                  ${activeSection === id
                    ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-white/60 dark:hover:bg-zinc-800/60'}
                  ${id === 'danger' && activeSection !== 'danger' ? 'text-red-500! hover:text-red-600!' : ''}`}
              >
                <Icon size={14} className={id === 'danger' && activeSection !== 'danger' ? 'text-red-400' : ''} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 space-y-6">

          {/* ── GENERAL ── */}
          {activeSection === 'general' && (
            <Card title="General Settings" description="Basic information about your store.">
              <div className="space-y-5">
                <Field label="Store Name" hint="Displayed in your header and browser tab.">
                  <input
                    className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 focus:ring-black/10 dark:focus:ring-white/10 transition-shadow bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                    value={name} onChange={e => setName(e.target.value)}
                  />
                </Field>
                <Field
                  label="Store Currency"
                  hint={
                    orderCount > 0
                      ? 'Locked — this store has orders. Existing prices are stored as plain numbers, so switching now would relabel them rather than convert them.'
                      : 'Used for every price on your storefront and for the actual charge at checkout.'
                  }
                >
                  <select
                    className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 focus:ring-black/10 dark:focus:ring-white/10 transition-shadow bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 disabled:bg-zinc-50 dark:disabled:bg-zinc-800/50 disabled:text-zinc-400 dark:disabled:text-zinc-500 disabled:cursor-not-allowed"
                    value={currency}
                    disabled={orderCount > 0}
                    onChange={e => setCurrency(e.target.value)}
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">
                    Prices will display as {formatPrice(129900, currency)}
                  </p>
                </Field>
                <Field label="Store ID" hint="Read-only. Used in API calls.">
                  <div className="flex gap-2">
                    <input readOnly className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 font-mono cursor-not-allowed" value={store.id} />
                    <button onClick={() => navigator.clipboard.writeText(store.id)} className="p-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200">
                      <Copy size={14} />
                    </button>
                  </div>
                </Field>
                <Field label="Created">
                  <input readOnly className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                    value={new Date(store.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  />
                </Field>
                <StatusLine saved={saved} error={error} />
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity" style={{ backgroundColor: primary }}>
                  <Save size={14} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </Card>
          )}

          {/* ── APPEARANCE ── */}
          {activeSection === 'appearance' && (
            <Card title="Appearance" description="Choose how the admin dashboard looks.">
              <div className="space-y-4">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Select a theme for your admin interface. This is saved to your browser and only affects you.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: 'light',  label: 'Light',          icon: Sun,     preview: { bg: '#ffffff', sidebar: '#f4f4f5', text: '#09090b' } },
                    { id: 'dark',   label: 'Dark',           icon: Moon,    preview: { bg: '#09090b', sidebar: '#18181b', text: '#fafafa' } },
                    { id: 'system', label: 'System Default', icon: Monitor, preview: { bg: 'linear-gradient(135deg,#ffffff 50%,#09090b 50%)', sidebar: '#f4f4f5', text: '#09090b' } },
                  ] as { id: AdminThemeMode; label: string; icon: any; preview: any }[]).map(opt => {
                    const Icon = opt.icon
                    const isActive = adminThemeMode === opt.id
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setAdminThemeMode(opt.id)}
                        className={`relative flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                          isActive
                            ? 'border-violet-500 bg-violet-50/40 dark:bg-violet-950/30'
                            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                      >
                        <div className="w-full h-16 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex" style={{ background: opt.preview.bg }}>
                          <div className="w-7 h-full shrink-0" style={{ backgroundColor: opt.preview.sidebar }} />
                          <div className="flex-1 p-1.5 flex flex-col gap-1">
                            <div className="h-1.5 w-8 rounded-full opacity-30" style={{ backgroundColor: opt.preview.text }} />
                            <div className="h-1.5 w-12 rounded-full opacity-20" style={{ backgroundColor: opt.preview.text }} />
                            <div className="mt-auto h-3 w-full rounded opacity-10" style={{ backgroundColor: opt.preview.text }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-600' : 'text-zinc-400 dark:text-zinc-500'}`} />
                          <span className={`text-xs font-semibold ${isActive ? 'text-violet-700 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-300'}`}>{opt.label}</span>
                        </div>
                        {isActive && (
                          <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* ── DOMAIN ── */}
          {activeSection === 'domain' && (
            <div className="space-y-5">
              <Card title="Domain & URL" description="Manage your store's public address.">
                <div className="space-y-5">
                  <Field label="Subdomain" hint="Lowercase letters, numbers, and hyphens only.">
                    <div className={`flex items-center border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-offset-1 dark:focus-within:ring-offset-zinc-900 focus-within:ring-black/10 dark:focus-within:ring-white/10 transition-shadow ${subdomainError ? 'border-red-300 dark:border-red-800' : 'border-zinc-200 dark:border-zinc-700'}`}>
                      <span className="px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 text-sm border-r border-zinc-200 dark:border-zinc-700 shrink-0">/store/</span>
                      <input
                        className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
                        value={subdomain}
                        onChange={e => setSubdomain(normalizeSubdomainInput(e.target.value))}
                        onBlur={() => setSubdomain(s => slugifySubdomain(s))}
                      />
                    </div>
                    {subdomainError && (
                      <p className="text-[11px] text-red-500 dark:text-red-400 font-medium mt-1.5">{subdomainError}</p>
                    )}
                  </Field>
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Store URL</p>
                      <p className="text-sm font-mono text-zinc-700 dark:text-zinc-200 truncate">{storeUrlDisplay}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={copyUrl} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300">
                        <Copy size={12} />{copied ? 'Copied!' : 'Copy'}
                      </button>
                      <Link href={`/store/${store.subdomain}`} target="_blank" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300">
                        <ExternalLink size={12} />Open
                      </Link>
                    </div>
                  </div>
                  <StatusLine saved={saved} error={error} />
                  <button onClick={handleSave} disabled={saving || Boolean(subdomainError)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity" style={{ backgroundColor: primary }}>
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </Card>

              <Card title="Custom Domain" description="Connect your own domain to your store.">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      value={customDomain}
                      onChange={e => setCustomDomain(e.target.value)}
                      placeholder="mystore.com"
                      className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-mono placeholder:text-zinc-300 dark:placeholder:text-zinc-600 placeholder:font-sans"
                    />
                    <button
                      onClick={handleSaveAndVerifyDomain}
                      disabled={domainSaving || !customDomain.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {domainSaving ? (
                        <><RefreshCw size={13} className="animate-spin" /> Verifying...</>
                      ) : (
                        <><HiCheck className="w-3.5 h-3.5" /> Save & Verify</>
                      )}
                    </button>
                  </div>

                  {store.customDomain && (
                    <div className={`flex items-center justify-between p-3 rounded-xl border ${domainVerified ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40'}`}>
                      <div className="flex items-center gap-2">
                        {domainVerified
                          ? <HiCheckCircle className="w-4 h-4 text-emerald-500" />
                          : <HiClock className="w-4 h-4 text-amber-500" />
                        }
                        <div>
                          <p className={`text-xs font-bold ${domainVerified ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                            {domainVerified ? 'Domain verified ✓' : 'Pending verification'}
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">{store.customDomain}</p>
                        </div>
                      </div>
                      <button onClick={handleRemoveDomain} className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all">
                        <HiX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {domainMessage && (
                    <p className={`text-xs px-3 py-2 rounded-xl border ${domainVerified ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40' : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40'}`}>
                      {domainMessage}
                    </p>
                  )}

                  {domainError && (
                    <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 px-3 py-2 rounded-xl flex items-center gap-2">
                      <HiExclamation className="w-3.5 h-3.5 shrink-0" /> {domainError}
                    </p>
                  )}

                  {customDomain && !domainVerified && (
                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">DNS Setup</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">Add these records in your domain registrar:</p>
                      <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        <div className="grid grid-cols-3 px-3 py-2 bg-zinc-100 dark:bg-zinc-700/60 border-b border-zinc-200 dark:border-zinc-700">
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Type</span>
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Name</span>
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Value</span>
                        </div>
                        <div className="grid grid-cols-3 px-3 py-2.5">
                          <span className="text-xs font-mono text-zinc-700 dark:text-zinc-200">CNAME</span>
                          <span className="text-xs font-mono text-zinc-700 dark:text-zinc-200">@</span>
                          <span className="text-xs font-mono text-violet-600 dark:text-violet-400">cname.vercel-dns.com</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">DNS changes can take up to 48 hours. Click &quot;Save &amp; Verify&quot; again after adding records.</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ── DANGER ZONE ── */}
          {activeSection === 'danger' && (
            <Card title="Danger Zone" description="Permanent actions that cannot be undone." danger>
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Delete this store</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Permanently removes the store and <strong>all</strong> associated products, orders, customers, and theme data. There is no undo.
                    </p>
                  </div>
                  {!showDeleteInput && (
                    <button onClick={() => setShowDeleteInput(true)} className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <Trash2 size={14} /> Delete Store
                    </button>
                  )}
                </div>

                {showDeleteInput && (
                  <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-5 space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-300">Confirm deletion</p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Type <span className="font-black font-mono bg-red-100 dark:bg-red-900/40 px-1 rounded">{store.name}</span> to permanently delete this store.
                      </p>
                    </div>
                    <input
                      autoFocus
                      className="w-full border border-red-300 dark:border-red-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                      placeholder={`Type "${store.name}" to confirm`}
                      value={deleteConfirm}
                      onChange={e => setDeleteConfirm(e.target.value)}
                    />
                    {deleteError && <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1"><AlertCircle size={13} /> {deleteError}</p>}
                    <div className="flex gap-2">
                      <button onClick={handleDelete} disabled={deleteConfirm !== store.name || deleting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-red-700 transition-colors">
                        <Trash2 size={13} />
                        {deleting ? 'Deleting everything...' : 'Yes, delete permanently'}
                      </button>
                      <button onClick={() => { setShowDeleteInput(false); setDeleteConfirm(''); setDeleteError('') }} disabled={deleting} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Card({ title, description, children, danger = false }: { title: string; description?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm overflow-hidden ${danger ? 'border-red-200 dark:border-red-900/50' : 'border-zinc-200 dark:border-zinc-700'}`}>
      <div className={`px-6 py-4 border-b ${danger ? 'border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20' : 'border-zinc-100 dark:border-zinc-800'}`}>
        <h2 className={`font-semibold text-sm ${danger ? 'text-red-700 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-100'}`}>{title}</h2>
        {description && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div>
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">{label}</label>
        {hint && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function StatusLine({ saved, error }: { saved: boolean; error: string }) {
  if (saved) return <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium"><CheckCircle2 size={15} /> Changes saved successfully</div>
  if (error) return <div className="flex items-center gap-2 text-red-500 text-sm font-medium"><AlertCircle size={15} /> {error}</div>
  return null
}
