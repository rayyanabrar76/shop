/**
 * Picking readable text for a background the merchant chose.
 *
 * Sections let the merchant set any background colour, so nothing can assume
 * the page's default text colour still reads against it — a dark section on a
 * light theme leaves near-black text on near-black.
 */

/** Accepts #rgb, #rrggbb, rgb() and rgba(). Returns null for anything else. */
function parseColor(input: string): [number, number, number] | null {
  const value = input.trim()

  const hex = value.replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return [
      parseInt(hex[0] + hex[0], 16),
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
    ]
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ]
  }

  const rgb = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]

  return null
}

/**
 * Relative luminance, per WCAG. Not the naive average: the eye is far more
 * sensitive to green than to blue, so a pure blue and a pure green of the same
 * numeric value need opposite text.
 */
export function luminance(color: string): number | null {
  const rgb = parseColor(color)
  if (!rgb) return null
  const [r, g, b] = rgb.map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function isDark(color: string): boolean {
  const l = luminance(color)
  // Unparseable colours are treated as light, which keeps the existing dark
  // text rather than flipping a section to white on something unknown.
  if (l === null) return false
  // 0.36 rather than 0.5: white on a mid colour stays readable well below the
  // point where black would, so the tipping point sits below the midpoint.
  return l < 0.36
}

/**
 * Text that reads on `background`. `light` and `dark` let a caller keep its own
 * palette instead of pure white and black.
 */
export function readableText(background: string, light = '#ffffff', dark = '#111111'): string {
  return isDark(background) ? light : dark
}

/** A hairline that stays visible on `background`, for borders and dividers. */
export function readableBorder(background: string): string {
  return isDark(background) ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'
}

/** A muted version of the readable text, for secondary lines. */
export function readableMuted(background: string): string {
  return isDark(background) ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)'
}

/**
 * How far apart two colours are, per WCAG. 1 is identical, 21 is black on
 * white. Body text wants 4.5 and large text wants 3.
 */
export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a)
  const lb = luminance(b)
  if (la === null || lb === null) return null
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Keeps a chosen colour if it can actually be read, and replaces it if not.
 *
 * A merchant picks colours one at a time, so a value chosen against a white
 * page is still sitting there when the page turns dark. That is how a grid
 * ends up with #454545 text on #09090b, or a heading in near-black on a
 * section the dark theme has just repainted black: every value was reasonable
 * when it was set, and nothing rechecked them together.
 *
 * So the pair is checked rather than trusted. Anything that clears the bar is
 * left exactly as the merchant set it, and only a genuinely unreadable pairing
 * is overridden.
 *
 * The bar is 3, not 4.5. This mostly guards headings and prices, which are
 * large, and a stricter test would start overriding deliberate choices like
 * grey captions that are perfectly legible.
 */
export function ensureReadable(
  color: string | null | undefined,
  background: string,
  minimum = 3,
): string {
  if (!color) return readableText(background)
  const ratio = contrastRatio(color, background)
  // Unreadable pairs get a computed colour; anything unparseable is left
  // alone, since guessing at a colour we cannot measure is worse.
  if (ratio === null) return color
  return ratio >= minimum ? color : readableText(background)
}
