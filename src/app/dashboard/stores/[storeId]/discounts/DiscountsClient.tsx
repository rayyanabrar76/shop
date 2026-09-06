'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HiPlus, HiTrash, HiTag, HiTruck } from 'react-icons/hi'
import { useDashboardPrice } from '@/components/CurrencyProvider'

interface DiscountCode { id: string; code: string; type: string; value: number; minOrder: number; maxUses: number | null; usedCount: number; active: boolean; expiresAt: Date | null; createdAt: Date }
interface ShippingRate  { id: string; name: string; price: number; minOrder: number; estimatedDays: string | null }

const inputCls = 'w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
const labelCls = 'text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5 block'

export default function DiscountsClient({ storeId, discounts: initial, shippingRates: initialRates }: { storeId: string; discounts: DiscountCode[]; shippingRates: ShippingRate[] }) {
  const price = useDashboardPrice()
  const router = useRouter()
  const [discounts, setDiscounts] = useState(initial)
  const [shippingRates, setShippingRates] = useState(initialRates)

  const [showDiscountForm, setShowDiscountForm] = useState(false)
  const [dCode, setDCode] = useState(''); const [dType, setDType] = useState<'percentage' | 'fixed'>('percentage')
  const [dValue, setDValue] = useState(''); const [dMinOrder, setDMinOrder] = useState(''); const [dMaxUses, setDMaxUses] = useState(''); const [dExpires, setDExpires] = useState('')
  const [dLoading, setDLoading] = useState(false); const [dError, setDError] = useState('')

  const [showShippingForm, setShowShippingForm] = useState(false)
  const [sName, setSName] = useState(''); const [sPrice, setSPrice] = useState(''); const [sMinOrder, setSMinOrder] = useState(''); const [sDays, setSDays] = useState('')
  const [sLoading, setSLoading] = useState(false); const [sError, setSError] = useState('')

  async function createDiscount() {
    if (!dCode || !dValue) return
    setDLoading(true); setDError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/discounts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: dCode, type: dType, value: dType === 'percentage' ? Number(dValue) : Math.round(Number(dValue) * 100), minOrder: dMinOrder ? Math.round(Number(dMinOrder) * 100) : 0, maxUses: dMaxUses ? Number(dMaxUses) : null, expiresAt: dExpires || null }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setDiscounts(prev => [data.discount, ...prev]); setShowDiscountForm(false)
      setDCode(''); setDValue(''); setDMinOrder(''); setDMaxUses(''); setDExpires('')
      router.refresh()
    } catch (e: any) { setDError(e.message) }
    finally { setDLoading(false) }
  }

  async function toggleDiscount(id: string, active: boolean) {
    await fetch(`/api/stores/${storeId}/discounts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !active }) })
    setDiscounts(prev => prev.map(d => d.id === id ? { ...d, active: !active } : d))
  }

  async function deleteDiscount(id: string) {
    await fetch(`/api/stores/${storeId}/discounts/${id}`, { method: 'DELETE' })
    setDiscounts(prev => prev.filter(d => d.id !== id))
  }

  async function createShipping() {
    if (!sName || sPrice === '') return
    setSLoading(true); setSError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/shipping`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: sName, price: Math.round(Number(sPrice) * 100), minOrder: sMinOrder ? Math.round(Number(sMinOrder) * 100) : 0, estimatedDays: sDays || null }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setShippingRates(prev => [...prev, data.rate].sort((a, b) => a.price - b.price)); setShowShippingForm(false)
      setSName(''); setSPrice(''); setSMinOrder(''); setSDays('')
      router.refresh()
    } catch (e: any) { setSError(e.message) }
    finally { setSLoading(false) }
  }

  async function deleteShipping(id: string) {
    await fetch(`/api/stores/${storeId}/shipping/${id}`, { method: 'DELETE' })
    setShippingRates(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="p-5 pt-16 md:p-8 md:pt-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Discounts & Shipping</h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Manage discount codes and shipping rates for your store</p>
      </div>

      {/* ── Discount Codes ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <HiTag className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Discount Codes</p>
          </div>
          <button onClick={() => setShowDiscountForm(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
            <HiPlus className="w-3.5 h-3.5" /> Add Code
          </button>
        </div>

        {showDiscountForm && (
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Code</label><input value={dCode} onChange={e => setDCode(e.target.value.toUpperCase())} placeholder="SUMMER20" className={inputCls} /></div>
              <div><label className={labelCls}>Type</label><select value={dType} onChange={e => setDType(e.target.value as any)} className={inputCls}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed Amount ($)</option></select></div>
              <div><label className={labelCls}>{dType === 'percentage' ? 'Discount (%)' : 'Discount ($)'}</label><input type="number" min="0" value={dValue} onChange={e => setDValue(e.target.value)} placeholder={dType === 'percentage' ? '20' : '10.00'} className={inputCls} /></div>
              <div><label className={labelCls}>Min Order ($) <span className="normal-case font-normal opacity-60">optional</span></label><input type="number" min="0" value={dMinOrder} onChange={e => setDMinOrder(e.target.value)} placeholder="0.00" className={inputCls} /></div>
              <div><label className={labelCls}>Max Uses <span className="normal-case font-normal opacity-60">optional</span></label><input type="number" min="1" value={dMaxUses} onChange={e => setDMaxUses(e.target.value)} placeholder="Unlimited" className={inputCls} /></div>
              <div><label className={labelCls}>Expires <span className="normal-case font-normal opacity-60">optional</span></label><input type="date" value={dExpires} onChange={e => setDExpires(e.target.value)} className={inputCls} /></div>
            </div>
            {dError && <p className="text-xs text-red-500">{dError}</p>}
            <div className="flex gap-2">
              <button onClick={createDiscount} disabled={dLoading || !dCode || !dValue} className="px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-40">{dLoading ? 'Creating...' : 'Create Code'}</button>
              <button onClick={() => setShowDiscountForm(false)} className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
            </div>
          </div>
        )}

        {discounts.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-10">No discount codes yet</p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {discounts.map(d => (
              <div key={d.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-50">{d.code}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${d.active ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'}`}>{d.active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {d.type === 'percentage' ? `${d.value}% off` : `${price(d.value)} off`}
                    {d.minOrder > 0 && ` · min ${price(d.minOrder)}`}
                    {d.maxUses && ` · ${d.usedCount}/${d.maxUses} used`}
                    {!d.maxUses && d.usedCount > 0 && ` · ${d.usedCount} used`}
                    {d.expiresAt && ` · expires ${new Date(d.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button onClick={() => toggleDiscount(d.id, d.active)} className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 font-medium transition-colors">{d.active ? 'Disable' : 'Enable'}</button>
                <button onClick={() => deleteDiscount(d.id)} className="p-1.5 text-zinc-300 dark:text-zinc-600 hover:text-red-500 transition-colors"><HiTrash className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Shipping Rates ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <HiTruck className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Shipping Rates</p>
          </div>
          <button onClick={() => setShowShippingForm(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
            <HiPlus className="w-3.5 h-3.5" /> Add Rate
          </button>
        </div>

        {showShippingForm && (
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 md:col-span-1"><label className={labelCls}>Rate Name</label><input value={sName} onChange={e => setSName(e.target.value)} placeholder="Standard Shipping" className={inputCls} /></div>
              <div><label className={labelCls}>Price ($) — 0 for free</label><input type="number" min="0" step="0.01" value={sPrice} onChange={e => setSPrice(e.target.value)} placeholder="5.00" className={inputCls} /></div>
              <div><label className={labelCls}>Free above ($) <span className="normal-case font-normal opacity-60">optional</span></label><input type="number" min="0" value={sMinOrder} onChange={e => setSMinOrder(e.target.value)} placeholder="e.g. 50" className={inputCls} /></div>
              <div><label className={labelCls}>Estimated Delivery <span className="normal-case font-normal opacity-60">optional</span></label><input value={sDays} onChange={e => setSDays(e.target.value)} placeholder="3-5 business days" className={inputCls} /></div>
            </div>
            {sError && <p className="text-xs text-red-500">{sError}</p>}
            <div className="flex gap-2">
              <button onClick={createShipping} disabled={sLoading || !sName || sPrice === ''} className="px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-40">{sLoading ? 'Adding...' : 'Add Rate'}</button>
              <button onClick={() => setShowShippingForm(false)} className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
            </div>
          </div>
        )}

        {shippingRates.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-10">No shipping rates yet — add one above</p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {shippingRates.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{r.name}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {r.price === 0 ? 'Free' : price(r.price)}
                    {r.minOrder > 0 && ` · free above ${price(r.minOrder)}`}
                    {r.estimatedDays && ` · ${r.estimatedDays}`}
                  </p>
                </div>
                <button onClick={() => deleteShipping(r.id)} className="p-1.5 text-zinc-300 dark:text-zinc-600 hover:text-red-500 transition-colors"><HiTrash className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
