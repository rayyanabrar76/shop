'use client'

import Link from 'next/link'
import SectionHeader from './SectionHeader'
import { ThemeState, labelCls, inputCls } from '../types'
import { ExternalLink } from 'lucide-react'

interface Props {
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
  storeId: string
}

const inactiveBtnCls = 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-600 dark:text-zinc-300'
const activeBtnCls = 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'

function ColorRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        className="w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-700 cursor-pointer shrink-0 p-0.5"
        value={value || '#ffffff'}
        onChange={e => onChange(e.target.value)}
      />
      <span className="flex-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">{label}</span>
      <input
        className="w-20 text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Default'}
      />
      {value && (
        <button onClick={() => onChange('')} className="text-[9px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 shrink-0">Reset</button>
      )}
    </div>
  )
}

export default function CategoryFilterEdit({ theme, updateTheme, onBack, storeId }: Props) {
  return (
    <div>
      <SectionHeader title="Category Filters" onBack={onBack} />
      <div className="p-4 space-y-6">

        {/* Back link */}
        <div className="space-y-3" data-field="cat-back-label">
          <p className={labelCls}>Back Link</p>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1 block">Label Text</label>
            <input
              className={inputCls}
              value={theme.catBackLabel ?? 'Back to store'}
              onChange={e => updateTheme({ catBackLabel: e.target.value })}
              placeholder="Back to store"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1 block">Font</label>
            <select
              value={theme.catBackFont || ''}
              onChange={e => updateTheme({ catBackFont: e.target.value })}
              className={inputCls}
            >
              <option value="">(Global font)</option>
              <option value="sans">Inter, Sans</option>
              <option value="serif">Playfair, Serif</option>
              <option value="mono">Roboto Mono</option>
            </select>
          </div>
        </div>

        {/* Tab styling */}
        <div className="space-y-3" data-field="cat-filter-tabs">
          <p className={labelCls}>Tab Style</p>

          {/* Curvature */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5 block">Curvature</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Sharp', value: '0px' },
                { label: 'Soft',  value: '0.5rem' },
                { label: 'Round', value: '0.75rem' },
                { label: 'Pill',  value: '9999px' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateTheme({ catFilterRadius: opt.value })}
                  className={`py-1.5 text-[10px] font-bold border transition-all ${
                    (theme.catFilterRadius || '9999px') === opt.value ? activeBtnCls : inactiveBtnCls
                  }`}
                  style={{ borderRadius: opt.value === '9999px' ? '9999px' : opt.value }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1 block">Font</label>
            <select
              value={theme.catFilterFont || ''}
              onChange={e => updateTheme({ catFilterFont: e.target.value })}
              className={inputCls}
            >
              <option value="">(Global font)</option>
              <option value="sans">Inter, Sans</option>
              <option value="serif">Playfair, Serif</option>
              <option value="mono">Roboto Mono</option>
            </select>
          </div>

          {/* Font size */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1 block">Font Size (px)</label>
            <input
              type="number"
              min={8} max={24}
              className={inputCls}
              value={theme.catFilterFontSize || ''}
              onChange={e => updateTheme({ catFilterFontSize: parseInt(e.target.value) || 12 })}
              placeholder="12 (default)"
            />
          </div>

          {/* Font weight */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5 block">Font Weight</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Light',  value: '300' },
                { label: 'Normal', value: '400' },
                { label: 'Semi',   value: '600' },
                { label: 'Bold',   value: '700' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateTheme({ catFilterFontWeight: opt.value })}
                  className={`py-1.5 rounded-xl border text-[10px] transition-all ${
                    (theme.catFilterFontWeight || '700') === opt.value ? activeBtnCls : inactiveBtnCls
                  }`}
                  style={{ fontWeight: opt.value }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text case */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5 block">Text Case</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'AA', value: 'uppercase' },
                { label: 'Aa', value: 'capitalize' },
                { label: 'aa', value: 'normal' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateTheme({ catFilterCase: opt.value })}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                    (theme.catFilterCase || 'uppercase') === opt.value ? activeBtnCls : inactiveBtnCls
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Padding */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5 block">Padding (px)</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <input
                  type="number" min={0}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-1.5 text-xs text-center outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                  value={theme.catFilterPaddingX ?? 16}
                  onChange={e => updateTheme({ catFilterPaddingX: parseInt(e.target.value) || 0 })}
                />
                <span className="text-[9px] text-zinc-500 mt-0.5 block">Horizontal</span>
              </div>
              <div className="text-center">
                <input
                  type="number" min={0}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-1.5 text-xs text-center outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                  value={theme.catFilterPaddingY ?? 6}
                  onChange={e => updateTheme({ catFilterPaddingY: parseInt(e.target.value) || 0 })}
                />
                <span className="text-[9px] text-zinc-500 mt-0.5 block">Vertical</span>
              </div>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-3">
          <p className={labelCls}>Colors</p>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">Active tab</p>
            <ColorRow
              label="Background"
              value={theme.catFilterActiveBg || ''}
              onChange={v => updateTheme({ catFilterActiveBg: v })}
              placeholder="Primary color"
            />
            <ColorRow
              label="Text"
              value={theme.catFilterActiveText || ''}
              onChange={v => updateTheme({ catFilterActiveText: v })}
              placeholder="#ffffff"
            />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">Inactive tab</p>
            <ColorRow
              label="Background"
              value={theme.catFilterInactiveBg || ''}
              onChange={v => updateTheme({ catFilterInactiveBg: v })}
              placeholder="zinc-100"
            />
            <ColorRow
              label="Text"
              value={theme.catFilterInactiveText || ''}
              onChange={v => updateTheme({ catFilterInactiveText: v })}
              placeholder="zinc-600"
            />
          </div>
        </div>

        {/* Edit categories link */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Link
            href={`/dashboard/stores/${storeId}/categories`}
            target="_blank"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Edit Categories
          </Link>
        </div>

      </div>
    </div>
  )
}
