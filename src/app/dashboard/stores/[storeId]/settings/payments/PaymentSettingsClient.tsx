'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  HiArrowLeft, HiCheck, HiCash, HiCreditCard,
  HiExclamation, HiCheckCircle, HiClock, HiRefresh,
} from 'react-icons/hi'

interface StorePayment {
  codEnabled: boolean
  stripeAccountId: string | null
  stripeEnabled: boolean
  taxEnabled: boolean
  taxRate: number
  taxName: string
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`shrink-0 w-10 h-6 rounded-full transition-colors relative ${on ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-300 dark:bg-zinc-600'}`}
    >
      <span
        className="absolute top-1 w-4 h-4 bg-white dark:bg-zinc-900 rounded-full shadow transition-all duration-200"
        style={{ left: on ? '1.25rem' : '0.25rem' }}
      />
    </button>
  )
}

export default function PaymentSettingsClient({
  storeId,
  initial,
}: {
  storeId: string
  initial: StorePayment | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [codEnabled, setCodEnabled] = useState(initial?.codEnabled ?? false)
  const [stripeEnabled, setStripeEnabled] = useState(initial?.stripeEnabled ?? false)
  const [stripeAccountId] = useState(initial?.stripeAccountId ?? null)
  const [taxEnabled, setTaxEnabled] = useState(initial?.taxEnabled ?? false)
  const [taxRate, setTaxRate] = useState(String(initial?.taxRate ?? 0))
  const [taxName, setTaxName] = useState(initial?.taxName ?? 'Tax')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    const stripe = searchParams.get('stripe')
    if (stripe === 'success') {
      setStripeEnabled(true)
      router.replace(`/dashboard/stores/${storeId}/settings/payments`)
    } else if (stripe === 'pending') {
      setError('Stripe setup incomplete — please finish onboarding.')
      router.replace(`/dashboard/stores/${storeId}/settings/payments`)
    } else if (stripe === 'error') {
      setError('Stripe connection failed. Please try again.')
      router.replace(`/dashboard/stores/${storeId}/settings/payments`)
    } else if (stripe === 'refresh') {
      handleConnectStripe()
    }
  }, [searchParams])

  async function handleSaveCOD() {
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await fetch(`/api/stores/${storeId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codEnabled, taxEnabled, taxRate: Number(taxRate), taxName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleConnectStripe() {
    setConnecting(true); setError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/stripe-connect`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to connect')
      window.location.href = data.url
    } catch (e: any) {
      setError(e.message)
      setConnecting(false)
    }
  }

  async function handleDisconnectStripe() {
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripeEnabled: false, stripeAccountId: null }),
      })
      if (!res.ok) throw new Error('Failed to disconnect')
      setStripeEnabled(false)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="p-5 pt-16 md:p-8 md:pt-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/stores/${storeId}/settings`} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200">
              <HiArrowLeft className="w-4 h-4" />
            </Link>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Payment Methods</h1>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Configure how customers can pay</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><HiCheck className="w-3.5 h-3.5" /> Saved</span>}
            {error && <span className="text-xs text-red-500 font-medium flex items-center gap-1"><HiExclamation className="w-3.5 h-3.5" /> {error}</span>}
            <button onClick={handleSaveCOD} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50">
              <HiCheck className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="space-y-4">

          {/* COD */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                  <HiCash className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Cash on Delivery</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Customer pays when the order arrives</p>
                </div>
              </div>
              <Toggle on={codEnabled} onChange={() => setCodEnabled(v => !v)} />
            </div>
            {codEnabled && (
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl px-3 py-2">
                  Orders placed with COD will appear as <strong>PENDING</strong>. Mark them as <strong>PAID</strong> once you receive the cash.
                </p>
              </div>
            )}
          </div>

          {/* Stripe Connect */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                  <HiCreditCard className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Card Payments</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Accept cards globally — powered by Stripe</p>
                </div>
              </div>

              {stripeEnabled ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full">
                  <HiCheckCircle className="w-3.5 h-3.5" /> Connected
                </span>
              ) : stripeAccountId ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-full">
                  <HiClock className="w-3.5 h-3.5" /> Pending
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                  Not connected
                </span>
              )}
            </div>

            {stripeEnabled ? (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                  <HiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    Your Stripe account is connected. Customers can pay with card.
                  </p>
                </div>
                <button onClick={handleDisconnectStripe} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
                  Disconnect Stripe account
                </button>
              </div>
            ) : stripeAccountId ? (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl px-3 py-2">
                  Your Stripe account setup is incomplete. Please finish onboarding to accept card payments.
                </p>
                <button
                  onClick={handleConnectStripe}
                  disabled={connecting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <HiRefresh className={`w-3.5 h-3.5 ${connecting ? 'animate-spin' : ''}`} />
                  {connecting ? 'Redirecting...' : 'Continue Stripe Setup'}
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Connect your account to accept card payments. No Stripe account? You can create one during setup — it only takes a few minutes.
                </p>
                <button
                  onClick={handleConnectStripe}
                  disabled={connecting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  <HiCreditCard className="w-3.5 h-3.5" />
                  {connecting ? 'Redirecting to Stripe...' : 'Connect Stripe Account'}
                </button>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  Powered by Stripe · Secure · Takes 2 minutes
                </p>
              </div>
            )}
          </div>

          {/* Tax */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <span className="text-blue-500 text-sm font-bold">%</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Tax / VAT</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Automatically calculate tax on orders</p>
                </div>
              </div>
              <Toggle on={taxEnabled} onChange={() => setTaxEnabled(v => !v)} />
            </div>
            {taxEnabled && (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5 block">Tax Name</label>
                  <input
                    value={taxName}
                    onChange={e => setTaxName(e.target.value)}
                    placeholder="Tax / VAT / GST"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5 block">Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={e => setTaxRate(e.target.value)}
                    placeholder="e.g. 8.5"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
