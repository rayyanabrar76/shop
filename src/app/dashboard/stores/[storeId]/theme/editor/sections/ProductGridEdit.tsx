'use client'

import Link from 'next/link'
import SectionHeader from './SectionHeader'
import AiFieldLabel from '@/components/ai/AiFieldLabel'
import { ThemeState, labelCls, inputCls } from '../types'
import { ColorField, SelectField, ToggleRow } from '../controls'
import { ExternalLink } from 'lucide-react'

interface ProductGridEditProps {
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
  storeId: string
  isProductsPage?: boolean
}

export default function ProductGridEdit({ theme, updateTheme, onBack, storeId, isProductsPage = false }: ProductGridEditProps) {
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
            { value: 'sans',  label: 'Inter — Sans' },
            { value: 'serif', label: 'Playfair — Serif' },
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
              className="h-5 w-5 shrink-0 border-2 border-zinc-300 transition-[border-radius] dark:border-zinc-600"
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
            <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 shrink-0 rounded-full" />
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
              { value: '0px',    label: 'Box — square' },
              { value: '0.5rem', label: 'Soft' },
              { value: '1rem',   label: 'Round' },
            ]}
          />
        </div>

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

        {/* Products page heading — products page only */}
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
            { value: '',   label: 'Default — small caps' },
            { value: 'h1', label: 'Heading 1' },
            { value: 'h2', label: 'Heading 2' },
            { value: 'h3', label: 'Heading 3' },
            { value: 'h4', label: 'Heading 4' },
            { value: 'h5', label: 'Heading 5' },
            { value: 'h6', label: 'Heading 6' },
          ]}
        />

        {/* Section Heading Label */}
        <div data-field="featured-label">
          <label className={labelCls}>{isProductsPage ? 'Grid Heading' : 'Section Heading'}</label>
          <input
            type="text"
            className={inputCls}
            value={theme.featuredLabel}
            onChange={e => updateTheme({ featuredLabel: e.target.value })}
            placeholder={isProductsPage ? 'All Products' : 'Featured Products'}
          />
        </div>

        {/* Shop All Button Label — home page only */}
        {!isProductsPage && (
          <div data-field="shop-all">
            <label className={labelCls}>&quot;Shop All&quot; Button Label</label>
            <input
              type="text"
              className={inputCls}
              value={theme.shopAllLabel}
              onChange={e => updateTheme({ shopAllLabel: e.target.value })}
              placeholder="Shop All Products"
            />
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
