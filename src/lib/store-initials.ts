/**
 * "The Donuts Factory" -> "TDF", "Pixora Limited" -> "PL", "hello" -> "HE".
 *
 * The stand-in shown wherever a store needs a small square mark and has no
 * favicon uploaded. One letter fails at exactly the moment the mark matters:
 * two stores whose names begin alike become the same chip.
 *
 * Lives here rather than in the sidebar because Settings names the same
 * letters back to the merchant when explaining what a favicon replaces --
 * and copy that says "TDF" while the chip says something else is worse
 * than copy that says nothing.
 */
export function storeInitials(name: string): string {
  const words = (name ?? '').trim().split(/\s+/).filter(w => /[a-z0-9]/i.test(w))
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return words.slice(0, 3).map(w => w[0]).join('').toUpperCase()
}
