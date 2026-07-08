'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { PLANS, TRIAL_DAYS } from '@/lib/plans'

const FEATURES: { label: string; key: keyof typeof PLANS.FREE.limits | 'takeRate' }[] = [
  { label: 'Products', key: 'maxProducts' },
  { label: 'Storage', key: 'maxStorageMB' },
  { label: 'Custom domain', key: 'customDomain' },
  { label: 'Remove ShopFlow branding', key: 'removeBranding' },
  { label: 'Custom CSS / HTML', key: 'customCodeAllowed' },
  { label: 'Active discount codes', key: 'maxActiveDiscounts' },
  { label: 'Cash on Delivery', key: 'codAllowed' },
  { label: 'Stripe transaction fee', key: 'takeRate' },
]

function formatLimit(value: number, suffix: string) {
  if (value === -1) return 'Unlimited'
  if (suffix === 'MB' && value >= 1000) return `${(value / 1000).toFixed(0)} GB`
  return `${value.toLocaleString()} ${suffix}`.trim()
}

function renderFeature(planId: 'FREE' | 'BASIC' | 'PRO', key: string) {
  const p = PLANS[planId]
  if (key === 'takeRate') return `${p.takeRatePercent}%`
  if (key === 'maxProducts') return formatLimit(p.limits.maxProducts, '')
  if (key === 'maxStorageMB') return formatLimit(p.limits.maxStorageMB, 'MB')
  if (key === 'maxActiveDiscounts') return formatLimit(p.limits.maxActiveDiscounts, '')
  const v = (p.limits as Record<string, unknown>)[key]
  return v ? <Check className="w-4 h-4 text-emerald-600 inline" /> : <span className="text-zinc-300">—</span>
}

export default function PricingClient() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900">
          Simple pricing. <span className="text-zinc-400">Built to scale with you.</span>
        </h1>
        <p className="mt-4 text-zinc-600 text-base md:text-lg max-w-xl mx-auto">
          Start free. Upgrade when you outgrow it. No setup fees, cancel anytime.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex rounded-2xl bg-zinc-100 p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              billing === 'monthly' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              billing === 'yearly' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'
            }`}
          >
            Yearly
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
              2 months free
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
        {(['FREE', 'BASIC', 'PRO'] as const).map((id) => {
          const plan = PLANS[id]
          const featured = id === 'BASIC'
          const price = billing === 'yearly' ? plan.yearlyPrice / 12 : plan.monthlyPrice
          const priceDisplay = price === 0 ? '$0' : `$${(price / 100).toFixed(0)}`
          return (
            <div
              key={id}
              className={`relative rounded-3xl p-7 border ${
                featured
                  ? 'border-zinc-900 bg-zinc-900 text-white shadow-xl'
                  : 'border-zinc-200 bg-white text-zinc-900'
              }`}
            >
              {featured && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-500 text-white text-[10px] font-bold uppercase tracking-wider">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className={`mt-1 text-sm ${featured ? 'text-zinc-300' : 'text-zinc-500'}`}>
                {plan.description}
              </p>
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-black tracking-tight">{priceDisplay}</span>
                {price > 0 && (
                  <span className={`text-sm ${featured ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    /mo{billing === 'yearly' ? ', billed yearly' : ''}
                  </span>
                )}
              </div>
              <p className={`mt-2 text-xs ${featured ? 'text-zinc-400' : 'text-zinc-500'}`}>
                + {plan.takeRatePercent}% transaction fee on Stripe sales
              </p>
              <Link
                href={id === 'FREE' ? '/dashboard/create-store' : `/dashboard?upgrade=${id}&billing=${billing}`}
                className={`mt-6 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition ${
                  featured
                    ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                    : 'bg-zinc-900 text-white hover:bg-zinc-700'
                }`}
              >
                {id === 'FREE' ? 'Start free' : `Start ${TRIAL_DAYS}-day free trial`}
                <ArrowRight className="w-4 h-4" />
              </Link>

              <ul className="mt-7 space-y-2.5 text-sm">
                {FEATURES.map((f) => (
                  <li key={f.label} className="flex items-center justify-between gap-3">
                    <span className={featured ? 'text-zinc-300' : 'text-zinc-600'}>{f.label}</span>
                    <span className="font-semibold">{renderFeature(id, f.key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-6 text-center">Frequently asked questions</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Do I need a credit card to start the trial?',
              a: 'No. The 14-day Basic trial requires no card. Your store auto-downgrades to Free if you don\'t upgrade by day 14.',
            },
            {
              q: 'What\'s the transaction fee?',
              a: 'On top of Stripe\'s standard processing fees (~2.9% + 30¢), ShopFlow takes a small percentage to keep the lights on. Pro users pay just 0.5%.',
            },
            {
              q: 'Can I cancel anytime?',
              a: 'Yes. Cancel from your billing portal — you keep access through the end of your billing period.',
            },
            {
              q: 'Do I own my data?',
              a: 'Always. Export your products, orders, and customers as CSV at any time.',
            },
          ].map((item, i) => (
            <details key={i} className="rounded-2xl border border-zinc-200 bg-white p-5 group">
              <summary className="font-semibold text-zinc-900 cursor-pointer list-none flex items-center justify-between">
                {item.q}
                <span className="text-zinc-400 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-sm text-zinc-600 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
