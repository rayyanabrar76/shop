'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import AddToCartButton from './add-to-cart-button'
import { EditorItem } from './EditorHighlight'
import { usePrice } from '@/components/CurrencyProvider'

interface Product {
  id: string
  title: string
  description?: string | null
  price: number
  imageUrl?: string | null
  category?: string | null
}

interface ThemeStyle {
  primaryColor: string
  borderRadius: string
  buttonStyle: string
  headingFont: string
  font?: string | null
  cardShadow?: string
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
      className="hover:underline underline-offset-2"
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
  const price = usePrice()
  const router = useRouter()
  const { primaryColor, borderRadius, buttonStyle, headingFont, featuredLabel, font } = themeStyle
  const fontFamily = font === 'serif' ? 'serif' : font === 'mono' ? 'monospace' : font ? font : undefined
  const cardShadow = themeStyle.cardShadow ?? theme?.cardShadow ?? 'none'
  const isList = theme?.layout === 'list'
  const shadowStyle = getCardShadow(cardShadow, primaryColor)
  const notify = onEdit ?? (() => {})

  function navigateTo(id: string) {
    if (!isEditor) router.push(`/store/${subdomain}/products/${id}`)
  }

  // — title computed style —
  const titlePreset = themeStyle.productTitlePreset || 'default'
  const titleStyle: React.CSSProperties = {
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
    ...(PRICE_SIZE[pricePreset] ?? { fontSize: '0.875rem', fontWeight: 900 }),
    textAlign: (themeStyle.productPriceAlign || 'left') as React.CSSProperties['textAlign'],
    ...(themeStyle.productPriceTextColor ? { color: themeStyle.productPriceTextColor } : {}),
    padding: `${themeStyle.productPricePaddingTop ?? 0}px ${themeStyle.productPricePaddingRight ?? 0}px ${themeStyle.productPricePaddingBottom ?? 0}px ${themeStyle.productPricePaddingLeft ?? 0}px`,
    display: 'block',
    width: (themeStyle.productPriceWidth || 'fit') === 'fill' ? '100%' : 'fit-content',
  }

  // — cart button computed style —
  const cartBtnStyle: React.CSSProperties = {
    backgroundColor: buttonStyle === 'solid' ? primaryColor : 'transparent',
    color: buttonStyle === 'solid' ? '#fff' : primaryColor,
    border: buttonStyle === 'ghost' ? 'none' : `1.5px solid ${primaryColor}`,
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
      <div className="mb-5 flex items-center gap-2">
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
              : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
          }
        >
          {products.map((p) => (
            isList ? (
              /* ── LIST layout ── */
              <EditorItem key={p.id} section="products" field="layout" label="Card layout" isEditor={isEditor} onEdit={notify} block>
              <div
                className="relative flex gap-4 border bg-white p-3 transition-shadow cursor-pointer"
                style={{ borderRadius, ...shadowStyle, borderColor: 'var(--store-card-border, #e4e4e7)', ...(fontFamily ? { fontFamily } : {}) }}
                onClick={() => navigateTo(p.id)}
              >
                {isEditor && (
                  <button
                    onClick={e => { e.stopPropagation(); window.parent.postMessage({ type: 'edit-product', productId: p.id }, '*') }}
                    className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 text-white text-[10px] font-bold hover:bg-zinc-700 transition-colors"
                  >
                    <Pencil className="w-2.5 h-2.5" /> Edit
                  </button>
                )}
                <div className="w-20 h-20 shrink-0 bg-zinc-100 overflow-hidden" style={{ borderRadius }}>
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
                        <CardTitleLink isEditor={isEditor} href={`/store/${subdomain}/products/${p.id}`} style={titleStyle}>
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
                className="group flex flex-col bg-white overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                style={{ borderRadius, ...shadowStyle, border: '1px solid var(--store-card-border, #f1f1f1)', ...(fontFamily ? { fontFamily } : {}) }}
                onClick={() => navigateTo(p.id)}
              >
                {/* Image with category badge overlay */}
                <div className="relative shrink-0 bg-zinc-50 overflow-hidden" style={{ height: 210 }}>
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                  {p.category && (
                    <span
                      className="absolute top-2.5 left-2.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: primaryColor + '18', color: primaryColor }}
                    >
                      {p.category}
                    </span>
                  )}
                </div>

                <div className="p-3 flex flex-col gap-2 flex-1">
                  <div style={titleHighlight}>
                    <EditorItem section="products" field="product-title" label="Product Title" isEditor={isEditor} onEdit={notify} block>
                      <CardTitleLink isEditor={isEditor} href={`/store/${subdomain}/products/${p.id}`} style={titleStyle}>
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
                  <div className="mt-auto" style={cartHighlight} onClick={e => e.stopPropagation()}>
                    <EditorItem section="products" field="add-to-cart-btn" label="Cart Button" isEditor={isEditor} onEdit={notify} block>
                      <AddToCartButton
                        product={{ id: p.id, title: p.title, price: p.price, imageUrl: p.imageUrl }}
                        label={themeStyle.cartBtnLabel}
                        showIcon={themeStyle.cartBtnShowIcon}
                        isEditor={isEditor}
                        style={{
                          ...cartBtnStyle,
                          width: (themeStyle.cartBtnWidth || 'fill') === 'fill' ? '100%' : undefined,
                        }}
                      />
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
