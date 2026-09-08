'use client'

import SectionHeader from './SectionHeader'
import { ThemeState, labelCls, inputCls } from '../types'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

interface ProductTitleEditProps {
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
}

const PRESETS = [
  { value: 'default', label: 'Default' },
  { value: 'h1', label: 'Heading 1' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
  { value: 'h4', label: 'Heading 4' },
  { value: 'h5', label: 'Heading 5' },
  { value: 'h6', label: 'Heading 6' },
]

const inactiveBtnCls = 'border-(--admin-border) hover:border-(--admin-field-border-hover) text-zinc-600 dark:text-zinc-300'
const activeBtnCls = 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'

export default function ProductTitleEdit({ theme, updateTheme, onBack }: ProductTitleEditProps) {
  function padChange(field: keyof ThemeState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      updateTheme({ [field]: parseInt(e.target.value) || 0 } as any)
    }
  }

  return (
    <div>
      <SectionHeader title="Product title" onBack={onBack} />
      <div className="p-4 space-y-5">

        {/* Layout */}
        <div className="space-y-3">
          <p className={labelCls}>Layout</p>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1 block">Width</label>
            <div className="grid grid-cols-2 gap-2">
              {(['fit', 'fill'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => updateTheme({ productTitleWidth: v })}
                  className={`py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                    (theme.productTitleWidth || 'fill') === v ? activeBtnCls : inactiveBtnCls
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1 block">Alignment</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'left', Icon: AlignLeft },
                { value: 'center', Icon: AlignCenter },
                { value: 'right', Icon: AlignRight },
              ].map(({ value, Icon }) => (
                <button
                  key={value}
                  onClick={() => updateTheme({ productTitleAlign: value })}
                  className={`py-2.5 rounded-xl border flex items-center justify-center transition-all ${
                    (theme.productTitleAlign || 'left') === value ? activeBtnCls : inactiveBtnCls
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-2">
          <p className={labelCls}>Typography</p>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5 block">Preset</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.value}
                  onClick={() => updateTheme({ productTitlePreset: p.value })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    (theme.productTitlePreset || 'default') === p.value ? activeBtnCls : inactiveBtnCls
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="space-y-3">
          <p className={labelCls}>Appearance</p>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1 block">Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-9 h-9 rounded-lg border border-(--admin-border) cursor-pointer shrink-0 p-0.5"
                value={theme.productTitleBg || '#ffffff'}
                onChange={e => updateTheme({ productTitleBg: e.target.value })}
              />
              <input
                className={inputCls}
                value={theme.productTitleBg || ''}
                onChange={e => updateTheme({ productTitleBg: e.target.value })}
                placeholder="Transparent"
              />
              {theme.productTitleBg && (
                <button onClick={() => updateTheme({ productTitleBg: '' })} className="text-[10px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 shrink-0">Reset</button>
              )}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5 block">Padding (px)</label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { label: 'Top',    field: 'productTitlePaddingTop'    as keyof ThemeState, def: 4 },
                { label: 'Bottom', field: 'productTitlePaddingBottom' as keyof ThemeState, def: 0 },
                { label: 'Left',   field: 'productTitlePaddingLeft'   as keyof ThemeState, def: 0 },
                { label: 'Right',  field: 'productTitlePaddingRight'  as keyof ThemeState, def: 0 },
              ] as const).map(({ label, field, def }) => (
                <div key={field} className="text-center">
                  <input
                    type="number" min={0}
                    className="w-full rounded-lg border border-(--admin-field-border) px-2 py-1.5 text-xs text-center outline-none focus:border-(--admin-field-border-focus) bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                    value={(theme[field] as number) ?? def}
                    onChange={padChange(field)}
                  />
                  <span className="text-[9px] text-zinc-500 mt-0.5 block">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
