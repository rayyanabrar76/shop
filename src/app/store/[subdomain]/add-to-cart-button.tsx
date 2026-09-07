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
  /**
   * Icon at rest, widening to icon + label when the card is hovered. Only the
   * label collapses, never the icon, so the control never disappears and the
   * hit target never drops below the icon's own size.
   */
  expandOnHover?: boolean
  /** Replaces the default trolley. Used for the quick-add disc on a card. */
  icon?: React.ReactNode
  /** Extra classes. Inline styles cannot express breakpoints, and the
      quick-add chip needs a different size on a phone. */
  className?: string
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
  expandOnHover = false,
  icon,
  className = '',
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

  /**
   * The full-width button is quiet at rest and fills on hover.
   *
   * A solid slab under every product competes with the photography — eight of
   * them turn a grid into a wall of black. So at rest it is the label in the
   * shop's own colour over a hairline rule, and the fill only arrives when the
   * shopper is actually pointing at it.
   *
   * The merchant's two colours still drive it, just swapped: their background
   * colour becomes the resting ink, and their text colour is what the label
   * flips to once the fill lands.
   */
  const quiet = !iconOnly && !expandOnHover && isSolid
  const ink = style?.backgroundColor as string | undefined
  const onInk = (style?.color as string | undefined) ?? '#ffffff'

  const restStyle: CSSProperties = quiet
    ? {
        ...style,
        backgroundColor: 'transparent',
        color: ink,
        boxShadow: `inset 0 -1px 0 ${ink}26`,
      }
    : (style ?? {})

  // Solid lifts a shade and rises; outline fills with its own colour and flips
  // the text. Both beat a translucent white wash, which greys out a black
  // button.
  //
  // brightness(1.35) was too much: on a black button it washed to a flat grey,
  // which reads as the button being disabled rather than pointed at.
  const hoverStyle: CSSProperties =
    !hover || disabled || isAdded
      ? {}
      : quiet
      ? {
          backgroundColor: ink,
          color: onInk,
          boxShadow: `inset 0 -1px 0 ${ink}, 0 6px 16px -8px rgba(9,9,11,0.35)`,
        }
      : isSolid
      ? {
          filter: 'brightness(1.12)',
          transform: 'translateY(-1px)',
          boxShadow: '0 6px 16px -6px rgba(9,9,11,0.4)',
        }
      : { backgroundColor: style?.color, color: '#ffffff', borderColor: style?.color }

  return (
    <button
      type="button"
      style={{ ...restStyle, ...hoverStyle }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={handleAdd}
      disabled={(isAdded || disabled) && !isEditor}
      data-btn-type={btnType}
      // Names the product, not just the action. A grid of eight buttons all
      // announcing "Add" tells a screen-reader user nothing about which one
      // they are on.
      aria-label={iconOnly ? `${btnLabel} ${product.title} to cart` : undefined}
      className={`group relative z-10 flex items-center justify-center gap-2 transition-all duration-300 ease-out active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60 ${className} ${
        expandOnHover
          ? 'group/add text-sm font-semibold'
          : iconOnly
          ? 'shadow-lg text-sm font-semibold'
          : // Small caps on a wide track, the register the rest of an editorial
            // storefront is set in. 14px semibold sentence case is the default
            // every framework ships with, which is exactly why it looked
            // untouched.
            'w-full overflow-hidden px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em]'
      }`}
    >
      {/* The detail that separates a designed button from a filled
          rectangle: a single pixel of the label's own colour along the top
          edge, at low opacity, so the surface reads as lit from above.
          Solid fills only — on an outline button there is nothing to light. */}
      {!iconOnly && !expandOnHover && isSolid && !quiet && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-20"
          style={{ backgroundColor: style?.color }}
        />
      )}

      {/* gap-0 while expanding: a flex gap is reserved even when the label it
          separates has collapsed to zero width, which left the "circle" 11px
          wider than it was tall. The label supplies its own margin as it
          opens instead. */}
      <div
        className={`flex items-center justify-center overflow-hidden ${
          expandOnHover ? 'gap-0' : 'gap-2'
        } ${iconOnly ? '' : 'h-5'}`}
      >
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
          <div
            className={`flex items-center animate-in fade-in slide-in-from-top-2 duration-300 ${
              expandOnHover ? 'gap-0' : 'gap-2'
            }`}
          >
            {showIcon &&
              (icon ?? (
                <ShoppingCart
                  className={`shrink-0 transition-transform duration-300 ${
                    iconOnly ? 'w-4 h-4' : 'w-3.5 h-3.5 group-hover:-translate-y-px group-hover:scale-110'
                  }`}
                />
              ))}
            {expandOnHover ? (
              /* max-width, not display: width is animatable and display is
                 not, so the pill grows rather than snapping open. Scoped to the
                 button's own group — the card revealing the disc and the disc
                 revealing its label are two separate steps. */
              <span className="max-w-0 overflow-hidden whitespace-nowrap text-[12px] font-semibold opacity-0 transition-all duration-300 ease-out group-hover/add:ml-1 group-hover/add:max-w-20 group-hover/add:opacity-100">
                {btnLabel}
              </span>
            ) : (
              !iconOnly && <span>{btnLabel}</span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}
