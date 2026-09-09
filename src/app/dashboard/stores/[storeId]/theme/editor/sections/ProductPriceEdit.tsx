'use client'

import SectionHeader from './SectionHeader'
import { ThemeState, labelCls, inputCls } from '../types'
import { ToggleRow } from '../controls'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

interface ProductPriceEditProps {
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
}

const PRESETS = [
  { value: 'h6',     label: 'Heading 6' },
  { value: 'h5',     label: 'Heading 5' },
  { value: 'h4',     label: 'Heading 4' },
  { value: 'h3',     label: 'Heading 3' },
  { value: 'h2',     label: 'Heading 2' },
  { value: 'h1',     label: 'Heading 1' },
  { value: 'default',label: 'Default' },
]

const inactiveBtnCls = 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-600 dark:text-zinc-300'
const activeBtnCls = 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        className="w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-700 cursor-pointer shrink-0 p-0.5"
        value={value || '#09090b'}
        onChange={e => onChange(e.target.value)}
      />
      <span className="flex-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">{label}</span>
      <input
        className="w-20 text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Default"
      />
      {value && (
        <button onClick={() => onChange('')} className="text-[9px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 shrink-0">Reset</button>
      )}
    </div>
  )
}

export default function ProductPriceEdit({ theme, updateTheme, onBack }: ProductPriceEditProps) {
  function padChange(field: keyof ThemeState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      updateTheme({ [field]: parseInt(e.target.value) || 0 } as any)
    }
  }

  return (
    <div>
      <SectionHeader title="Price" onBack={onBack} />
      <div className="p-4 space-y-5">

        {/* First, because it governs everything under it: a hidden price has
            no typography, colour or padding worth setting. */}
        <ToggleRow
          label="Show price"
          hint={theme.productPriceHidden ? 'Cards show no price at all' : undefined}
          on={!theme.productPriceHidden}
          onChange={v => updateTheme({ productPriceHidden: !v })}
        />

        {/* Typography */}
        <div className="space-y-3">
          <p className={labelCls}>Typography</p>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1 block">Preset</label>
            <select
              value={theme.productPricePreset || 'h6'}
              onChange={e => updateTheme({ productPricePreset: e.target.value })}
              className={inputCls}
            >
              {PRESETS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1 block">Width</label>
            <div className="grid grid-cols-2 gap-2">
              {(['fit', 'fill'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => updateTheme({ productPriceWidth: v })}
                  className={`py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                    (theme.productPriceWidth || 'fit') === v ? activeBtnCls : inactiveBtnCls
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
                { value: 'left',   Icon: AlignLeft },
                { value: 'center', Icon: AlignCenter },
                { value: 'right',  Icon: AlignRight },
              ].map(({ value, Icon }) => (
                <button
                  key={value}
                  onClick={() => updateTheme({ productPriceAlign: value })}
                  className={`py-2.5 rounded-xl border flex items-center justify-center transition-all ${
                    (theme.productPriceAlign || 'left') === value ? activeBtnCls : inactiveBtnCls
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-3">
          <p className={labelCls}>Color</p>
          <ColorRow label="Text color" value={theme.productPriceTextColor || ''} onChange={v => updateTheme({ productPriceTextColor: v })} />
        </div>

        {/* Padding */}
        <div>
          <label className={labelCls}>Padding (px)</label>
          <div className="grid grid-cols-4 gap-2">
            {([
              { label: 'Top',    field: 'productPricePaddingTop'    as keyof ThemeState },
              { label: 'Bottom', field: 'productPricePaddingBottom' as keyof ThemeState },
              { label: 'Left',   field: 'productPricePaddingLeft'   as keyof ThemeState },
              { label: 'Right',  field: 'productPricePaddingRight'  as keyof ThemeState },
            ] as const).map(({ label, field }) => (
              <div key={field} className="text-center">
                <input
                  type="number" min={0}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-1.5 text-xs text-center outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                  value={(theme[field] as number) ?? 0}
                  onChange={padChange(field)}
                />
                <span className="text-[9px] text-zinc-500 mt-0.5 block">{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
