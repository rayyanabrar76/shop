'use client'

import SectionHeader from './SectionHeader'
import { ThemeState, labelCls } from '../types'
import { ColorField, SelectField, ToggleRow } from '../controls'
import { resolveHeroButton, type HeroButtonConfig } from '@/lib/hero-button'

interface HeroButtonEditProps {
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
}

const WIDTHS = [
  { value: 'fit', label: 'Fit' },
  { value: 'full', label: 'Full width' },
]

/**
 * The hero's call to action, on its own.
 *
 * Its words and where it goes stay with each slide, because those are what
 * makes one slide different from the next. Everything here is how it is drawn,
 * which is one decision for the whole carousel: a button that changes shape
 * between slides reads as three different buttons rather than one.
 */
export default function HeroButtonEdit({ theme, updateTheme, onBack }: HeroButtonEditProps) {
  const btn = resolveHeroButton(theme.heroButton)

  function patch(next: Partial<HeroButtonConfig>) {
    updateTheme({ heroButton: { ...btn, ...next } })
  }

  return (
    <div>
      <SectionHeader title="Hero Button" description="How the call to action is drawn" onBack={onBack} />
      <div className="p-4 space-y-5">

        <ToggleRow
          label="Show the button"
          hint={btn.show ? undefined : 'Slides show their heading and text only'}
          on={btn.show}
          onChange={v => patch({ show: v })}
        />

        {btn.show && (
          <>
            <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              The label and the link belong to each slide, so they are edited on
              the slide itself. Everything here applies to all of them.
            </p>

            <SelectField
              label="Style"
              hint="blank follows the theme"
              value={btn.style}
              onChange={v => patch({ style: v as HeroButtonConfig['style'] })}
              options={[
                { value: '', label: 'Follow theme' },
                { value: 'solid', label: 'Solid' },
                { value: 'outline', label: 'Outline' },
                { value: 'text', label: 'Text only, no frame' },
              ]}
            />

            <SelectField
              label="Position"
              hint="blank sits with the words"
              value={btn.align}
              onChange={v => patch({ align: v as HeroButtonConfig['align'] })}
              options={[
                { value: '', label: 'With the content' },
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Centre' },
                { value: 'right', label: 'Right' },
              ]}
            />

            {/* Colours.

                Every one blank by default, because the button already works
                out something sensible: over a photograph it goes white on the
                shop's own colour, which stays legible on any image. These are
                for overriding that, not for making the button exist. */}
            <div className="space-y-3">
              <p className={labelCls}>Button Colours</p>
              <ColorField
                label="Background"
                hint="blank picks one that reads on the image"
                value={btn.bgColor}
                onChange={v => patch({ bgColor: v })}
                onReset={() => patch({ bgColor: '' })}
              />
              <ColorField
                label="Text"
                hint="blank follows the background"
                value={btn.textColor}
                onChange={v => patch({ textColor: v })}
                onReset={() => patch({ textColor: '' })}
              />
              <ColorField
                label="Border"
                hint="outline style only"
                value={btn.borderColor}
                onChange={v => patch({ borderColor: v })}
                onReset={() => patch({ borderColor: '' })}
              />
            </div>

            {/* Width, per screen.

                Two settings because they are two different situations. A
                button that fits its words looks deliberate on a desk and
                fiddly under a thumb, and full width on a monitor is a slab. */}
            <div className="space-y-3">
              <p className={labelCls}>Size</p>
              <SelectField
                label="Desktop width"
                value={btn.widthDesktop}
                onChange={v => patch({ widthDesktop: v as HeroButtonConfig['widthDesktop'] })}
                options={WIDTHS}
              />
              <SelectField
                label="Mobile width"
                value={btn.widthMobile}
                onChange={v => patch({ widthMobile: v as HeroButtonConfig['widthMobile'] })}
                options={WIDTHS}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`${labelCls} mb-0`}>Curvature</label>
                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 tabular-nums dark:bg-zinc-800 dark:text-zinc-300">
                  {btn.radius || 'Theme'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="h-5 w-5 shrink-0 border-2 border-zinc-200 dark:border-zinc-700 transition-[border-radius]"
                  style={{ borderRadius: btn.radius || theme.borderRadius }}
                />
                <input
                  type="range"
                  min={0} max={24} step={2}
                  value={remOf(btn.radius || theme.borderRadius)}
                  onChange={e => patch({ radius: pxToRadius(parseInt(e.target.value)) })}
                  className="flex-1 h-1.5 cursor-pointer rounded-full accent-zinc-900 dark:accent-zinc-100"
                  aria-label="Button curvature"
                />
                <div className="w-5 h-5 shrink-0 rounded-full border-2 border-zinc-200 dark:border-zinc-700" />
              </div>
              {btn.radius && (
                <button
                  type="button"
                  onClick={() => patch({ radius: '' })}
                  className="mt-1.5 text-[10px] text-zinc-400 underline hover:text-zinc-600"
                >
                  Follow the theme
                </button>
              )}
            </div>

            <ToggleRow
              label="Open in a new tab"
              hint="for a link that leaves your shop"
              on={btn.newTab}
              onChange={v => patch({ newTab: v })}
            />
          </>
        )}
      </div>
    </div>
  )
}

/** A CSS length in px or rem, as the slider's whole-pixel position. */
function remOf(v: string): number {
  if (!v || v === '0' || v === '0px') return 0
  if (v.includes('rem')) return Math.round(parseFloat(v) * 16)
  if (v.includes('px')) return parseInt(v)
  return 0
}

/** The slider's position back to a stored value. */
function pxToRadius(n: number): string {
  return n === 0 ? '0px' : `${(n / 16).toFixed(4)}rem`
}
