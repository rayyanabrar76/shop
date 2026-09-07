'use client'

import { useEffect, useRef, useState } from 'react'
import { useCart } from './cart'
import { X, ShoppingBag, Plus, Minus, ArrowRight, Lock, Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePrice } from '@/components/CurrencyProvider'
import { useStoreBase } from '@/components/StoreBaseProvider'
import { useModalEscape } from '@/components/useModalEscape'
import { readableText } from '@/lib/contrast'

interface CartSidebarProps {
  themeStyle?: {
    primaryColor: string
    borderRadius: string
    buttonStyle: string
  }
  subdomain?: string
}

interface Rate {
  id: string
  name: string
  price: number
  minOrder: number
  estimatedDays: string | null
}

/** A cart line is a shopping list entry, not a warehouse order. */
const MAX_QTY = 99

/**
 * Modelled on Shopify's cart bin: bold strokes, a lid that sits clear of the
 * can with a real gap under it, a small tab handle, slots, rounded base.
 *
 * Hand-drawn rather than pulled from an icon set because the lid is its own
 * group — a library icon is one flat path, so there would be nothing to open.
 * It is hinged at the right end of the rim, which is what makes the left end
 * lift; hinging it on the left swings the wrong end up.
 */
function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="trash-icon"
      aria-hidden="true"
    >
      <g className="trash-lid">
        <path d="M3.6 6.4h16.8" />
        <path d="M9.6 6.4V5.1a1.2 1.2 0 0 1 1.2-1.2h2.4a1.2 1.2 0 0 1 1.2 1.2v1.3" />
      </g>
      <path d="M5.9 9.1v9.6a2.3 2.3 0 0 0 2.3 2.3h7.6a2.3 2.3 0 0 0 2.3-2.3V9.1" />
      <path d="M10.2 12.2v5.4M13.8 12.2v5.4" />
    </svg>
  )
}

export default function CartSidebar({ themeStyle, subdomain }: CartSidebarProps) {
  const storeBase = useStoreBase()
  const price = usePrice()
  const { items, total, remove, removeItemCompletely, add, isOpen, setIsOpen } = useCart()
  const router = useRouter()

  const primary = themeStyle?.primaryColor ?? '#0a0a0a'

  /**
   * The drawer follows the store's corners rather than setting its own.
   *
   * An earlier pass gave it a rounded identity, which made it a foreign
   * object: the rest of this storefront is hairline borders and square
   * corners, and a soft-cornered panel dropped into that looks borrowed from
   * another site. Type, spacing and hairlines carry the design here instead.
   *
   * Only bracketed radii would survive anyway — the layout's RADIUS_CSS
   * rewrites `.rounded-2xl` and friends with !important storefront-wide.
   */
  const radius = themeStyle?.borderRadius ?? '0px'
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)

  // The button sits on the merchant's chosen colour, which can be anything —
  // white label text on a pale yellow brand is unreadable.
  const onPrimary = readableText(primary)

  useModalEscape(() => setIsOpen(false), isOpen)

  // A drawer that lets the page scroll underneath it feels broken on a phone:
  // flicking the list carries on into the catalogue behind.
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  // Shipping rates drive the "spend X more" nudge. Fetched once, the first
  // time the cart is opened — not on mount of every storefront page.
  const [rates, setRates] = useState<Rate[] | null>(null)
  const asked = useRef(false)
  useEffect(() => {
    if (!isOpen || !subdomain || asked.current) return
    asked.current = true
    fetch(`/api/storefront/${subdomain}/shipping-rates`)
      .then(r => (r.ok ? r.json() : { rates: [] }))
      .then(d => setRates(Array.isArray(d.rates) ? d.rates : []))
      .catch(() => setRates([]))
  }, [isOpen, subdomain])

  // The cheapest "free over X" offer the shop has. Only one is worth showing:
  // a bar racing towards the second-cheapest threshold would jump backwards
  // the moment the first was met.
  const freeAlways = rates?.some(r => r.price === 0 && r.minOrder === 0) ?? false
  const threshold = rates
    ?.filter(r => r.price === 0 && r.minOrder > 0)
    .sort((a, b) => a.minOrder - b.minOrder)[0]
  const unlocked = freeAlways || (threshold ? total >= threshold.minOrder : false)
  const remaining = threshold ? Math.max(0, threshold.minOrder - total) : 0
  const progress = threshold ? Math.min(100, (total / threshold.minOrder) * 100) : 0

  function handleCheckout() {
    if (!subdomain) return
    setIsOpen(false)
    router.push(`${storeBase}/checkout`)
  }

  return (
    <>
      <div
        onClick={() => setIsOpen(false)}
        aria-hidden
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          backgroundColor: isOpen ? 'rgba(9,9,11,0.4)' : 'transparent',
          backdropFilter: isOpen ? 'blur(6px)' : 'none',
          WebkitBackdropFilter: isOpen ? 'blur(6px)' : 'none',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
        className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white sm:w-110"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.42s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: isOpen
            ? '-1px 0 0 rgba(9,9,11,0.06), -40px 0 90px -20px rgba(9,9,11,0.28)'
            : 'none',
          // Kept out of the tab order and off screen readers while closed — a
          // translated panel is still focusable otherwise.
          visibility: isOpen ? 'visible' : 'hidden',
        }}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="shrink-0 border-b border-zinc-200/60 bg-white px-5 py-4.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-zinc-900">
                Your cart
              </h2>
              {itemCount > 0 && (
                <span className="text-[12px] text-zinc-400 tabular-nums">
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close cart"
                className="flex h-8 w-8 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-900"
              >
                <X className="h-4.25 w-4.25" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Items ────────────────────────────────────────────────── */}
        <div className="relative min-h-0 flex-1">
          {/* Cards dissolve under the header and summary rather than being
              sliced off by a hard edge. Matched to the panel, not white. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-linear-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-linear-to-t from-white to-transparent" />

          <div className="hide-scrollbar h-full overflow-y-auto px-4 py-4">
            {/* Free-delivery nudge. Hidden entirely when the shop has no
                "free over X" rate, rather than showing an empty bar. */}
            {items.length > 0 && threshold && (
              <div
                className={`-mx-5 mb-1 border-b px-5 py-3.5 transition-colors ${
                  unlocked ? 'border-zinc-100 bg-emerald-50/50' : 'border-zinc-100 bg-zinc-50/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Truck
                    className={`h-3.5 w-3.5 shrink-0 ${
                      unlocked ? 'text-emerald-600' : 'text-zinc-400'
                    }`}
                    strokeWidth={2}
                  />
                  <p className="text-[11.5px] leading-tight">
                    {unlocked ? (
                      <span className="font-semibold text-emerald-700">
                        Free delivery unlocked
                      </span>
                    ) : (
                      <span className="text-zinc-500">
                        <span className="font-semibold text-zinc-900 tabular-nums">
                          {price(remaining)}
                        </span>{' '}
                        away from free delivery
                      </span>
                    )}
                  </p>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{
                      width: `${unlocked ? 100 : progress}%`,
                      backgroundColor: unlocked ? '#059669' : primary,
                    }}
                  />
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <div className="cart-empty-in flex h-full flex-col items-center justify-center gap-5 py-10 text-center">
                <div
                  className="flex h-18 w-18 items-center justify-center border border-zinc-200"
                  style={{ backgroundColor: `${primary}0d` }}
                >
                  <ShoppingBag className="h-7 w-7" strokeWidth={1.5} style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-zinc-900">
                    Your cart is empty
                  </p>
                  <p className="mx-auto mt-1.5 max-w-56 text-xs leading-relaxed text-zinc-400">
                    Browse the store and add something you like.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="border border-zinc-300 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.11em] text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {items.map((item, i) => {
                  return (
                    <li
                      key={item.cartKey}
                      className="cart-item-in group relative"
                      style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}
                    >
                      {/* Sits outside the animated wrapper below: the bin has
                          to hold still while the product is thrown into it. */}
                      <button
                        onClick={() => removeItemCompletely(item.cartKey)}
                        aria-label={`Remove ${item.title}`}
                        className="trash-btn absolute right-0 top-4 z-10 p-1.5 text-zinc-300 transition-colors group-hover:text-zinc-400 hover:!text-red-500"
                      >
                        <TrashIcon />
                      </button>

                      <div className="flex items-center gap-4 py-4">
                        <div
                          className="relative shrink-0 overflow-hidden border border-zinc-200/90 bg-zinc-50"
                          style={{ borderRadius: radius, width: 72, height: 72 }}
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-zinc-300" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Right padding keeps the title clear of the bin,
                              which is positioned over this column. */}
                          <div className="min-w-0 pr-7">
                            <p className="line-clamp-2 text-[13.5px] font-semibold leading-[1.35] tracking-tight text-zinc-900">
                              {item.title}
                            </p>
                            {item.variantSelections && item.variantSelections.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {item.variantSelections.map(v => (
                                  <span
                                    key={`${v.variantName}-${v.optionLabel}`}
                                    className="border border-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500"
                                  >
                                    {v.optionLabel}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center border border-zinc-200">
                              <button
                                onClick={() => remove(item.cartKey)}
                                disabled={item.quantity <= 1}
                                aria-label="Decrease quantity"
                                className="flex h-7 w-7 items-center justify-center text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent"
                              >
                                <Minus className="h-3 w-3" strokeWidth={2.5} />
                              </button>
                              <span className="w-8 border-x border-zinc-200 py-1.25 text-center text-xs font-medium text-zinc-900 tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => add(item, 1)}
                                disabled={item.quantity >= MAX_QTY}
                                aria-label="Increase quantity"
                                className="flex h-7 w-7 items-center justify-center text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent"
                              >
                                <Plus className="h-3 w-3" strokeWidth={2.5} />
                              </button>
                            </div>

                            <div className="text-right leading-none">
                              <p className="text-[15px] font-semibold tracking-tight text-zinc-900 tabular-nums">
                                {price(item.price * item.quantity)}
                              </p>
                              {item.quantity > 1 && (
                                <p className="mt-1 text-[10.5px] text-zinc-400 tabular-nums">
                                  {price(item.price)} each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Summary ──────────────────────────────────────────────── */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-zinc-200/60 bg-white px-5 pb-5 pt-4.5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-zinc-400">Subtotal</span>
                <span className="font-medium text-zinc-900 tabular-nums">{price(total)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-zinc-400">Delivery</span>
                {unlocked ? (
                  <span className="font-semibold text-emerald-600">Free</span>
                ) : (
                  <span className="text-zinc-400">Calculated at checkout</span>
                )}
              </div>
            </div>

            <div className="mt-3.5 flex items-baseline justify-between border-t border-dashed border-zinc-200 pt-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.11em] text-zinc-900">Total</span>
              <span className="text-[26px] font-semibold leading-none tracking-[-0.03em] text-zinc-900 tabular-nums">
                {price(total)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="group relative mt-4.5 flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden py-4.25 text-[14px] font-semibold tracking-[-0.01em] transition-all hover:brightness-[1.07] active:scale-[0.985]"
              style={{
                backgroundColor: primary,
                color: onPrimary,
                borderRadius: radius,
                boxShadow: `0 12px 28px -10px ${primary}80`,
              }}
            >
              {/* A hairline of light along the top edge — the detail that stops
                  a flat filled rectangle looking like a placeholder. */}
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-25"
                style={{ backgroundColor: onPrimary }}
              />
              Checkout
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="text-[11.5px] font-medium text-zinc-500 transition-colors hover:text-zinc-900"
              >
                Continue shopping
              </button>
              <span className="h-3 w-px bg-zinc-200" />
              {/* Only claims that hold for every shop on the platform. The old
                  copy promised "Free returns", which is not the merchant's
                  policy to make and not ours to print on their behalf. */}
              <span className="flex items-center gap-1 text-[11.5px] text-zinc-400">
                <Lock className="h-3 w-3" strokeWidth={2.5} />
                Secure checkout
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
