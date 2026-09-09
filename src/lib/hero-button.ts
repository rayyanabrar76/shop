/**
 * The hero's call to action, as a thing with its own settings.
 *
 * Its words and its destination stay on each slide, because those are what
 * makes a slide a slide. Everything here is how it is drawn, which is one
 * decision for the whole carousel: a button that changes shape between slides
 * reads as three different buttons rather than one.
 *
 * One JSON column, for the same reason the drawer has one. This is a block
 * with a dozen small knobs and it will grow another whenever someone thinks of
 * one, and a migration per knob is how a schema ends up unreadable.
 *
 * Browser-safe: no server imports. The panel and the storefront read the same
 * shape from here.
 */

export type HeroButtonStyle = '' | 'solid' | 'outline' | 'text'
export type HeroButtonWidth = 'fit' | 'full'
/** Blank follows wherever the slide's content is placed. */
export type HeroButtonAlign = '' | 'left' | 'center' | 'right'

export interface HeroButtonConfig {
  show: boolean
  /** Blank follows the theme's own button style. */
  style: HeroButtonStyle
  /** All blank: the colours are worked out from the slide and the theme. */
  bgColor: string
  textColor: string
  borderColor: string
  widthDesktop: HeroButtonWidth
  widthMobile: HeroButtonWidth
  /** Its own place in the row, when it should not sit with the words. */
  align: HeroButtonAlign
  newTab: boolean
  radius: string
}

export const HERO_BUTTON_DEFAULTS: HeroButtonConfig = {
  show: true,
  style: '',
  bgColor: '',
  textColor: '',
  borderColor: '',
  widthDesktop: 'fit',
  widthMobile: 'fit',
  align: '',
  newTab: false,
  radius: '',
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback
}

/**
 * Anything at all becomes a usable config.
 *
 * The column is nullable and holds whatever was last written, so this is the
 * one place allowed to assume a shape.
 */
export function resolveHeroButton(raw: unknown): HeroButtonConfig {
  const d = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>
  const D = HERO_BUTTON_DEFAULTS
  return {
    show: bool(d.show, D.show),
    style: oneOf(d.style, ['', 'solid', 'outline', 'text'] as const, D.style),
    bgColor: str(d.bgColor, D.bgColor),
    textColor: str(d.textColor, D.textColor),
    borderColor: str(d.borderColor, D.borderColor),
    widthDesktop: oneOf(d.widthDesktop, ['fit', 'full'] as const, D.widthDesktop),
    widthMobile: oneOf(d.widthMobile, ['fit', 'full'] as const, D.widthMobile),
    align: oneOf(d.align, ['', 'left', 'center', 'right'] as const, D.align),
    newTab: bool(d.newTab, D.newTab),
    radius: str(d.radius, D.radius),
  }
}
