'use client'

import { useState } from 'react'
import { Check, ExternalLink, AlertCircle, Sparkles } from 'lucide-react'
import { PLANS, TRIAL_DAYS, type PlanId } from '@/lib/plans'

type Billing = 'monthly' | 'yearly'

interface Props {
  storeId: string
  storeName: string
  currentPlan: 'FREE' | 'BASIC' | 'PRO'
  activePlanId: 'FREE' | 'BASIC' | 'PRO'
  subscriptionStatus: string | null
  hasStripeCustomer: boolean
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function BillingClient(props: Props) {
  const [billing, setBilling] = useState<Billing>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function startSubscription(planId: PlanId) {
    setLoading(planId)
    setError('')
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: props.storeId, planId, billing }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not start checkout')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
      setLoading(null)
    }
  }

  async function openPortal() {
    setLoading('portal')
    setError('')
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: props.storeId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not open portal')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
      setLoading(null)
    }
  }

  const status = props.subscriptionStatus
  const isTrialing = status === 'trialing'
  const isActive = status === 'active' || isTrialing
  const isPastDue = status === 'past_due'
  const planDef = PLANS[props.currentPlan]
  const activeDef = PLANS[props.activePlanId]

  return (
    <div className="p-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Billing</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your ShopFlow subscription for <strong>{props.storeName}</strong>.
        </p>
      </div>

      {/* Current plan card */}
      <div className="mb-8 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Current plan</span>
              {isPastDue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold">
                  <AlertCircle className="w-3 h-3" /> Past due
                </span>
              )}
              {isTrialing && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  <Sparkles className="w-3 h-3" /> Trial
                </span>
              )}
              {props.cancelAtPeriodEnd && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                  Cancels {fmtDate(props.currentPeriodEnd)}
                </span>
              )}
            </div>
            <h2 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{planDef.name}</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Take-rate: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{activeDef.takeRatePercent}%</span> on Stripe sales
            </p>
            {isTrialing && props.trialEndsAt && (
              <p className="mt-2 text-xs text-zinc-500">Trial ends {fmtDate(props.trialEndsAt)}</p>
            )}
            {isActive && !isTrialing && props.currentPeriodEnd && (
              <p className="mt-2 text-xs text-zinc-500">Renews {fmtDate(props.currentPeriodEnd)}</p>
            )}
          </div>

          {props.hasStripeCustomer && (
            <button
              onClick={openPortal}
              disabled={loading === 'portal'}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Manage billing
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              billing === 'monthly' ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-50' : 'text-zinc-500'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              billing === 'yearly' ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-50' : 'text-zinc-500'
            }`}
          >
            Yearly <span className="text-emerald-600 ml-1">save 16%</span>
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['FREE', 'BASIC', 'PRO'] as const).map((id) => {
          const plan = PLANS[id]
          const isCurrent = props.currentPlan === id
          const monthly = billing === 'yearly' ? plan.yearlyPrice / 12 : plan.monthlyPrice
          const features: string[] = [
            plan.limits.maxProducts === -1 ? 'Unlimited products' : `${plan.limits.maxProducts} products`,
            plan.limits.maxStorageMB >= 1000
              ? `${plan.limits.maxStorageMB / 1000} GB storage`
              : `${plan.limits.maxStorageMB} MB storage`,
            `${plan.takeRatePercent}% transaction fee`,
            plan.limits.customDomain ? 'Custom domain' : null,
            plan.limits.removeBranding ? 'Remove ShopFlow branding' : null,
            plan.limits.customCodeAllowed ? 'Custom CSS / HTML' : null,
            plan.limits.codAllowed ? 'Cash on Delivery' : null,
            plan.limits.maxActiveDiscounts === -1 ? 'Unlimited discount codes' : `${plan.limits.maxActiveDiscounts} discount code`,
          ].filter(Boolean) as string[]

          return (
            <div
              key={id}
              className={`rounded-2xl p-5 border ${
                isCurrent
                  ? 'border-zinc-900 dark:border-zinc-50 bg-white dark:bg-zinc-900'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{plan.name}</h3>
                {isCurrent && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-wider">
                    Current
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  ${(monthly / 100).toFixed(0)}
                </span>
                <span className="text-xs text-zinc-500">/mo</span>
              </div>

              <ul className="mt-4 space-y-1.5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-600 dark:text-zinc-400">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => id !== 'FREE' && startSubscription(id)}
                disabled={isCurrent || id === 'FREE' || loading !== null}
                className={`mt-5 w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  isCurrent
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default'
                    : id === 'FREE'
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default'
                      : 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200'
                }`}
              >
                {loading === id ? 'Redirecting…'
                  : isCurrent ? 'Current plan'
                  : id === 'FREE' ? 'Default'
                  : props.currentPlan === 'FREE'
                    ? `Start ${TRIAL_DAYS}-day free trial`
                    : 'Switch to this plan'}
              </button>
            </div>
          )
        })}
      </div>

      <p className="mt-8 text-xs text-zinc-400 text-center">
        Cancel anytime. Plan changes take effect at the end of your current billing period.
      </p>
    </div>
  )
}
