'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '../cart'
import {
  HiArrowLeft, HiCheck, HiCash,
  HiCreditCard, HiExclamation, HiShoppingCart, HiTag, HiX,
} from 'react-icons/hi'
import DarkModeSync from '../DarkModeSync'
import { usePrice } from '@/components/CurrencyProvider'

interface PaymentConfig {
  codEnabled: boolean
  stripeEnabled: boolean
  taxEnabled?: boolean
  taxRate?: number
  taxName?: string
}

interface ShippingRate {
  id: string
  name: string
  price: number
  minOrder: number
  estimatedDays: string | null
}

const inputCls = 'w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400 transition-all bg-white placeholder:text-zinc-300'
const labelCls = 'text-xs font-semibold text-zinc-600 mb-1.5 block'

export default function CheckoutClient({ params }: { params: { subdomain: string } }) {
  const price = usePrice()
  const { subdomain } = params
  const router = useRouter()
  const { items, clear } = useCart()

  const [payment, setPayment] = useState<PaymentConfig | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<'cod' | 'stripe' | ''>('')
  const [storeId, setStoreId] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [notes, setNotes] = useState('')

  // Discount
  const [discountInput, setDiscountInput] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountError, setDiscountError] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)

  // Shipping
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/storefront/${subdomain}/payment`)
      .then(r => r.json())
      .then(data => {
        setPayment(data.payment)
        setStoreId(data.storeId)
        if (data.payment?.codEnabled) setSelectedMethod('cod')
        else if (data.payment?.stripeEnabled) setSelectedMethod('stripe')
      })
      .catch(() => setError('Failed to load payment options'))

    fetch(`/api/storefront/${subdomain}/shipping-rates`)
      .then(r => r.json())
      .then(data => {
        setShippingRates(data.rates ?? [])
        if (data.rates?.length > 0) setSelectedRateId(data.rates[0].id)
      })
      .catch(() => {})
  }, [subdomain])

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const selectedRate = shippingRates.find(r => r.id === selectedRateId)
  const shippingAmount = selectedRate
    ? (selectedRate.minOrder > 0 && subtotal >= selectedRate.minOrder ? 0 : selectedRate.price)
    : 0

  const taxRate = payment?.taxEnabled ? (payment.taxRate ?? 0) : 0
  const taxAmount = Math.round((subtotal - discountAmount) * taxRate / 100)
  const total = subtotal - discountAmount + shippingAmount + taxAmount

  const canSubmit = name && email && address && city && selectedMethod && items.length > 0

  async function applyDiscount() {
    if (!discountInput.trim()) return
    setDiscountLoading(true); setDiscountError('')
    try {
      const res = await fetch(`/api/storefront/${subdomain}/discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountInput.trim(), subtotal }),
      })
      const data = await res.json()
      if (!res.ok) { setDiscountError(data.error ?? 'Invalid code'); return }
      setDiscountCode(data.code)
      setDiscountAmount(data.discountAmount)
      setDiscountInput('')
    } catch {
      setDiscountError('Failed to validate code')
    } finally {
      setDiscountLoading(false) }
  }

  function removeDiscount() {
    setDiscountCode('')
    setDiscountAmount(0)
    setDiscountError('')
    setDiscountInput('')
  }

  async function handlePlaceOrder() {
    if (!canSubmit || !storeId) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
          paymentMethod: selectedMethod,
          customerName: name, customerEmail: email, customerPhone: phone,
          customerAddress: address, customerCity: city, customerCountry: country, notes,
          discountCode: discountCode || null,
          shippingRateId: selectedRateId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed')
      clear()
      if (selectedMethod === 'stripe' && data.stripeUrl) {
        window.location.href = data.stripeUrl
        return
      }
      router.push(`/store/${subdomain}/success?orderId=${data.orderId}&method=${selectedMethod}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <HiShoppingCart className="w-12 h-12 text-zinc-200" />
        <p className="font-semibold text-zinc-600">Your cart is empty</p>
        <Link href={`/store/${subdomain}`} className="text-sm text-black underline">Back to store</Link>
      </div>
    )
  }

  const methods = [
    { id: 'cod',    label: 'Cash on Delivery', desc: 'Pay when your order arrives',    icon: HiCash,       color: '#f59e0b', enabled: payment?.codEnabled },
    { id: 'stripe', label: 'Pay with Card',    desc: 'Visa, Mastercard, Apple Pay',    icon: HiCreditCard, color: '#8b5cf6', enabled: payment?.stripeEnabled },
  ].filter(m => m.enabled)

  return (
    <div className="min-h-screen bg-zinc-50">
      <DarkModeSync />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/store/${subdomain}`} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-400">
            <HiArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-4 w-px bg-zinc-200" />
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Customer details */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Your Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 md:col-span-1">
                  <label className={labelCls}>Full Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className={inputCls} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className={labelCls}>Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className={inputCls} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className={labelCls}>Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 8900" className={inputCls} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className={labelCls}>City *</label>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="New York" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Address *</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, Area" className={inputCls} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className={labelCls}>Country</label>
                  <input value={country} onChange={e => setCountry(e.target.value)} placeholder="United States" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Order Notes (optional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." rows={2} className={`${inputCls} resize-none`} />
                </div>
              </div>
            </div>

            {/* Shipping */}
            {shippingRates.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Shipping Method</p>
                {shippingRates.map(rate => {
                  const effectivePrice = rate.minOrder > 0 && subtotal >= rate.minOrder ? 0 : rate.price
                  return (
                    <button
                      key={rate.id}
                      onClick={() => setSelectedRateId(rate.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${selectedRateId === rate.id ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-200'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-800">{rate.name}</p>
                        {rate.estimatedDays && <p className="text-xs text-zinc-400 mt-0.5">{rate.estimatedDays}</p>}
                        {rate.minOrder > 0 && subtotal < rate.minOrder && (
                          <p className="text-xs text-zinc-400 mt-0.5">Free shipping over {price(rate.minOrder)}</p>
                        )}
                      </div>
                      <p className="text-sm font-bold text-zinc-800 shrink-0">
                        {effectivePrice === 0 ? 'Free' : price(effectivePrice)}
                      </p>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selectedRateId === rate.id ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-200'}`}>
                        {selectedRateId === rate.id && <HiCheck className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Payment method */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Payment Method</p>
              {methods.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4 text-center">No payment methods available for this store yet.</p>
              ) : (
                methods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id as any)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${selectedMethod === method.id ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-200'}`}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${method.color}15` }}>
                      <method.icon className="w-4 h-4" style={{ color: method.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800">{method.label}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{method.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selectedMethod === method.id ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-200'}`}>
                      {selectedMethod === method.id && <HiCheck className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: order summary */}
          <div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4 sticky top-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Order Summary</p>

              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.productId} className="flex items-center gap-3">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-lg object-cover bg-zinc-100 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 truncate">{item.title}</p>
                      <p className="text-[10px] text-zinc-400">×{item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold text-zinc-800 shrink-0">{price(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Discount code input */}
              {discountCode ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <HiTag className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">{discountCode}</span>
                    <span className="text-xs text-emerald-600">-{price(discountAmount)}</span>
                  </div>
                  <button onClick={removeDiscount} className="text-emerald-400 hover:text-emerald-600 transition-colors">
                    <HiX className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      value={discountInput}
                      onChange={e => setDiscountInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && applyDiscount()}
                      placeholder="Discount code"
                      className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-zinc-400 font-mono uppercase"
                    />
                    <button
                      onClick={applyDiscount}
                      disabled={discountLoading || !discountInput.trim()}
                      className="px-3 py-2 rounded-xl bg-zinc-100 text-xs font-bold text-zinc-600 hover:bg-zinc-200 transition-colors disabled:opacity-40"
                    >
                      {discountLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {discountError && <p className="text-[10px] text-red-500">{discountError}</p>}
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-zinc-100 pt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Subtotal</span>
                  <span>{price(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-600">
                    <span>Discount</span>
                    <span>-{price(discountAmount)}</span>
                  </div>
                )}
                {selectedRate && (
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Shipping</span>
                    <span>{shippingAmount === 0 ? 'Free' : price(shippingAmount)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{payment?.taxName ?? 'Tax'}</span>
                    <span>{price(taxAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                  <span className="text-sm font-semibold text-zinc-600">Total</span>
                  <span className="text-lg font-black">{price(total)}</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <HiExclamation className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={!canSubmit || loading}
                className="w-full py-3 rounded-xl bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : selectedMethod === 'stripe' ? 'Continue to Payment →' : 'Place Order'}
              </button>
              <p className="text-[10px] text-zinc-400 text-center">Secure checkout · Powered by Stripe</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
