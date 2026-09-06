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
  /** Renders as a compact square/round chip with no label — used on the image. */
  iconOnly?: boolean
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
  iconOnly = false,
  isEditor = false,
}: AddToCartButtonProps) {
  const { add } = useCart()
  const [isAdded, setIsAdded] = useState(false)
  const [hover, setHover] = useState(false)

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

  // Solid lifts a shade; outline fills with its own colour and flips the text.
  // Both beat a translucent white wash, which greys out a black button.
  const hoverStyle: CSSProperties =
    !hover || disabled || isAdded
      ? {}
      : isSolid
      ? { filter: 'brightness(1.35)' }
      : { backgroundColor: style?.color, color: '#ffffff', borderColor: style?.color }

  return (
    <button
      type="button"
      style={{ ...style, ...hoverStyle }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={handleAdd}
      disabled={(isAdded || disabled) && !isEditor}
      data-btn-type={btnType}
      aria-label={iconOnly ? btnLabel : undefined}
      className={`group relative z-10 flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-300 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
        iconOnly ? 'shadow-lg' : 'w-full px-6 py-3'
      }`}
    >
      <div className={`flex items-center justify-center gap-2 overflow-hidden ${iconOnly ? '' : 'h-5'}`}>
        {isAdded && !isEditor ? (
          <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
            <Check className="w-4 h-4" />
            {!iconOnly && <span>Added!</span>}
          </div>
        ) : disabled && !isEditor ? (
          <div className="flex items-center gap-2">
            {showIcon && <ShoppingCart className="w-4 h-4" />}
            {!iconOnly && <span>Out of Stock</span>}
          </div>
        ) : (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {showIcon && <ShoppingCart className={`transition-transform duration-300 ${iconOnly ? 'w-4 h-4' : 'w-3.5 h-3.5 group-hover:translate-x-0.5'}`} />}
            {!iconOnly && <span>{btnLabel}</span>}
          </div>
        )}
      </div>
    </button>
  )
}
