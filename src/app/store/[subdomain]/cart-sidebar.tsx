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
 * The throw runs in two phases, and they cannot be one animation: the product
 * arcs up out of the card, which needs the row NOT to clip its contents, while
 * closing the gap afterwards needs it to clip. So the row only starts clipping
 * once the product is already in the bin.
 */
const FLIGHT_MS = 560
const COLLAPSE_MS = 240

/**
 * Drawn by hand rather than taken from lucide because the lid has to move on
 * its own: it is a separate group, hinged at the right of the rim so the left
 * end is what lifts, while the can stays put.
 */
function TrashIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="trash-icon"
      overflow="visible"
      data-open={open ? 'true' : undefined}
      aria-hidden="true"
    >
      <g className="trash-lid">
        <path d="M3 6h18" />
        <path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6" />
      </g>
      <path d="M5.6 8.5 6.4 20a1.7 1.7 0 0 0 1.7 1.6h7.8a1.7 1.7 0 0 0 1.7-1.6l.8-11.5" />
    </svg>
  )
}

export default function CartSidebar({ themeStyle, subdomain }: CartSidebarProps) {
  const storeBase = useStoreBase()
  const price = usePrice()
  const { items, total, remove, removeItemCompletely, add, clear, isOpen, setIsOpen } = useCart()
  const router = useRouter()

  const primary = themeStyle?.primaryColor ?? '#0a0a0a'
  const radius = themeStyle?.borderRadius ?? '0.75rem'
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

  // Lines mid-throw. They stay in the cart until the animation finishes, so
  // the row has something to animate — deleting on click unmounts it in flight.
  const [dropping, setDropping] = useState<string[]>([])
  const [collapsing, setCollapsing] = useState<string[]>([])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function dropInBin(cartKey: string) {
    if (dropping.includes(cartKey)) return

    // Somebody who has asked the OS for less movement gets the row gone at
    // once, rather than a stripped-back version of the same wait.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      removeItemCompletely(cartKey)
      return
    }

    setDropping(prev => [...prev, cartKey])
    timers.current.push(
      setTimeout(() => setCollapsing(prev => [...prev, cartKey]), FLIGHT_MS),
      setTimeout(() => {
        removeItemCompletely(cartKey)
        setDropping(prev => prev.filter(k => k !== cartKey))
        setCollapsing(prev => prev.filter(k => k !== cartKey))
      }, FLIGHT_MS + COLLAPSE_MS),
    )
  }

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
        // Panel is a shade off-white so the white item cards inside it read as
        // raised surfaces. White-on-white is what made this look unstyled.
        className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-zinc-50 sm:w-[27.5rem]"
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
        <div className="shrink-0 border-b border-zinc-200/70 bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[17px] font-semibold tracking-tight text-zinc-900">
                Your cart
              </h2>
              {itemCount > 0 && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 tabular-nums">
                  {itemCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {items.length > 0 && (
                <button
                  onClick={clear}
                  className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close cart"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-900 active:scale-95"
              >
                <X className="h-[17px] w-[17px]" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Items ────────────────────────────────────────────────── */}
        <div className="relative min-h-0 flex-1">
          {/* Cards dissolve under the header and summary rather than being
              sliced off by a hard edge. Matched to the panel, not white. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-linear-to-b from-zinc-50 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-linear-to-t from-zinc-50 to-transparent" />

          <div className="hide-scrollbar h-full overflow-y-auto px-4 py-4">
            {/* Free-delivery nudge. Hidden entirely when the shop has no
                "free over X" rate, rather than showing an empty bar. */}
            {items.length > 0 && threshold && (
              <div
                className={`mb-3 rounded-2xl border p-3.5 transition-colors ${
                  unlocked
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : 'border-zinc-200/70 bg-white'
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
              <div className="flex h-full flex-col items-center justify-center gap-5 py-10 text-center">
                <div
                  className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full ring-1 ring-inset ring-zinc-900/5"
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
                  className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 transition-all hover:ring-zinc-900 hover:text-zinc-900 active:scale-[0.98]"
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {items.map((item, i) => {
                  const isDropping = dropping.includes(item.cartKey)
                  const isCollapsing = collapsing.includes(item.cartKey)
                  return (
                    <li
                      key={item.cartKey}
                      className={`cart-item-in group relative rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_2px_rgba(9,9,11,0.04)] transition-shadow hover:border-zinc-300/80 hover:shadow-[0_2px_10px_-2px_rgba(9,9,11,0.10)] ${
                        isDropping ? 'cart-row-flying' : ''
                      } ${isCollapsing ? 'cart-row-collapse' : ''}`}
                      style={
                        isDropping ? undefined : { animationDelay: `${Math.min(i, 6) * 45}ms` }
                      }
                    >
                      {/* Sits outside the animated wrapper below: the bin has
                          to hold still while the product is thrown into it. */}
                      <button
                        onClick={() => dropInBin(item.cartKey)}
                        aria-label={`Remove ${item.title}`}
                        className={`trash-btn absolute right-2 top-2 z-10 rounded-lg p-1.5 transition-all hover:bg-red-50 hover:text-red-500 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 ${
                          isDropping
                            ? 'text-red-500 opacity-100'
                            : 'text-zinc-300 opacity-100 sm:opacity-0'
                        }`}
                      >
                        <TrashIcon open={isDropping} />
                      </button>

                      <div
                        className={`flex gap-3.5 p-3 ${
                          isDropping ? 'cart-toss-to-bin' : ''
                        }`}
                      >
                        <div
                          className="relative shrink-0 overflow-hidden border border-zinc-200 bg-zinc-100"
                          style={{ borderRadius: radius, width: 78, height: 78 }}
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

                        <div className="flex min-w-0 flex-1 flex-col">
                          {/* Right padding keeps the title clear of the bin,
                              which is positioned over this column. */}
                          <div className="min-w-0 pr-7">
                            <p className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-zinc-900">
                              {item.title}
                            </p>
                            {item.variantSelections && item.variantSelections.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {item.variantSelections.map(v => (
                                  <span
                                    key={`${v.variantName}-${v.optionLabel}`}
                                    className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500"
                                  >
                                    {v.optionLabel}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
                            <div className="flex items-center rounded-full bg-zinc-100 p-0.5">
                              <button
                                onClick={() => remove(item.cartKey)}
                                disabled={item.quantity <= 1 || isDropping}
                                aria-label="Decrease quantity"
                                className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-zinc-500 transition-all hover:bg-white hover:text-zinc-900 hover:shadow-sm active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
                              >
                                <Minus className="h-3 w-3" strokeWidth={2.5} />
                              </button>
                              <span className="w-6 text-center text-xs font-semibold text-zinc-900 tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => add(item, 1)}
                                disabled={item.quantity >= MAX_QTY || isDropping}
                                aria-label="Increase quantity"
                                className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-zinc-500 transition-all hover:bg-white hover:text-zinc-900 hover:shadow-sm active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
                              >
                                <Plus className="h-3 w-3" strokeWidth={2.5} />
                              </button>
                            </div>

                            <div className="text-right">
                              {item.quantity > 1 && (
                                <p className="text-[10.5px] text-zinc-400 tabular-nums">
                                  {price(item.price)} each
                                </p>
                              )}
                              <p className="text-[13.5px] font-semibold text-zinc-900 tabular-nums">
                                {price(item.price * item.quantity)}
                              </p>
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
          <div className="shrink-0 border-t border-zinc-200/70 bg-white px-5 pb-5 pt-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Subtotal</span>
                <span className="font-medium text-zinc-900 tabular-nums">{price(total)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Delivery</span>
                {unlocked ? (
                  <span className="font-semibold text-emerald-600">Free</span>
                ) : (
                  <span className="text-zinc-400">Calculated at checkout</span>
                )}
              </div>
            </div>

            <div className="mt-3.5 flex items-baseline justify-between border-t border-dashed border-zinc-200 pt-3.5">
              <span className="text-[13px] font-semibold text-zinc-900">Total</span>
              <span className="text-[22px] font-semibold leading-none tracking-tight text-zinc-900 tabular-nums">
                {price(total)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="group relative mt-4 flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden py-[15px] text-[13.5px] font-semibold tracking-tight transition-all hover:brightness-[1.07] active:scale-[0.985]"
              style={{
                backgroundColor: primary,
                color: onPrimary,
                borderRadius: radius,
                boxShadow: `0 10px 26px -10px ${primary}80`,
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
