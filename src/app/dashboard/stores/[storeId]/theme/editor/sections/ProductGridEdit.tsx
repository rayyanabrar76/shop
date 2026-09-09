'use client'

import Link from 'next/link'
import SectionHeader from './SectionHeader'
import AiFieldLabel from '@/components/ai/AiFieldLabel'
import { ThemeState, labelCls, inputCls } from '../types'
import { ColorField, PanelRow, RichTextField, SelectField, ToggleRow } from '../controls'
import { ExternalLink, ShoppingCart, Tag, Type } from 'lucide-react'

interface ProductGridEditProps {
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
  storeId: string
  isProductsPage?: boolean
  /** Opens one of the card's own panels. Passed in because the panels are
      siblings of this one, not children of it. */
  onOpenPanel?: (view: string) => void
}

export default function ProductGridEdit({ theme, updateTheme, onBack, storeId, isProductsPage = false, onOpenPanel }: ProductGridEditProps) {
  return (
    <div>
      <SectionHeader title={isProductsPage ? 'Product Listing' : 'Product Grid'} description="Layout and card styles" onBack={onBack} />
      <div className="p-4 space-y-5">

        <ColorField
          label="Section Background"
          value={theme.productGridBg}
          onChange={v => updateTheme({ productGridBg: v })}
        />

        <ColorField
          label="Text Colour"
          hint="blank uses the global colour"
          value={theme.productGridTextColor}
          fallback={theme.textColor}
          onChange={v => updateTheme({ productGridTextColor: v })}
          onReset={() => updateTheme({ productGridTextColor: '' })}
        />

        <SelectField
          label="Font"
          hint="blank uses the global font"
          value={theme.productGridFont}
          onChange={v => updateTheme({ productGridFont: v })}
          options={[
            { value: '',      label: 'Global font' },
            { value: 'sans',  label: 'Inter, Sans' },
            { value: 'serif', label: 'Playfair, Serif' },
            { value: 'mono',  label: 'Roboto Mono' },
          ]}
        />

        <ColorField
          label="Button Colour"
          hint="blank uses Primary"
          value={theme.productGridButtonColor}
          fallback={theme.primaryColor}
          onChange={v => updateTheme({ productGridButtonColor: v })}
          onReset={() => updateTheme({ productGridButtonColor: '' })}
        />

        {/* Layout */}
        <div data-field="layout" className="space-y-3">
          <SelectField
            label="Type"
            value={['carousel', 'editorial'].includes(theme.layout) ? theme.layout : 'grid'}
            onChange={v => updateTheme({ layout: v })}
            options={[
              { value: 'grid',      label: 'Grid' },
              { value: 'carousel',  label: 'Carousel' },
              { value: 'editorial', label: 'Editorial' },
            ]}
          />
          {/* Separate from the type on purpose: a grid can swipe on a phone
              without becoming a carousel on a monitor. */}
          {theme.layout !== 'carousel' && (
            <ToggleRow
              label="Carousel on mobile"
              on={!!theme.carouselOnMobile}
              onChange={v => updateTheme({ carouselOnMobile: v })}
            />
          )}
        </div>

        {/* Curvature slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`${labelCls} mb-0`}>Curvature</label>
            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 tabular-nums dark:bg-zinc-800 dark:text-zinc-300">
              {theme.borderRadius}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Shows the value rather than describing it: the swatch carries
                whatever radius the slider is on. */}
            <div
              className="h-5 w-5 shrink-0 border-2 border-zinc-200 dark:border-zinc-700 transition-[border-radius]"
              style={{ borderRadius: theme.borderRadius }}
            />
            <input
              type="range"
              min={0} max={24} step={2}
              // accent-color is the one part of a range input browsers let you
              // restyle without rebuilding the whole control.
              value={(() => {
                const r = theme.borderRadius
                if (r === '0px' || r === '0') return 0
                if (r.includes('rem')) return Math.round(parseFloat(r) * 16)
                if (r.includes('px')) return parseInt(r)
                return 0
              })()}
              onChange={e => {
                const v = parseInt(e.target.value)
                updateTheme({ borderRadius: v === 0 ? '0px' : `${(v / 16).toFixed(4)}rem` })
              }}
              className="flex-1 h-1.5 cursor-pointer rounded-full accent-zinc-900 dark:accent-zinc-100"
            />
            <div className="w-5 h-5 border-2 border-zinc-200 dark:border-zinc-700 shrink-0 rounded-full" />
          </div>
        </div>

        {/* Independent of the curvature above, so a store can square off its
            product images while its buttons stay rounded. */}
        <div data-field="product-image-radius">
          <SelectField
            label="Card Cover Corners"
            hint="the product image"
            value={theme.productImageRadius ?? ''}
            onChange={v => updateTheme({ productImageRadius: v })}
            options={[
              { value: '',       label: 'Follow theme curvature' },
              { value: '0px',    label: 'Box, square' },
              { value: '0.5rem', label: 'Soft' },
              { value: '1rem',   label: 'Round' },
            ]}
          />
        </div>

        {/* The card's own parts. These are normally reached by clicking the
            thing itself in the preview, which stops working the moment one of
            them is switched off, so they have a way in from here as well. */}
        {onOpenPanel && (
          <div className="space-y-2">
            <p className={labelCls}>Product Card</p>
            <PanelRow icon={Type} label="Product Title" onClick={() => onOpenPanel('product-title')} />
            <PanelRow
              icon={Tag}
              label="Price"
              note={theme.productPriceHidden ? 'Hidden' : undefined}
              onClick={() => onOpenPanel('product-price')}
            />
            <PanelRow
              icon={ShoppingCart}
              label="Cart Button"
              note={theme.cartBtnDisplay === 'hidden' ? 'Hidden' : undefined}
              onClick={() => onOpenPanel('product-cart')}
            />
          </div>
        )}

        <SelectField
          label="Button Style"
          value={theme.buttonStyle}
          onChange={v => updateTheme({ buttonStyle: v })}
          options={[
            { value: 'solid',   label: 'Solid' },
            { value: 'outline', label: 'Outline' },
            { value: 'ghost',   label: 'Ghost' },
          ]}
        />

        {/* Products page heading, products page only */}
        {isProductsPage && (
          <div data-field="products-heading" className="group/ai">
            <AiFieldLabel
              label="Page Heading"
              storeId={storeId}
              kind="heading"
              current={theme.featuredLabel}
              hint="the heading above the product grid"
              onWrite={text => updateTheme({ featuredLabel: text })}
              labelClassName={labelCls + ' mb-0'}
            />
            <input
              type="text"
              className={inputCls}
              value={theme.productsPageHeading ?? ''}
              onChange={e => updateTheme({ productsPageHeading: e.target.value })}
              placeholder="All Products"
            />
          </div>
        )}

        <SelectField
          label="Heading Preset"
          hint="size and level"
          value={theme.featuredLabelLevel ?? ''}
          onChange={v => updateTheme({ featuredLabelLevel: v })}
          options={[
            { value: '',   label: 'Default, small caps' },
            { value: 'h1', label: 'Heading 1' },
            { value: 'h2', label: 'Heading 2' },
            { value: 'h3', label: 'Heading 3' },
            { value: 'h4', label: 'Heading 4' },
            { value: 'h5', label: 'Heading 5' },
            { value: 'h6', label: 'Heading 6' },
          ]}
        />

        {/* Section Heading.

            Shown and named are two questions, so they are two controls. A
            merchant who cleared the text to get rid of the heading was left
            with nothing to click on to bring it back, and a blank label is an
            unnamed heading rather than a missing one. Switching it off hides
            the field it names too, since there is nothing to write for
            something that is not drawn. */}
        <div data-field="featured-label" className="space-y-3">
          <ToggleRow
            label={isProductsPage ? 'Show grid heading' : 'Show section heading'}
            on={theme.featuredLabelShow !== false}
            onChange={v => updateTheme({ featuredLabelShow: v })}
          />
          {theme.featuredLabelShow !== false && (
            <>
              <RichTextField
                label={isProductsPage ? 'Grid Heading' : 'Section Heading'}
                value={theme.featuredLabel}
                onChange={v => updateTheme({ featuredLabel: v })}
                rows={2}
              />
              <div>
                <label className={labelCls}>Heading Padding (px)</label>
                <div className="grid grid-cols-4 gap-2">
                  <NumBox label="Top"    value={theme.featuredLabelPadTop}    onChange={v => updateTheme({ featuredLabelPadTop: v })} />
                  <NumBox label="Bottom" value={theme.featuredLabelPadBottom} onChange={v => updateTheme({ featuredLabelPadBottom: v })} />
                  <NumBox label="Left"   value={theme.featuredLabelPadLeft}   onChange={v => updateTheme({ featuredLabelPadLeft: v })} />
                  <NumBox label="Right"  value={theme.featuredLabelPadRight}  onChange={v => updateTheme({ featuredLabelPadRight: v })} />
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  Heading Margin (px) <span className="normal-case font-normal opacity-60">its gap from the cards</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <NumBox label="Top"    value={theme.featuredLabelMarginTop}    onChange={v => updateTheme({ featuredLabelMarginTop: v })} />
                  <NumBox label="Bottom" value={theme.featuredLabelMarginBottom} onChange={v => updateTheme({ featuredLabelMarginBottom: v })} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Shop All Button, home page only */}
        {!isProductsPage && (
          <div data-field="shop-all" className="space-y-3">
            <ToggleRow
              label="Show &quot;Shop All&quot; button"
              on={theme.shopAllShow !== false}
              onChange={v => updateTheme({ shopAllShow: v })}
            />
            {theme.shopAllShow !== false && (
              <>
                <SelectField
                  label="Button Style"
                  hint="blank follows the theme"
                  value={theme.shopAllStyle ?? ''}
                  onChange={v => updateTheme({ shopAllStyle: v })}
                  options={[
                    { value: '',        label: 'Follow theme' },
                    { value: 'solid',   label: 'Solid' },
                    { value: 'outline', label: 'Outline' },
                    { value: 'text',    label: 'Text only, no frame' },
                  ]}
                />
                <RichTextField
                  label={'"Shop All" Button Label'}
                  value={theme.shopAllLabel}
                  onChange={v => updateTheme({ shopAllLabel: v })}
                  rows={2}
                />
                <div>
                  <label className={labelCls}>
                    Button Padding (px) <span className="normal-case font-normal opacity-60">inside the button</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <NumBox label="Top"    value={theme.shopAllPadTop}    onChange={v => updateTheme({ shopAllPadTop: v })} />
                    <NumBox label="Bottom" value={theme.shopAllPadBottom} onChange={v => updateTheme({ shopAllPadBottom: v })} />
                    <NumBox label="Left"   value={theme.shopAllPadLeft}   onChange={v => updateTheme({ shopAllPadLeft: v })} />
                    <NumBox label="Right"  value={theme.shopAllPadRight}  onChange={v => updateTheme({ shopAllPadRight: v })} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>
                    Button Margin (px) <span className="normal-case font-normal opacity-60">its gap from the cards</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <NumBox label="Top"    value={theme.shopAllMarginTop}    onChange={v => updateTheme({ shopAllMarginTop: v })} />
                    <NumBox label="Bottom" value={theme.shopAllMarginBottom} onChange={v => updateTheme({ shopAllMarginBottom: v })} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div data-field="card-shadow">
          <SelectField
            label="Card Shadow"
            value={theme.cardShadow}
            onChange={v => updateTheme({ cardShadow: v })}
            options={[
              { value: 'none',   label: 'None' },
              { value: 'soft',   label: 'Soft' },
              { value: 'lifted', label: 'Lifted' },
              { value: 'inset',  label: 'Inset' },
              { value: 'strong', label: 'Strong' },
              { value: 'glow',   label: 'Glow' },
            ]}
          />
        </div>

        {/* Section spacing.

            Both, not one. Padding is inside the section, so its background
            covers it; margin is outside, so the page shows through. Separating
            a coloured band from what sits above it needs margin; giving that
            band room to breathe needs padding, and neither can stand in for
            the other. */}
        <div data-field="grid-spacing" className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div>
            <label className={labelCls}>
              Padding (px) <span className="normal-case font-normal opacity-60">inside the section</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              <NumBox label="Top"    value={theme.productGridPadTop}    onChange={v => updateTheme({ productGridPadTop: v })} />
              <NumBox label="Bottom" value={theme.productGridPadBottom} onChange={v => updateTheme({ productGridPadBottom: v })} />
              <NumBox label="Left"   value={theme.productGridPadLeft}   onChange={v => updateTheme({ productGridPadLeft: v })} />
              <NumBox label="Right"  value={theme.productGridPadRight}  onChange={v => updateTheme({ productGridPadRight: v })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>
              Margin (px) <span className="normal-case font-normal opacity-60">outside it</span>
            </label>
            {/* Top and bottom only. A side margin on a section that runs the
                width of the page just insets it, which is what padding does,
                and offering two controls for one result invites a merchant to
                set both and wonder why the gap doubled. */}
            <div className="grid grid-cols-2 gap-2">
              <NumBox label="Top"    value={theme.productGridMarginTop}    onChange={v => updateTheme({ productGridMarginTop: v })} />
              <NumBox label="Bottom" value={theme.productGridMarginBottom} onChange={v => updateTheme({ productGridMarginBottom: v })} />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Link
            href={`/dashboard/stores/${storeId}/products`}
            target="_blank"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            See All Products
          </Link>
        </div>

      </div>
    </div>
  )
}

/** One number in a row of them, with its edge named underneath. */
function NumBox({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="text-center">
      <input
        type="number"
        min={0}
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-1.5 text-xs text-center outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
        value={value ?? 0}
        // An empty box is a zero rather than a NaN, so clearing it to type a
        // new number does not blank the section out on the way.
        onChange={e => onChange(parseInt(e.target.value) || 0)}
      />
      <span className="text-[9px] text-zinc-500 mt-0.5 block">{label}</span>
    </div>
  )
}
