'use client'

import { useEffect, useState } from 'react'
import AddToCartButton from '../../add-to-cart-button'
import { Package, ChevronLeft, ChevronRight, Star, Minus, Plus, Truck, RotateCcw, ShieldCheck, X, ZoomIn } from 'lucide-react'
import { usePrice } from '@/components/CurrencyProvider'

interface VariantOption {
  id: string
  label: string
  priceOverride: number | null
  inventory: number
}

interface Variant {
  id: string
  name: string
  options: VariantOption[]
}

interface ProductDetailClientProps {
  product: {
    id: string
    title: string
    description: string | null
    price: number
    inventory: number
    imageUrl: string | null
    sku: string | null
    category: string | null
    images: { url: string; alt: string }[]
    variants: Variant[]
  }
  theme: {
    primary: string
    radius: string
    buttonStyle: string
    textColor: string
  }
  /** Published reviews only, so the summary matches what is on the page. */
  rating?: { average: number; count: number }
  /** Shown in the reassurance row when the shop has set them up. */
  shipping?: { label: string; detail: string } | null
}

/** Below this the shop says how many are left, above it it stays quiet. */
const LOW_STOCK = 8

export default function ProductDetailClient({ product, theme, rating, shipping }: ProductDetailClientProps) {
  const price = usePrice()
  const { primary, radius, buttonStyle } = theme

  const [activeImage, setActiveImage] = useState(0)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [qty, setQty] = useState(1)
  const [zoomed, setZoomed] = useState(false)

  const images = product.images.length > 0
    ? product.images
    : (product.imageUrl ? [{ url: product.imageUrl, alt: product.title }] : [])

  const allVariantsSelected = product.variants.length === 0 ||
    product.variants.every(v => selections[v.id])

  const selectedOptions = product.variants.map(v => {
    const optionId = selections[v.id]
    return v.options.find(o => o.id === optionId)
  }).filter(Boolean) as VariantOption[]

  const effectivePrice = selectedOptions.length > 0 && selectedOptions.some(o => o.priceOverride !== null)
    ? selectedOptions.reduce((p, o) => o.priceOverride !== null ? o.priceOverride : p, product.price)
    : product.price

  const variantInventory = selectedOptions.length > 0
    ? Math.min(...selectedOptions.map(o => o.inventory))
    : product.inventory

  const stock = product.variants.length > 0 ? variantInventory : product.inventory
  const outOfStock = allVariantsSelected && stock === 0

  // Never let the box ask for more than the shop can send. Adjusted during
  // render rather than in an effect: picking a variant with less stock must
  // bring the number down in the same pass, or the page paints a quantity it
  // is about to reject.
  const maxQty = Math.max(1, Math.min(stock || 1, 99))
  if (qty > maxQty) setQty(maxQty)

  const cartKey = product.id + (Object.values(selections).sort().join('-'))
  const variantSelections = product.variants
    .filter(v => selections[v.id])
    .map(v => {
      const opt = v.options.find(o => o.id === selections[v.id])
      return { variantName: v.name, optionLabel: opt?.label ?? '' }
    })

  // Escape closes the lightbox, and the page behind it must not scroll.
  useEffect(() => {
    if (!zoomed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false)
      if (e.key === 'ArrowLeft') setActiveImage(i => (i - 1 + images.length) % images.length)
      if (e.key === 'ArrowRight') setActiveImage(i => (i + 1) % images.length)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [zoomed, images.length])

  const buyDisabled = outOfStock || !allVariantsSelected

  const cartStyle = (full: boolean) => ({
    width: '100%',
    padding: full ? '15px 24px' : '13px 20px',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    borderRadius: radius,
    backgroundColor: outOfStock ? '#d4d4d8' : (buttonStyle === 'solid' ? primary : 'transparent'),
    color: buttonStyle === 'solid' ? '#fff' : primary,
    border: buttonStyle === 'ghost' ? 'none' : `2px solid ${outOfStock ? '#d4d4d8' : primary}`,
    cursor: buyDisabled ? 'not-allowed' : 'pointer',
    opacity: buyDisabled ? 0.6 : 1,
  })

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20">

        {/* ── Images ────────────────────────────────────────────────────── */}
        <div className="w-full md:sticky md:top-6 md:self-start">
          <div
            className="group relative w-full bg-zinc-100 overflow-hidden"
            style={{ borderRadius: radius, aspectRatio: '1 / 1' }}
          >
            {images.length > 0 ? (
              <button
                type="button"
                onClick={() => setZoomed(true)}
                className="block w-full h-full cursor-zoom-in"
                aria-label="View larger"
              >
                <img
                  src={images[activeImage].url}
                  alt={images[activeImage].alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                {/* Says the picture does something, without sitting on it. */}
                <span className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4" />
                </span>
              </button>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-zinc-300">
                <Package className="w-12 h-12" />
                <span className="text-sm font-medium">No image</span>
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage(i => (i - 1 + images.length) % images.length)}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveImage(i => (i + 1) % images.length)}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Which of how many, for a thumb that cannot hover. */}
                <span className="absolute left-3 bottom-3 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums md:hidden">
                  {activeImage + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 hide-scrollbar">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Image ${i + 1}`}
                  className="shrink-0 w-16 h-16 overflow-hidden border-2 transition-colors"
                  style={{ borderColor: activeImage === i ? primary : 'rgba(0,0,0,0.08)', borderRadius: radius }}
                >
                  <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Details ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <div>
            {product.category && (
              <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: primary }}>
                {product.category}
              </span>
            )}
            <h1 className="mt-1.5 text-[26px] md:text-4xl font-bold leading-[1.15] tracking-tight">
              {product.title}
            </h1>

            {/* The rating was loaded for the structured data and never shown.
                It belongs next to the name, where it is part of deciding. */}
            {rating && rating.count > 0 && (
              <a href="#reviews" className="mt-2 inline-flex items-center gap-2 group">
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star
                      key={n}
                      className="w-3.5 h-3.5"
                      style={{
                        fill: n <= Math.round(rating.average) ? primary : 'transparent',
                        color: n <= Math.round(rating.average) ? primary : 'rgba(0,0,0,0.22)',
                      }}
                    />
                  ))}
                </span>
                <span className="text-[12.5px] font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                  {rating.average.toFixed(1)} · {rating.count} review{rating.count === 1 ? '' : 's'}
                </span>
              </a>
            )}
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-[28px] md:text-3xl font-black tracking-tight">{price(effectivePrice)}</span>
            {outOfStock ? (
              <span className="text-[13px] font-semibold text-red-600">Out of stock</span>
            ) : allVariantsSelected && stock > 0 && stock <= LOW_STOCK ? (
              <span className="text-[13px] font-semibold text-amber-600">Only {stock} left</span>
            ) : null}
          </div>

          <div className="h-px bg-black/8" />

          {/* Variant selectors */}
          {product.variants.map(variant => {
            const chosen = variant.options.find(o => o.id === selections[variant.id])
            return (
              <div key={variant.id}>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2 opacity-55">
                  {variant.name}
                  {chosen && <span className="ml-1.5 font-semibold normal-case tracking-normal opacity-90">{chosen.label}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {variant.options.map(option => {
                    const selected = selections[variant.id] === option.id
                    const soldOut = option.inventory === 0
                    return (
                      <button
                        key={option.id}
                        onClick={() => !soldOut && setSelections(s => ({ ...s, [variant.id]: option.id }))}
                        disabled={soldOut}
                        className={`px-4 h-11 text-[13.5px] font-semibold border-2 transition-colors ${
                          selected
                            ? 'text-white'
                            : soldOut
                            ? 'border-black/6 text-zinc-300 line-through cursor-not-allowed'
                            : 'border-black/12 hover:border-black/35 cursor-pointer'
                        }`}
                        style={{ borderRadius: radius, ...(selected ? { backgroundColor: primary, borderColor: primary, color: '#fff' } : {}) }}
                      >
                        {option.label}
                        {option.priceOverride !== null && option.priceOverride !== product.price && (
                          <span className="ml-1 text-[11px] opacity-70">
                            {option.priceOverride > product.price ? '+' : ''}{price(option.priceOverride - product.price)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {!selections[variant.id] && (
                  <p className="text-[11.5px] opacity-45 mt-1.5">Choose a {variant.name.toLowerCase()}</p>
                )}
              </div>
            )
          })}

          {/* Quantity and buy. One row on a desk; the box never wraps below
              the button, because they are one decision. */}
          <div className="flex items-stretch gap-2.5 pt-1">
            <div
              className="flex items-center border-2 border-black/12 shrink-0"
              style={{ borderRadius: radius }}
            >
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Fewer"
                className="w-11 h-[52px] flex items-center justify-center disabled:opacity-25 transition-opacity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-[15px] font-bold tabular-nums">{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
                aria-label="More"
                className="w-11 h-[52px] flex items-center justify-center disabled:opacity-25 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <AddToCartButton
                product={{ id: product.id, title: product.title, price: effectivePrice, imageUrl: product.imageUrl }}
                variantSelections={variantSelections.length > 0 ? variantSelections : undefined}
                cartKey={cartKey}
                quantity={qty}
                style={cartStyle(true)}
                disabled={buyDisabled}
              />
            </div>
          </div>

          {/* What a shopper asks before buying, answered without them having
              to go and look for the policy page. */}
          <ul className="grid gap-2.5 pt-1">
            {shipping && (
              <Reassurance icon={<Truck className="w-4 h-4" />} primary={primary} title={shipping.label} note={shipping.detail} />
            )}
            <Reassurance icon={<RotateCcw className="w-4 h-4" />} primary={primary} title="Easy returns" note="Get in touch and we will sort it out." />
            <Reassurance icon={<ShieldCheck className="w-4 h-4" />} primary={primary} title="Secure checkout" note="Your details are sent securely." />
          </ul>

          {product.description && (
            <div className="pt-2">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-55 mb-2">Description</h2>
              {/* pre-wrap, so paragraphs the merchant typed survive. It used to
                  collapse into one grey block whatever they wrote. */}
              <p className="text-[14.5px] leading-[1.7] opacity-80 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {product.sku && (
            <p className="text-[11px] opacity-40 font-mono">SKU: {product.sku}</p>
          )}
        </div>
      </div>

      {/* ── The buy bar on a phone ────────────────────────────────────────
          The button is a long way up the page once the description and
          reviews are under it, and a shopper who has scrolled to the reviews
          is exactly the one who has decided. */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-md border-t border-black/8"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="min-w-0">
          <p className="text-[16px] font-black leading-none tabular-nums">{price(effectivePrice * qty)}</p>
          {qty > 1 && <p className="text-[11px] opacity-50 mt-0.5">{qty} × {price(effectivePrice)}</p>}
        </div>
        <div className="flex-1 min-w-0">
          <AddToCartButton
            product={{ id: product.id, title: product.title, price: effectivePrice, imageUrl: product.imageUrl }}
            variantSelections={variantSelections.length > 0 ? variantSelections : undefined}
            cartKey={cartKey}
            quantity={qty}
            style={cartStyle(false)}
            disabled={buyDisabled}
          />
        </div>
      </div>
      {/* Room for it, so the last line of the page is not under the bar. */}
      <div className="md:hidden h-20" aria-hidden />

      {/* ── Lightbox ──────────────────────────────────────────────────── */}
      {zoomed && images.length > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={() => setZoomed(false)}
            aria-label="Close"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <img
            src={images[activeImage].url}
            alt={images[activeImage].alt}
            onClick={e => e.stopPropagation()}
            className="max-h-full max-w-full object-contain"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setActiveImage(i => (i - 1 + images.length) % images.length) }}
                aria-label="Previous image"
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setActiveImage(i => (i + 1) % images.length) }}
                aria-label="Next image"
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white tabular-nums">
                {activeImage + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      )}
    </>
  )
}

function Reassurance({ icon, title, note, primary }: { icon: React.ReactNode; title: string; note: string; primary: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0" style={{ color: primary }}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-tight">{title}</span>
        <span className="block text-[12px] opacity-55 leading-tight mt-0.5">{note}</span>
      </span>
    </li>
  )
}
