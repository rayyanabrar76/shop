'use client'

import SectionHeader from './SectionHeader'
import { ThemeState, labelCls, inputCls } from '../types'

interface ProductCartButtonEditProps {
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${on ? 'bg-zinc-900' : 'bg-zinc-200 dark:bg-zinc-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

const inactiveBtnCls = 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-600 dark:text-zinc-300'
const activeBtnCls = 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'

export default function ProductCartButtonEdit({ theme, updateTheme, onBack }: ProductCartButtonEditProps) {
  function padChange(field: keyof ThemeState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      updateTheme({ [field]: parseInt(e.target.value) || 0 } as any)
    }
  }

  return (
    <div>
      <SectionHeader title="Cart Button" onBack={onBack} />
      <div className="p-4 space-y-5">

        <p className="text-xs text-zinc-500 dark:text-zinc-400">Customise the Add to Cart button on product cards</p>

        {/* Label */}
        <div>
          <label className={labelCls}>Button Label</label>
          <input
            className={inputCls}
            value={theme.cartBtnLabel || ''}
            onChange={e => updateTheme({ cartBtnLabel: e.target.value })}
            placeholder="Add to cart"
          />
        </div>

        {/* Show icon toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Show cart icon</span>
          <Toggle
            on={theme.cartBtnShowIcon ?? true}
            onChange={v => updateTheme({ cartBtnShowIcon: v })}
          />
        </div>

        {/* Width */}
        <div>
          <label className={labelCls}>Width</label>
          <div className="grid grid-cols-2 gap-2">
            {(['fit', 'fill'] as const).map(v => (
              <button
                key={v}
                onClick={() => updateTheme({ cartBtnWidth: v })}
                className={`py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                  (theme.cartBtnWidth || 'fill') === v ? activeBtnCls : inactiveBtnCls
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div>
          <label className={labelCls}>Font Size (px)</label>
          <input
            type="number"
            min={8}
            max={24}
            className={inputCls}
            value={theme.cartBtnFontSize || ''}
            onChange={e => updateTheme({ cartBtnFontSize: parseInt(e.target.value) || 0 })}
            placeholder="10 (default)"
          />
        </div>

        {/* Padding */}
        <div>
          <label className={labelCls}>Padding (px)</label>
          <div className="grid grid-cols-4 gap-2">
            {([
              { label: 'Top',    field: 'cartBtnPaddingTop'    as keyof ThemeState, def: 5 },
              { label: 'Bottom', field: 'cartBtnPaddingBottom' as keyof ThemeState, def: 5 },
              { label: 'Left',   field: 'cartBtnPaddingLeft'   as keyof ThemeState, def: 0 },
              { label: 'Right',  field: 'cartBtnPaddingRight'  as keyof ThemeState, def: 0 },
            ] as const).map(({ label, field, def }) => (
              <div key={field} className="text-center">
                <input
                  type="number" min={0}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-1.5 text-xs text-center outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                  value={(theme[field] as number) ?? def}
                  onChange={padChange(field)}
                />
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
