'use client'

import Link from 'next/link'
import SectionHeader from './SectionHeader'
import { ThemeState, labelCls, inputCls } from '../types'
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

        {/* Section Background Color */}
        <div>
          <label className={labelCls}>Section Background</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.productGridBg}
              onChange={e => updateTheme({ productGridBg: e.target.value })}
              className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 cursor-pointer shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Background Color</p>
              <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{theme.productGridBg}</p>
            </div>
            <input
              type="text"
              value={theme.productGridBg}
              onChange={e => updateTheme({ productGridBg: e.target.value })}
              className="w-20 text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>
        </div>

        {/* Text Color */}
        <div>
          <label className={labelCls}>Text Color <span className="normal-case font-normal opacity-60">— leave blank to use global</span></label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.productGridTextColor || theme.textColor}
              onChange={e => updateTheme({ productGridTextColor: e.target.value })}
              className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 cursor-pointer shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Text Color</p>
              <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{theme.productGridTextColor || '(using global)'}</p>
            </div>
            <input
              type="text"
              value={theme.productGridTextColor}
              onChange={e => updateTheme({ productGridTextColor: e.target.value })}
              placeholder={theme.textColor}
              className="w-20 text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>
          {theme.productGridTextColor && (
            <button onClick={() => updateTheme({ productGridTextColor: '' })} className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 underline">
              Reset to global
            </button>
          )}
        </div>

        {/* Font */}
        <div>
          <label className={labelCls}>Font <span className="normal-case font-normal opacity-60">— leave blank to use global</span></label>
          <select
            value={theme.productGridFont}
            onChange={e => updateTheme({ productGridFont: e.target.value })}
            className={inputCls}
          >
            <option value="">(Global font)</option>
            <option value="sans">Inter — Sans</option>
            <option value="serif">Playfair — Serif</option>
            <option value="mono">Roboto Mono</option>
          </select>
        </div>

        {/* Button Color */}
        <div>
          <label className={labelCls}>Button Color <span className="normal-case font-normal opacity-60">— leave blank to use Primary</span></label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.productGridButtonColor || theme.primaryColor}
              onChange={e => updateTheme({ productGridButtonColor: e.target.value })}
              className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 cursor-pointer shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Button Color</p>
              <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{theme.productGridButtonColor || '(using primary)'}</p>
            </div>
            <input
              type="text"
              value={theme.productGridButtonColor}
              onChange={e => updateTheme({ productGridButtonColor: e.target.value })}
              placeholder={theme.primaryColor}
              className="w-20 text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>
          {theme.productGridButtonColor && (
            <button
              onClick={() => updateTheme({ productGridButtonColor: '' })}
              className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 underline"
            >
              Reset to primary
            </button>
          )}
        </div>

        {/* Layout */}
        <div data-field="layout">
          <label className={labelCls}>Product Layout</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'grid', label: 'Grid' },
              { value: 'list', label: 'List' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => updateTheme({ layout: opt.value })}
                className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  theme.layout === opt.value
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Curvature slider */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls}>Curvature</label>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{theme.borderRadius}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 shrink-0" style={{ borderRadius: '2px' }} />
            <input
              type="range"
              min={0} max={24} step={2}
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
              className="flex-1 accent-zinc-900 h-1.5 rounded-full cursor-pointer"
            />
            <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 shrink-0 rounded-full" />
          </div>
          <div className="flex gap-2 mt-2">
            {[
              { label: 'Sharp', value: '0px' },
              { label: 'Soft',  value: '0.5rem' },
              { label: 'Round', value: '0.75rem' },
              { label: 'Pill',  value: '1.5rem' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => updateTheme({ borderRadius: opt.value })}
                className={`flex-1 py-1.5 text-[10px] font-bold border transition-all ${
                  theme.borderRadius === opt.value
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                    : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                }`}
                style={{ borderRadius: opt.value }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Button Style */}
        <div>
          <label className={labelCls}>Button Style</label>
          <select value={theme.buttonStyle} onChange={e => updateTheme({ buttonStyle: e.target.value })} className={inputCls}>
            <option value="solid">Solid</option>
            <option value="outline">Outline</option>
            <option value="ghost">Ghost</option>
          </select>
        </div>

        {/* Products page heading — products page only */}
        {isProductsPage && (
          <div data-field="products-heading">
            <label className={labelCls}>Page Heading</label>
            <input
              type="text"
              className={inputCls}
              value={theme.productsPageHeading ?? ''}
              onChange={e => updateTheme({ productsPageHeading: e.target.value })}
              placeholder="All Products"
            />
          </div>
        )}

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
            <label className={labelCls}>"Shop All" Button Label</label>
            <input
              type="text"
              className={inputCls}
              value={theme.shopAllLabel}
              onChange={e => updateTheme({ shopAllLabel: e.target.value })}
              placeholder="Shop All Products"
            />
          </div>
        )}

        {/* Card Shadow */}
        <div data-field="card-shadow">
          <label className={labelCls}>Card Shadow</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'none',    label: 'None',   preview: 'border border-zinc-200' },
              { value: 'soft',    label: 'Soft',   preview: 'shadow-sm border border-zinc-100' },
              { value: 'lifted',  label: 'Lifted', preview: 'shadow-md' },
              { value: 'inset',   label: 'Inset',  preview: 'shadow-inner border border-zinc-200' },
              { value: 'strong',  label: 'Strong', preview: 'shadow-xl' },
              { value: 'glow',    label: 'Glow',   preview: 'shadow-md' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => updateTheme({ cardShadow: opt.value })}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  theme.cardShadow === opt.value
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md bg-white shrink-0 ${opt.preview}`}
                  style={opt.value === 'glow' ? { boxShadow: `0 0 12px ${theme.primaryColor}66` } : {}}
                />
                {opt.label}
              </button>
            ))}
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
