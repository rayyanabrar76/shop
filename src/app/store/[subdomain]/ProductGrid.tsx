'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import AddToCartButton from './add-to-cart-button'
import { EditorItem } from './EditorHighlight'
import { usePrice } from '@/components/CurrencyProvider'
import { useStoreBase } from '@/components/StoreBaseProvider'

interface Product {
  id: string
  title: string
  description?: string | null
  price: number
  imageUrl?: string | null
  slug?: string | null
  category?: string | null
}

interface ThemeStyle {
  primaryColor: string
  borderRadius: string
  buttonStyle: string
  headingFont: string
  font?: string | null
  cardShadow?: string
  productImageRadius?: string
  featuredLabel?: string
  productTitleWidth?: string
  productTitleAlign?: string
  productTitlePreset?: string
  productTitleBg?: string
  productTitlePaddingTop?: number
  productTitlePaddingBottom?: number
  productTitlePaddingLeft?: number
  productTitlePaddingRight?: number
  productPricePreset?: string
  productPriceWidth?: string
  productPriceAlign?: string
  productPriceTextColor?: string
  productPricePaddingTop?: number
  productPricePaddingBottom?: number
  productPricePaddingLeft?: number
  productPricePaddingRight?: number
  cartBtnLabel?: string
  cartBtnBgColor?: string
  cartBtnTextColor?: string
  cartBtnDisplay?: string
  cartBtnShowIcon?: boolean
  cartBtnWidth?: string
  cartBtnFontSize?: number
  cartBtnPaddingTop?: number
  cartBtnPaddingBottom?: number
  cartBtnPaddingLeft?: number
  cartBtnPaddingRight?: number
}

interface ProductGridProps {
  products: Product[]
  theme: {
    layout?: string | null
    headingFont?: string | null
    borderRadius?: string | null
    primaryColor?: string | null
    buttonStyle?: string | null
    cardShadow?: string | null
  } | null
  subdomain: string
  themeStyle: ThemeStyle
  isEditor?: boolean
  onEdit?: (s: string) => void
  activeProductField?: string | null
}

function getCardShadow(style: string | null | undefined, primaryColor: string): React.CSSProperties {
  switch (style) {
    case 'soft':    return { boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }
    case 'lifted':  return { boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)' }
    case 'inset':   return { boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.07), inset 0 1px 2px rgba(0,0,0,0.04)' }
    case 'strong':  return { boxShadow: '0 8px 30px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)' }
    case 'glow':    return { boxShadow: `0 0 0 1px ${primaryColor}22, 0 4px 20px ${primaryColor}33` }
    default:        return {}
  }
}

const TITLE_SIZE: Record<string, React.CSSProperties> = {
  h1: { fontSize: '2.25rem', fontWeight: 900, lineHeight: 1.2 },
  h2: { fontSize: '1.875rem', fontWeight: 900, lineHeight: 1.25 },
  h3: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3 },
  h4: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.35 },
  h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
  h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
}

/**
 * Editorial defaults for the card text. Spread *before* the preset lookup, so
 * a merchant who picks a size in the theme editor still wins — these only fill
 * in the "default" preset, which maps to nothing.
 */
const TITLE_BASE: React.CSSProperties = {
  fontSize: '0.9375rem',
  fontWeight: 500,
  lineHeight: 1.45,
  letterSpacing: '0.005em',
}

const PRICE_BASE: React.CSSProperties = {
  letterSpacing: '0.01em',
}

const PRICE_SIZE: Record<string, React.CSSProperties> = {
  h1: { fontSize: '2.25rem', fontWeight: 900 },
  h2: { fontSize: '1.875rem', fontWeight: 900 },
  h3: { fontSize: '1.5rem', fontWeight: 700 },
  h4: { fontSize: '1.25rem', fontWeight: 800 },
  h5: { fontSize: '1rem', fontWeight: 900 },
  h6: { fontSize: '0.875rem', fontWeight: 900 },
}

function CardTitleLink({ isEditor, href, style, children }: {
  isEditor: boolean; href: string; style?: React.CSSProperties; children: React.ReactNode
}) {
  if (isEditor) return <span style={style}>{children}</span>
  return (
    <Link
      href={href}
      style={style}
      onClick={e => e.stopPropagation()}
      className="hover:underline underline-offset-2 line-clamp-2"
    >
      {children}
    </Link>
  )
}

const HIGHLIGHT: React.CSSProperties = {
  outline: '2px dashed #3b82f6',
  outlineOffset: '2px',
  borderRadius: '3px',
}

export default function ProductGrid({
  products, theme, subdomain, themeStyle, isEditor = false, onEdit, activeProductField,
}: ProductGridProps) {
  const storeBase = useStoreBase()
  const price = usePrice()
  const router = useRouter()
  const { primaryColor, borderRadius, buttonStyle, headingFont, featuredLabel, font } = themeStyle
  const fontFamily = font === 'serif' ? 'serif' : font === 'mono' ? 'monospace' : font ? font : undefined
  const cardShadow = themeStyle.cardShadow ?? theme?.cardShadow ?? 'none'
  const isList = theme?.layout === 'list'
  const shadowStyle = getCardShadow(cardShadow, primaryColor)
  // Card covers can opt out of the global curvature — squared-off images read
  // very differently from the buttons, which usually still want rounding.
  const imageRadius = themeStyle.productImageRadius || borderRadius
  // always = button always shown (default), hover = fades in on hover,
  // icon = no button, a cart chip on the image instead, hidden = neither.
  /**
   * Two modes, not four.
   *
   * "always" and "hover" both put a full-width button under every card, which
   * turns a grid of photographs into a wall of slabs — and "hover" additionally
   * relies on an affordance that does not exist on a phone. The chip does their
   * job without either problem, so both now resolve to it. Stores still holding
   * the old values keep working and simply get the chip.
   */
  const cartDisplay: 'icon' | 'hidden' =
    themeStyle.cartBtnDisplay === 'hidden' ? 'hidden' : 'icon'
  const notify = onEdit ?? (() => {})

  function navigateTo(handle: string) {
    if (!isEditor) router.push(`${storeBase}/products/${handle}`)
  }

  // — title computed style —
  const titlePreset = themeStyle.productTitlePreset || 'default'
  const titleStyle: React.CSSProperties = {
    ...TITLE_BASE,
    ...(TITLE_SIZE[titlePreset] ?? {}),
    textAlign: (themeStyle.productTitleAlign || 'left') as React.CSSProperties['textAlign'],
    ...(themeStyle.productTitleBg ? { backgroundColor: themeStyle.productTitleBg } : {}),
    padding: `${themeStyle.productTitlePaddingTop ?? 4}px ${themeStyle.productTitlePaddingRight ?? 0}px ${themeStyle.productTitlePaddingBottom ?? 0}px ${themeStyle.productTitlePaddingLeft ?? 0}px`,
    display: 'block',
    width: (themeStyle.productTitleWidth || 'fill') === 'fill' ? '100%' : 'fit-content',
  }

  // — price computed style —
  const pricePreset = themeStyle.productPricePreset || 'h6'
  const priceStyle: React.CSSProperties = {
    ...PRICE_BASE,
    ...(PRICE_SIZE[pricePreset] ?? { fontSize: '0.875rem', fontWeight: 900 }),
    textAlign: (themeStyle.productPriceAlign || 'left') as React.CSSProperties['textAlign'],
    ...(themeStyle.productPriceTextColor ? { color: themeStyle.productPriceTextColor } : {}),
    padding: `${themeStyle.productPricePaddingTop ?? 0}px ${themeStyle.productPricePaddingRight ?? 0}px ${themeStyle.productPricePaddingBottom ?? 0}px ${themeStyle.productPricePaddingLeft ?? 0}px`,
    display: 'block',
    width: (themeStyle.productPriceWidth || 'fit') === 'fill' ? '100%' : 'fit-content',
  }

  // — cart button computed style —
  // Blank falls back to the grid button colour, so existing stores are
  // unchanged; setting one overrides just this button.
  const cartBg = themeStyle.cartBtnBgColor || primaryColor
  const cartFg = themeStyle.cartBtnTextColor || '#fff'
  const cartBtnStyle: React.CSSProperties = {
    backgroundColor: buttonStyle === 'solid' ? cartBg : 'transparent',
    color: buttonStyle === 'solid' ? cartFg : cartBg,
    border: buttonStyle === 'ghost' ? 'none' : `1.5px solid ${cartBg}`,
    borderRadius,
    fontSize: themeStyle.cartBtnFontSize ? `${themeStyle.cartBtnFontSize}px` : '10px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    padding: `${themeStyle.cartBtnPaddingTop ?? 5}px ${themeStyle.cartBtnPaddingRight ?? 0}px ${themeStyle.cartBtnPaddingBottom ?? 5}px ${themeStyle.cartBtnPaddingLeft ?? 0}px`,
  }

  const titleHighlight = isEditor && activeProductField === 'product-title' ? HIGHLIGHT : {}
  const priceHighlight = isEditor && activeProductField === 'product-price' ? HIGHLIGHT : {}
  const cartHighlight  = isEditor && activeProductField === 'add-to-cart-btn' ? HIGHLIGHT : {}

  return (
    <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl mx-auto w-full" id="products">

      {/* Section heading */}
      <div className="mb-7 flex items-center gap-2">
        <div className="h-4 w-1 rounded-full" style={{ backgroundColor: primaryColor }} />
        <EditorItem section="products" field="featured-label" label="Section heading" isEditor={isEditor} onEdit={notify}>
          <h2
            className="text-base font-bold uppercase tracking-widest"
            style={{ fontFamily: headingFont === 'serif' ? 'serif' : 'inherit' }}
          >
            {featuredLabel || 'Featured Products'}
          </h2>
        </EditorItem>
      </div>

      {(products.length > 0 || isEditor) ? (
        <div
          className={
            isList
              ? 'flex flex-col gap-3 max-w-lg'
              : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-9 sm:gap-x-6 sm:gap-y-10'
          }
        >
          {products.map((p) => (
            isList ? (
              /* ── LIST layout ── */
              <EditorItem key={p.id} section="products" field="layout" label="Card layout" isEditor={isEditor} onEdit={notify} block>
              <div
                className="relative flex gap-4 border bg-white p-3 transition-shadow cursor-pointer"
                style={{ borderRadius, ...shadowStyle, borderColor: 'var(--store-card-border, #e4e4e7)', ...(fontFamily ? { fontFamily } : {}) }}
                onClick={() => navigateTo(p.slug || p.id)}
              >
                {isEditor && (
                  <button
                    onClick={e => { e.stopPropagation(); window.parent.postMessage({ type: 'edit-product', productId: p.id }, '*') }}
                    className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 text-white text-[10px] font-bold hover:bg-zinc-700 transition-colors"
                  >
                    <Pencil className="w-2.5 h-2.5" /> Edit
                  </button>
                )}
                <div className="w-20 h-20 shrink-0 bg-zinc-100 overflow-hidden" style={{ borderRadius: imageRadius }}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs">—</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <div style={titleHighlight}>
                      <EditorItem section="products" field="product-title" label="Product Title" isEditor={isEditor} onEdit={notify} block>
                        <CardTitleLink isEditor={isEditor} href={`${storeBase}/products/${p.slug || p.id}`} style={titleStyle}>
                          {p.title}
                        </CardTitleLink>
                      </EditorItem>
                    </div>
                    {p.description && <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{p.description}</p>}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div style={priceHighlight}>
                      <EditorItem section="products" field="product-price" label="Price" isEditor={isEditor} onEdit={notify}>
                        <span style={priceStyle}>{price(p.price)}</span>
                      </EditorItem>
                    </div>
                    <div style={cartHighlight} onClick={e => e.stopPropagation()}>
                      <EditorItem section="products" field="add-to-cart-btn" label="Cart Button" isEditor={isEditor} onEdit={notify} block>
                        <AddToCartButton
                          product={{ id: p.id, title: p.title, price: p.price, imageUrl: p.imageUrl }}
                          label={themeStyle.cartBtnLabel}
                          showIcon={themeStyle.cartBtnShowIcon}
                          isEditor={isEditor}
                          style={cartBtnStyle}
                        />
                      </EditorItem>
                    </div>
                  </div>
                </div>
              </div>
              </EditorItem>
            ) : (
              /* ── GRID layout ── */
              <EditorItem key={p.id} section="products" field="layout" label="Card layout" isEditor={isEditor} onEdit={notify} block>
              <div
                className="group flex flex-col cursor-pointer"
                style={fontFamily ? { fontFamily } : undefined}
                onClick={() => navigateTo(p.slug || p.id)}
              >
                {/* The card has no frame of its own — the image is the object,
                    sitting on the page. Theme radius and shadow move onto it so
                    both settings still read. */}
                <div
                  className="relative shrink-0 overflow-hidden bg-zinc-50"
                  style={{
                    borderRadius: imageRadius,
                    // A hairline keeps white-background product shots from
                    // floating on a white page. Uses the same var as the rest
                    // of the storefront so dark mode inverts it.
                    border: '1px solid var(--store-card-border, #e7e7e7)',
                    ...shadowStyle,
                    aspectRatio: '1 / 1',
                  }}
                >
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-200">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                  {isEditor && (
                    <button
                      onClick={e => { e.stopPropagation(); window.parent.postMessage({ type: 'edit-product', productId: p.id }, '*') }}
                      className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 text-white text-[10px] font-bold hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="w-2.5 h-2.5" /> Edit
                    </button>
                  )}

                  {/* Icon mode: a quiet chip on the image instead of a button
                      under the card. Slides up on hover on desktop; on touch,
                      where there is no hover, it stays put. */}
                  {cartDisplay === 'icon' && (
                    <div
                      className="absolute bottom-3 right-3 z-10 transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(.22,1,.36,1)] md:opacity-0 md:translate-y-1.5 md:group-hover:opacity-100 md:group-hover:translate-y-0"
                      style={cartHighlight}
                      onClick={e => e.stopPropagation()}
                    >
                      <EditorItem section="products" field="add-to-cart-btn" label="Cart Button" isEditor={isEditor} onEdit={notify}>
                        <AddToCartButton
                          product={{ id: p.id, title: p.title, price: p.price, imageUrl: p.imageUrl }}
                          label="Add"
                          showIcon
                          iconOnly
                          expandOnHover
                          icon={<BagPlus />}
                          isEditor={isEditor}
                          style={{
                            // Deliberately not the theme's cart colour. A solid
                            // brand-coloured square sat on the photograph like
                            // a sticker; a light pill reads as chrome floating
                            // over the image, which is what it is.
                            backgroundColor: '#ffffff',
                            color: '#18181b',
                            // A hairline of the button's own ink keeps the chip
                            // legible where it lands on a pale part of a photo
                            // — a white chip on a white plate has no edge.
                            border: '1px solid #e3e3e6',
                            // Always a pill, even on a square theme: the shape
                            // is what lets it grow sideways into a label
                            // without looking like a box being stretched.
                            borderRadius: '9999px',
                            // Square rather than padded: padding alone let the
                            // icon's own metrics decide the size, so the chip
                            // came out slightly off-square and small.
                            // Height, min-width and padding are one sum: the
                            // disc is only round while minWidth equals height,
                            // and height is the icon plus its padding either
                            // side. Change one and the circle turns into an
                            // egg — which is exactly what happened at 36.
                            height: 42,
                            minWidth: 42,
                            // 21px icon + 2 x 9.5px padding + 2 x 1px border
                            // = the 42px height exactly. minWidth alone will
                            // not hold it round: content wider than minWidth
                            // simply wins.
                            padding: '0 9.5px',
                            // Three layers: a tight shadow to lift it off the
                            // photograph, a wide soft one for depth, and an
                            // inset hairline of its own label colour so the
                            // shape still has an edge when it lands on a dark
                            // part of an image. shadow-lg alone read as a grey
                            // smudge on light product photography.
                            boxShadow: '0 1px 2px rgba(9,9,11,0.06)',
                          }}
                        />
                      </EditorItem>
                    </div>
                  )}
                </div>

                <div className="pt-3.5 flex flex-col gap-1.5 flex-1">
                  {p.category && (
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400 leading-none">
                      {p.category}
                    </span>
                  )}
                  <div style={{ ...titleHighlight, minHeight: '2.9em' }}>
                    <EditorItem section="products" field="product-title" label="Product Title" isEditor={isEditor} onEdit={notify} block>
                      <CardTitleLink isEditor={isEditor} href={`${storeBase}/products/${p.slug || p.id}`} style={titleStyle}>
                        {p.title}
                      </CardTitleLink>
                    </EditorItem>
                  </div>
                  <div style={priceHighlight}>
                    <EditorItem section="products" field="product-price" label="Price" isEditor={isEditor} onEdit={notify}>
                      <span style={{ ...priceStyle, paddingTop: priceStyle.paddingTop ?? 0 }}>
                        {price(p.price)}
                      </span>
                    </EditorItem>
                  </div>
                </div>
              </div>
              </EditorItem>
            )
          ))}

          {/* Add Product card — only visible in editor */}
          {isEditor && (
            isList ? (
              <button
                onClick={() => window.parent.postMessage({ type: 'add-product' }, '*')}
                className="flex gap-4 border-2 border-dashed border-zinc-300 bg-white p-3 items-center justify-center transition-colors hover:border-zinc-400 hover:bg-zinc-50 cursor-pointer"
                style={{ borderRadius }}
              >
                <Plus className="w-5 h-5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-400">Add Product</span>
              </button>
            ) : (
              <button
                onClick={() => window.parent.postMessage({ type: 'add-product' }, '*')}
                className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-zinc-300 bg-white transition-colors hover:border-zinc-400 hover:bg-zinc-50 cursor-pointer"
                style={{ borderRadius, minHeight: 200 }}
              >
                <Plus className="w-6 h-6 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-400">Add Product</span>
              </button>
            )
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
          <p className="text-zinc-400 text-sm">No products yet.</p>
        </div>
      )}
    </main>
  )
}

/**
 * A shopping bag with a plus — the quick-add mark, rather than the trolley
 * that means "go to checkout". Drawn here because icon sets ship a bag and a
 * plus separately, and overlaying two of them leaves the plus fighting the
 * bag's outline instead of sitting in a notch cut for it.
 */
function BagPlus() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M9 9.4V7.2a3 3 0 0 1 6 0v2.2" />
      <path d="M6 9.4h12v8.4a2.4 2.4 0 0 1-2.4 2.4H8.4A2.4 2.4 0 0 1 6 17.8z" />
      <path d="M12 13.2v4.2M9.9 15.3h4.2" />
    </svg>
  )
}
