'use client'

import { useState, CSSProperties } from 'react'
import { useCart, CartVariantSelection } from './cart'
import { ShoppingCart, Check } from 'lucide-react'

interface AddToCartButtonProps {
  product: {
    id: string
    title: string
    price: number
    imageUrl?: string | null
  }
  variantSelections?: CartVariantSelection[]
  cartKey?: string
  style?: CSSProperties
  disabled?: boolean
  label?: string
  showIcon?: boolean
  isEditor?: boolean
}

export default function AddToCartButton({
  product,
  variantSelections,
  cartKey,
  style,
  disabled = false,
  label,
  showIcon = true,
  isEditor = false,
}: AddToCartButtonProps) {
  const { add } = useCart()
  const [isAdded, setIsAdded] = useState(false)

  const isSolid = !!(style?.backgroundColor && style.backgroundColor !== 'transparent')
  const isGhostBtn = !style?.border || style.border === 'none'
  const btnType = style ? (isSolid ? 'solid' : isGhostBtn ? 'ghost' : 'outline') : undefined

  const handleAdd = () => {
    if (isAdded || disabled || isEditor) return
    const key = cartKey ?? product.id
    add({
      cartKey: key,
      productId: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
      variantSelections,
    }, 1)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const btnLabel = label || 'Add to cart'

  return (
    <button
      type="button"
      style={style}
      onClick={handleAdd}
      disabled={(isAdded || disabled) && !isEditor}
      data-btn-type={btnType}
      className="group relative z-10 flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex h-5 items-center justify-center gap-2 overflow-hidden">
        {isAdded && !isEditor ? (
          <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
            <Check className="w-4 h-4" />
            <span>Added!</span>
          </div>
        ) : disabled && !isEditor ? (
          <div className="flex items-center gap-2">
            {showIcon && <ShoppingCart className="w-4 h-4" />}
            <span>Out of Stock</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {showIcon && <ShoppingCart className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
            <span>{btnLabel}</span>
          </div>
        )}
      </div>
      {!disabled && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={isSolid
            ? { backgroundColor: 'rgba(255,255,255,0.18)' }
            : { backgroundColor: style?.color ? `${style.color}12` : 'rgba(0,0,0,0.05)' }
          }
        />
      )}
    </button>
  )
}
