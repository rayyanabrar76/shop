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
