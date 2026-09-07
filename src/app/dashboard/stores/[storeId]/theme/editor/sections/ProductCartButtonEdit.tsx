'use client'

import SectionHeader from './SectionHeader'
import AiFieldLabel from '@/components/ai/AiFieldLabel'
import { ThemeState, labelCls, inputCls } from '../types'

interface ProductCartButtonEditProps {
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
  storeId: string
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

/**
 * Deliberately two. There were four — "Always" and "On Hover" both dropped a
 * full-width button under every card, which buries the photography, and
 * "On Hover" leant on something phones do not have. Each extra option is
 * another layout to keep looking right in dark mode, on mobile, and in
 * whatever colour a merchant picks, and this one was not earning that.
 */
const DISPLAY_OPTIONS = [
  { value: 'icon',   label: 'Quick add', hint: 'Chip on the product image' },
  { value: 'hidden', label: 'Hidden',    hint: 'Card links to the product' },
] as const

/**
 * A miniature of the product card for each choice.
 *
 * The four options differ only in where the buy control sits, which a sentence
 * of hint text describes poorly — "Chip on the image" versus "Fades in over the
 * card" reads as the same thing until you have seen both. Twelve pixels of
 * diagram settles it at a glance.
 */
function Preview({ kind, active }: { kind: string; active: boolean }) {
  const ink = active ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-600'
  const paper = active ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-800'

  return (
    <div className="w-full rounded-md bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 p-1.5">
      <div className={`relative w-full h-7 rounded ${paper}`}>
        {kind === 'icon' && (
          <span className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full ${ink}`} />
        )}
        {kind === 'hover' && (
          <span className={`absolute inset-x-2 bottom-1 h-2 rounded-sm ${ink} opacity-50`} />
        )}
      </div>
      {/* The title line is always there; only the button below it changes. */}
      <div className={`mt-1 h-1 w-2/3 rounded-sm ${paper}`} />
      {kind === 'always' ? (
        <div className={`mt-1 h-2 w-full rounded-sm ${ink}`} />
      ) : (
        <div className="mt-1 h-2 w-full" />
      )}
    </div>
  )
}


export default function ProductCartButtonEdit({ theme, updateTheme, onBack, storeId }: ProductCartButtonEditProps) {
  function padChange(field: keyof ThemeState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      updateTheme({ [field]: parseInt(e.target.value) || 0 } as any)
    }
  }

  return (
    <div>
      <SectionHeader title="Cart Button" onBack={onBack} />
      <div className="p-4 space-y-5">

        <div data-field="cart-btn-display">
          <label className={labelCls}>Show Button</label>
          <div className="grid grid-cols-2 gap-2">
            {DISPLAY_OPTIONS.map(opt => {
              // Legacy "always"/"hover" resolve to the chip on the storefront,
              // so the panel shows the same thing rather than leaving neither
              // card selected.
              const current = theme.cartBtnDisplay === 'hidden' ? 'hidden' : 'icon'
              const active = current === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => updateTheme({ cartBtnDisplay: opt.value })}
                  aria-pressed={active}
                  className={`group relative flex flex-col gap-2 p-2.5 rounded-xl border text-left transition-all ${
                    active
                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800 shadow-[0_1px_2px_rgba(9,9,11,0.05)]'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <Preview kind={opt.value} active={active} />
                  <div>
                    <span
                      className={`block text-[11px] font-bold leading-none ${
                        active
                          ? 'text-zinc-900 dark:text-zinc-50'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="mt-1 block text-[9px] leading-tight text-zinc-400 dark:text-zinc-500">
                      {opt.hint}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Blank inherits the grid Button Color, which inherits Primary. */}
        <div data-field="cart-btn-colors">
          <label className={labelCls}>
            Background <span className="normal-case font-normal opacity-60">— blank uses the theme button colour</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.cartBtnBgColor || theme.primaryColor}
              onChange={e => updateTheme({ cartBtnBgColor: e.target.value })}
              className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 cursor-pointer shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{theme.cartBtnBgColor || '(theme colour)'}</p>
            </div>
            <input
              type="text"
              value={theme.cartBtnBgColor ?? ''}
              onChange={e => updateTheme({ cartBtnBgColor: e.target.value })}
              placeholder={theme.primaryColor}
              className="w-24 text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-400 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>
          {theme.cartBtnBgColor && (
            <button onClick={() => updateTheme({ cartBtnBgColor: '' })} className="mt-1.5 text-[10px] text-zinc-400 hover:text-zinc-600 underline">
              Reset to theme colour
            </button>
          )}
        </div>

        <div>
          <label className={labelCls}>
            Text Color <span className="normal-case font-normal opacity-60">— blank uses white</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.cartBtnTextColor || '#ffffff'}
              onChange={e => updateTheme({ cartBtnTextColor: e.target.value })}
              className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 cursor-pointer shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{theme.cartBtnTextColor || '(white)'}</p>
            </div>
            <input
              type="text"
              value={theme.cartBtnTextColor ?? ''}
              onChange={e => updateTheme({ cartBtnTextColor: e.target.value })}
              placeholder="#ffffff"
              className="w-24 text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-400 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>
          {theme.cartBtnTextColor && (
            <button onClick={() => updateTheme({ cartBtnTextColor: '' })} className="mt-1.5 text-[10px] text-zinc-400 hover:text-zinc-600 underline">
              Reset to white
            </button>
          )}
        </div>


        <p className="text-xs text-zinc-500 dark:text-zinc-400">Customise the Add to Cart button on product cards</p>

        {/* Label */}
        <div className="group/ai">
          <AiFieldLabel
            label="Button Label"
            storeId={storeId}
            kind="button"
            current={theme.cartBtnLabel || ''}
            hint="the add-to-cart button on every product card"
            onWrite={text => updateTheme({ cartBtnLabel: text })}
            labelClassName={labelCls + ' mb-0'}
          />
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

        {/* Width used to sit here. It only ever applied to the full-width
            button under the card, which no longer exists — the setting stayed
            in the panel doing nothing, which is worse than not offering it.
            The column is kept on the model so old rows still load. */}

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
