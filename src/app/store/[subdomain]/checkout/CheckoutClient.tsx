'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '../cart'
import {
  HiArrowLeft, HiCheck, HiCash, HiLockClosed,
  HiCreditCard, HiExclamation, HiShoppingCart, HiTag, HiX,
} from 'react-icons/hi'
import DarkModeSync from '../DarkModeSync'
import { usePrice } from '@/components/CurrencyProvider'
import { addressPlaceholders, getCountry } from '@/lib/countries'

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

export interface CheckoutTheme {
  primary: string
  radius: string
  textColor: string
  font: string
}

/**
 * Checkout.
 *
 * Two columns on a desk, one on a phone, with the summary pinned so the
 * total never scrolls out of sight while the form is being filled in. Every
 * colour and corner comes from the shop's own theme rather than a hardcoded
 * palette, because this is the page where a shopper decides whether to hand
 * over money, and it should not look like a different website from the one
 * they were just browsing.
 *
 * The fields are deliberately plain and large. A checkout is not the place
 * to be inventive: anything unfamiliar reads as risk.
 */
export default function CheckoutClient({
  params,
  storeName,
  theme,
}: {
  params: { subdomain: string }
  storeName?: string
  theme?: CheckoutTheme
}) {
  const price = usePrice()
  const { subdomain } = params
  const router = useRouter()
  const { items, clear } = useCart()

  // Falls back to the old greys if a caller has not passed a theme, so this
  // renders sensibly rather than transparently if it is ever used bare.
  const t: CheckoutTheme = theme ?? { primary: '#0a0a0a', radius: '0.75rem', textColor: '#09090b', font: 'sans' }
  const radius = t.radius
  /** A softer corner for the small controls inside a card. */
  const innerRadius = `min(${radius}, 0.75rem)`

  const [payment, setPayment] = useState<PaymentConfig | null>(null)
  // Where the shop trades from. Drives the address examples, which otherwise
  // showed American ones to a shop selling anywhere else.
  const [storeCountry, setStoreCountry] = useState('')
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
        if (data.country) {
          setStoreCountry(data.country)
          // Prefill rather than only hint: most orders are domestic, and the
          // customer can still change it.
          setCountry(prev => prev || (getCountry(data.country)?.name ?? ''))
        }
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
      setDiscountLoading(false)
    }
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6 bg-zinc-50">
        <DarkModeSync />
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${t.primary}12`, color: t.primary }}
        >
          <HiShoppingCart className="w-7 h-7" />
        </span>
        <div>
          <p className="text-lg font-semibold text-zinc-900">Your cart is empty</p>
          <p className="text-sm text-zinc-500 mt-1">Nothing to check out just yet.</p>
        </div>
        <Link
          href={`/store/${subdomain}`}
          className="px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: t.primary, borderRadius: radius }}
        >
          Back to the shop
        </Link>
      </div>
    )
  }

  const methods = [
    { id: 'cod', label: 'Cash on delivery', desc: 'Pay when your order arrives', icon: HiCash, enabled: payment?.codEnabled },
    { id: 'stripe', label: 'Pay by card', desc: 'Visa, Mastercard, Apple Pay', icon: HiCreditCard, enabled: payment?.stripeEnabled },
  ].filter(m => m.enabled)

  const card = 'bg-white border border-zinc-200'
  const legend = 'text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500'
  const label = 'text-[12px] font-medium text-zinc-700 mb-1.5 block'
  const field =
    'w-full border border-zinc-300 bg-white px-3.5 py-3 text-[14px] ' +
    'text-zinc-900 outline-none transition-[border-color,box-shadow] ' +
    'placeholder:text-zinc-400'

  /** Focus is drawn in the shop's colour rather than a browser default blue. */
  const focusRing = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = t.primary
    e.currentTarget.style.boxShadow = `0 0 0 3px ${t.primary}1f`
  }
  const blurRing = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = ''
    e.currentTarget.style.boxShadow = ''
  }
  const fieldProps = { className: field, style: { borderRadius: innerRadius }, onFocus: focusRing, onBlur: blurRing }

  /** A chosen row: the shop's colour as an outline plus the faintest wash. */
  const chosen = (on: boolean) => ({
    borderRadius: innerRadius,
    borderColor: on ? t.primary : undefined,
    backgroundColor: on ? `${t.primary}0a` : undefined,
    boxShadow: on ? `0 0 0 1px ${t.primary}` : undefined,
  })

  return (
    <div className="min-h-screen bg-zinc-50" style={{ color: t.textColor }}>
      <DarkModeSync />

      {/* A checkout is its own place. The shop's navigation is deliberately
          not here: every link out of this page is a chance to not buy. */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-3">
          <Link
            href={`/store/${subdomain}`}
            className="flex items-center gap-2 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <HiArrowLeft className="w-4 h-4" />
            {storeName ?? 'Back to the shop'}
          </Link>
          <span className="ml-auto flex items-center gap-1.5 text-[12px] font-medium text-zinc-500">
            <HiLockClosed className="w-3.5 h-3.5" />
            Secure checkout
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight mb-8 text-zinc-900">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* ── The form ── */}
          <div className="lg:col-span-3 space-y-5">
            <section className={`${card} p-6 space-y-5`} style={{ borderRadius: radius }}>
              <p className={legend}>Where it is going</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className={label}>Full name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name" {...fieldProps} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={label}>Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" {...fieldProps} />
                </div>
                <div className="col-span-2">
                  <label className={label}>Address *</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, area" autoComplete="street-address" {...fieldProps} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={label}>City *</label>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder={addressPlaceholders(storeCountry).city} autoComplete="address-level2" {...fieldProps} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={label}>Country</label>
                  <input value={country} onChange={e => setCountry(e.target.value)} placeholder={addressPlaceholders(storeCountry).country} autoComplete="country-name" {...fieldProps} />
                </div>
                <div className="col-span-2">
                  <label className={label}>Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="For delivery updates" autoComplete="tel" {...fieldProps} />
                </div>
                <div className="col-span-2">
                  <label className={label}>Order notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything the shop should know" rows={2} {...fieldProps} className={`${field} resize-none`} />
                </div>
              </div>
            </section>

            {shippingRates.length > 0 && (
              <section className={`${card} p-6 space-y-3`} style={{ borderRadius: radius }}>
                <p className={legend}>Delivery</p>
                {shippingRates.map(rate => {
                  const on = selectedRateId === rate.id
                  const effectivePrice = rate.minOrder > 0 && subtotal >= rate.minOrder ? 0 : rate.price
                  return (
                    <button
                      key={rate.id}
                      onClick={() => setSelectedRateId(rate.id)}
                      className="w-full flex items-center gap-4 p-4 border border-zinc-200 text-left transition-colors hover:border-zinc-300"
                      style={chosen(on)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-zinc-900">{rate.name}</p>
                        {rate.estimatedDays && <p className="text-[12px] text-zinc-500 mt-0.5">{rate.estimatedDays}</p>}
                        {rate.minOrder > 0 && subtotal < rate.minOrder && (
                          <p className="text-[12px] text-zinc-500 mt-0.5">Free over {price(rate.minOrder)}</p>
                        )}
                      </div>
                      <p className="text-[14px] font-semibold shrink-0 text-zinc-900">
                        {effectivePrice === 0 ? 'Free' : price(effectivePrice)}
                      </p>
                      <Tick on={on} colour={t.primary} />
                    </button>
                  )
                })}
              </section>
            )}

            <section className={`${card} p-6 space-y-3`} style={{ borderRadius: radius }}>
              <p className={legend}>How you are paying</p>
              {methods.length === 0 ? (
                <p className="text-[13px] text-zinc-500 py-4 text-center">This shop has not set up payments yet.</p>
              ) : (
                methods.map(method => {
                  const on = selectedMethod === method.id
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id as 'cod' | 'stripe')}
                      className="w-full flex items-center gap-4 p-4 border border-zinc-200 text-left transition-colors hover:border-zinc-300"
                      style={chosen(on)}
                    >
                      <span
                        className="w-10 h-10 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${t.primary}12`, color: t.primary, borderRadius: innerRadius }}
                      >
                        <method.icon className="w-4.5 h-4.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-zinc-900">{method.label}</p>
                        <p className="text-[12px] text-zinc-500 mt-0.5">{method.desc}</p>
                      </div>
                      <Tick on={on} colour={t.primary} />
                    </button>
                  )
                })
              )}
            </section>
          </div>

          {/* ── The summary, pinned so the total never scrolls away ── */}
          <div className="lg:col-span-2">
            <section className={`${card} p-6 space-y-5 lg:sticky lg:top-6`} style={{ borderRadius: radius }}>
              <p className={legend}>Your order</p>

              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item.productId} className="flex items-center gap-3">
                    <span
                      className="relative w-12 h-12 shrink-0 overflow-hidden bg-zinc-100"
                      style={{ borderRadius: innerRadius }}
                    >
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      )}
                      {/* The count rides on the picture, the way a cart badge
                          does, instead of taking a line of its own. */}
                      <span
                        className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: t.primary }}
                      >
                        {item.quantity}
                      </span>
                    </span>
                    <p className="flex-1 min-w-0 text-[13px] font-medium text-zinc-900 line-clamp-2">{item.title}</p>
                    <p className="text-[13px] font-semibold shrink-0 text-zinc-900">{price(item.price * item.quantity)}</p>
                  </li>
                ))}
              </ul>

              {discountCode ? (
                <div
                  className="flex items-center justify-between px-3 py-2.5 border border-emerald-100 bg-emerald-50"
                  style={{ borderRadius: innerRadius }}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <HiTag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-[12px] font-semibold text-emerald-700 truncate">{discountCode}</span>
                    <span className="text-[12px] text-emerald-700 shrink-0">−{price(discountAmount)}</span>
                  </span>
                  <button onClick={removeDiscount} aria-label="Remove discount" className="text-emerald-600 hover:text-emerald-700 transition-colors">
                    <HiX className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      value={discountInput}
                      onChange={e => setDiscountInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && applyDiscount()}
                      placeholder="Discount code"
                      className={`${field} flex-1 py-2.5 text-[13px] font-mono uppercase tracking-wide`}
                      style={{ borderRadius: innerRadius }}
                      onFocus={focusRing}
                      onBlur={blurRing}
                    />
                    <button
                      onClick={applyDiscount}
                      disabled={discountLoading || !discountInput.trim()}
                      className="px-4 text-[13px] font-semibold border border-zinc-300 text-zinc-700 hover:border-zinc-400 transition-colors disabled:opacity-40"
                      style={{ borderRadius: innerRadius }}
                    >
                      {discountLoading ? '…' : 'Apply'}
                    </button>
                  </div>
                  {discountError && <p className="text-[12px] text-red-600 mt-1.5">{discountError}</p>}
                </div>
              )}

              <div className="border-t border-zinc-200 pt-4 space-y-2.5">
                <Line label="Subtotal" value={price(subtotal)} />
                {discountAmount > 0 && <Line label="Discount" value={`−${price(discountAmount)}`} tone="text-emerald-700" />}
                {selectedRate && <Line label="Delivery" value={shippingAmount === 0 ? 'Free' : price(shippingAmount)} />}
                {taxAmount > 0 && <Line label={payment?.taxName ?? 'Tax'} value={price(taxAmount)} />}
                <div className="flex items-baseline justify-between pt-3 border-t border-zinc-200">
                  <span className="text-[14px] font-semibold text-zinc-900">Total</span>
                  <span className="text-2xl font-bold tracking-tight text-zinc-900">{price(total)}</span>
                </div>
              </div>

              {error && (
                <div
                  className="flex items-start gap-2 p-3 border border-red-100 bg-red-50"
                  style={{ borderRadius: innerRadius }}
                >
                  <HiExclamation className="w-4 h-4 text-red-600 shrink-0 mt-px" />
                  <p className="text-[12.5px] text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={!canSubmit || loading}
                className="w-full py-4 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: t.primary, borderRadius: innerRadius }}
              >
                {loading
                  ? 'Placing your order…'
                  : selectedMethod === 'stripe'
                    ? `Pay ${price(total)}`
                    : `Place order · ${price(total)}`}
              </button>

              {/* Honest about who is involved. The old line credited Stripe on
                  a cash on delivery order, which was simply untrue. */}
              <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-zinc-500">
                <HiLockClosed className="w-3 h-3" />
                {selectedMethod === 'stripe' ? 'Card details are handled by Stripe' : 'Your details are sent securely'}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

/** The chosen mark on a delivery or payment row. */
function Tick({ on, colour }: { on: boolean; colour: string }) {
  return (
    <span
      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
      style={{
        borderColor: on ? colour : undefined,
        backgroundColor: on ? colour : undefined,
      }}
    >
      {on && <HiCheck className="w-3 h-3 text-white" />}
    </span>
  )
}

function Line({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`flex items-center justify-between text-[13px] ${tone ?? 'text-zinc-600'}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
