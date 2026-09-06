'use client'

import { useState } from 'react'
import AddToCartButton from '../../add-to-cart-button'
import { Package, Tag, ChevronLeft, ChevronRight } from 'lucide-react'
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
    images: string[]
    variants: Variant[]
  }
  theme: {
    primary: string
    radius: string
    buttonStyle: string
    textColor: string
  }
}

export default function ProductDetailClient({ product, theme }: ProductDetailClientProps) {
  const price = usePrice()
  const { primary, radius, buttonStyle } = theme

  const [activeImage, setActiveImage] = useState(0)
  const [selections, setSelections] = useState<Record<string, string>>({})

  const images = product.images.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : [])

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

  const outOfStock = allVariantsSelected && (product.variants.length > 0 ? variantInventory === 0 : product.inventory === 0)

  const cartKey = product.id + (Object.values(selections).sort().join('-'))
  const variantSelections = product.variants
    .filter(v => selections[v.id])
    .map(v => {
      const opt = v.options.find(o => o.id === selections[v.id])
      return { variantName: v.name, optionLabel: opt?.label ?? '' }
    })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">

      {/* Images */}
      <div className="w-full">
        <div className="relative w-full bg-zinc-100 overflow-hidden" style={{ borderRadius: radius, aspectRatio: '1 / 1' }}>
          {images.length > 0 ? (
            <img src={images[activeImage]} alt={product.title} className="w-full h-full object-cover" />
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
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow hover:bg-white transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveImage(i => (i + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow hover:bg-white transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all"
                style={{ borderColor: activeImage === i ? primary : 'transparent' }}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col justify-center gap-6">
        {product.category && (
          <div className="flex items-center gap-1.5">
            <Tag className="w-3 h-3" style={{ color: primary }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: primary }}>
              {product.category}
            </span>
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">{product.title}</h1>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black">{price(effectivePrice)}</span>
          {outOfStock && <span className="text-sm font-semibold text-red-500">Out of stock</span>}
        </div>

        <div className="h-px bg-black/5" />

        {/* Variant selectors */}
        {product.variants.map(variant => (
          <div key={variant.id}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2 opacity-50">{variant.name}</p>
            <div className="flex flex-wrap gap-2">
              {variant.options.map(option => {
                const selected = selections[variant.id] === option.id
                const soldOut = option.inventory === 0
                return (
                  <button
                    key={option.id}
                    onClick={() => !soldOut && setSelections(s => ({ ...s, [variant.id]: option.id }))}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      selected
                        ? 'text-white'
                        : soldOut
                        ? 'border-zinc-100 text-zinc-300 line-through cursor-not-allowed'
                        : 'border-zinc-200 hover:border-zinc-400 cursor-pointer'
                    }`}
                    style={selected ? { backgroundColor: primary, borderColor: primary, color: '#fff' } : {}}
                  >
                    {option.label}
                    {option.priceOverride !== null && option.priceOverride !== product.price && (
                      <span className="ml-1 text-[10px] opacity-70">
                        {option.priceOverride > product.price ? '+' : ''}{price(option.priceOverride - product.price)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {!selections[variant.id] && (
              <p className="text-[10px] text-zinc-400 mt-1">Please select a {variant.name.toLowerCase()}</p>
            )}
          </div>
        ))}

        {product.description && (
          <p className="text-sm leading-relaxed opacity-60">{product.description}</p>
        )}

        {product.sku && (
          <p className="text-xs opacity-40 font-mono">SKU: {product.sku}</p>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <AddToCartButton
            product={{ id: product.id, title: product.title, price: effectivePrice, imageUrl: product.imageUrl }}
            variantSelections={variantSelections.length > 0 ? variantSelections : undefined}
            cartKey={cartKey}
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              borderRadius: '0.5rem',
              backgroundColor: outOfStock ? '#d4d4d8' : (buttonStyle === 'solid' ? primary : 'transparent'),
              color: buttonStyle === 'solid' ? '#fff' : primary,
              border: buttonStyle === 'ghost' ? 'none' : `2px solid ${outOfStock ? '#d4d4d8' : primary}`,
              cursor: (outOfStock || !allVariantsSelected) ? 'not-allowed' : 'pointer',
              opacity: (outOfStock || !allVariantsSelected) ? 0.6 : 1,
            }}
            disabled={outOfStock || !allVariantsSelected}
          />
          {!outOfStock && allVariantsSelected && (
            <p className="text-xs text-center opacity-40">
              {product.variants.length > 0 ? variantInventory : product.inventory} left in stock
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
