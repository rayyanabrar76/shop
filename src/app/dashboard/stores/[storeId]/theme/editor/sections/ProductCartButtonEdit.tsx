'use client'

import SectionHeader from './SectionHeader'
import AiFieldLabel from '@/components/ai/AiFieldLabel'
import { ThemeState, labelCls, inputCls } from '../types'
import { readableText, contrastRatio } from '@/lib/contrast'

interface ProductCartButtonEditProps {
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
  storeId: string
}

/** What the chip paints itself when no colour is set. Mirrors ProductGrid. */
const CHIP_BG = '#ffffff'

/**
 * The slider's top stop, which is the pill rather than a number of pixels.
 *
 * The chip is about 40px tall, so anything past ~20px is already fully round
 * and the last few positions would all look identical. Giving the end of the
 * track a name instead makes it a choice rather than "drag until it stops
 * changing", and it stores blank, which is what every existing shop has.
 */
const PILL = 26

function radiusToSlider(v: string): number {
  if (!v || v === '9999px') return PILL
  if (v.includes('rem')) return Math.round(parseFloat(v) * 16)
  if (v.includes('px')) return parseInt(v)
  return PILL
}

function sliderToRadius(n: number): string {
  if (n >= PILL) return ''
  if (n === 0) return '0px'
  return `${(n / 16).toFixed(4)}rem`
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
  // What the label becomes if its own colour is left blank. The same call the
  // chip makes, so this panel shows the colour the shop will actually use.
  const chipBg = theme.cartBtnBgColor || CHIP_BG
  const autoFg = readableText(chipBg, '#ffffff', '#18181b')
  // The shop replaces a label colour that cannot be read on the chip. Say so
  // here, rather than letting this panel show one colour and the preview
  // another with no explanation.
  const fgOverridden =
    !!theme.cartBtnTextColor && (contrastRatio(theme.cartBtnTextColor, chipBg) ?? 21) < 3

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
                    <span className="mt-1 block text-[9px] leading-tight text-zinc-500">
                      {opt.hint}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* The chip is white unless a colour is set. This used to say "theme
            button colour" while the chip painted itself white on the shop, so
            the swatch disagreed with the thing it was describing. */}
        <div data-field="cart-btn-colors">
          <label className={labelCls}>
            Background <span className="normal-case font-normal opacity-60">blank keeps the chip white</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.cartBtnBgColor || CHIP_BG}
              onChange={e => updateTheme({ cartBtnBgColor: e.target.value })}
              className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 cursor-pointer shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono text-zinc-500">{theme.cartBtnBgColor || '(white)'}</p>
            </div>
            <input
              type="text"
              value={theme.cartBtnBgColor ?? ''}
              onChange={e => updateTheme({ cartBtnBgColor: e.target.value })}
              placeholder={CHIP_BG}
              className="w-24 text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>
          {theme.cartBtnBgColor && (
            <button onClick={() => updateTheme({ cartBtnBgColor: '' })} className="mt-1.5 text-[10px] text-zinc-400 hover:text-zinc-600 underline">
              Reset to white
            </button>
          )}
        </div>

        <div>
          <label className={labelCls}>
            Text Color <span className="normal-case font-normal opacity-60">blank follows the background</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.cartBtnTextColor || autoFg}
              onChange={e => updateTheme({ cartBtnTextColor: e.target.value })}
              className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 cursor-pointer shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono text-zinc-500">{theme.cartBtnTextColor || `(auto, ${autoFg})`}</p>
            </div>
            <input
              type="text"
              value={theme.cartBtnTextColor ?? ''}
              onChange={e => updateTheme({ cartBtnTextColor: e.target.value })}
              placeholder={autoFg}
              className="w-24 text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>
          {fgOverridden && (
            <p className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-400">
              Too close to the background to read, so the chip is using {autoFg} instead.
            </p>
          )}
          {theme.cartBtnTextColor && (
            <button onClick={() => updateTheme({ cartBtnTextColor: '' })} className="mt-1.5 text-[10px] text-zinc-400 hover:text-zinc-600 underline">
              Reset to auto
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

        {/* Curvature. Reads the same way as the grid's own slider, with a
            swatch carrying whatever radius the track is on rather than a
            sentence describing it. */}
        <div data-field="cart-btn-radius">
          <div className="flex items-center justify-between mb-2">
            <label className={`${labelCls} mb-0`}>Curvature</label>
            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 tabular-nums dark:bg-zinc-800 dark:text-zinc-300">
              {theme.cartBtnRadius || 'Pill'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="h-5 w-5 shrink-0 border-2 border-zinc-200 dark:border-zinc-700 transition-[border-radius]"
              style={{ borderRadius: theme.cartBtnRadius || '9999px' }}
            />
            <input
              type="range"
              min={0} max={PILL} step={2}
              value={radiusToSlider(theme.cartBtnRadius ?? '')}
              onChange={e => updateTheme({ cartBtnRadius: sliderToRadius(parseInt(e.target.value)) })}
              className="flex-1 h-1.5 cursor-pointer rounded-full accent-zinc-900 dark:accent-zinc-100"
              aria-label="Cart button curvature"
            />
            <div className="w-5 h-5 border-2 border-zinc-200 dark:border-zinc-700 shrink-0 rounded-full" />
          </div>
        </div>

        {/* "Show cart icon" used to sit here, beside Width. The chip *is* the
            icon, so switching it off left an empty pill, and Show Button above
            already covers not having one. Both columns stay on the model so
            old rows still load. */}

        {/* Width used to sit here. It only ever applied to the full-width
            button under the card, which no longer exists, the setting stayed
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
                <span className="text-[9px] text-zinc-500 mt-0.5 block">{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
