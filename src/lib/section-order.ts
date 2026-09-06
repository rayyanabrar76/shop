/**
 * Order of the reorderable home page sections.
 *
 * Only the middle of the page moves: the announcement bar and header are
 * always above it and the footer always below, so they are not in this list.
 *
 * Stored as comma-separated keys on StoreTheme.sectionOrder. Keys not present
 * in the stored value are appended in their default order, which is what makes
 * a blank value render exactly as before and a newly added custom section show
 * up without anyone having to rewrite the order.
 */

/** A built-in section that can be moved. */
export type BuiltInSection = 'hero' | 'products'

export const BUILT_IN_ORDER: BuiltInSection[] = ['hero', 'products']

export const CUSTOM_PREFIX = 'custom:'

export function customKey(id: string): string {
  return `${CUSTOM_PREFIX}${id}`
}

export function isCustomKey(key: string): boolean {
  return key.startsWith(CUSTOM_PREFIX)
}

export function customIdFromKey(key: string): string {
  return key.slice(CUSTOM_PREFIX.length)
}

/**
 * Resolves the stored order against what actually exists.
 *
 * Sections that have since been deleted drop out, and anything the stored order
 * has never heard of is appended — so this is always a complete, valid list.
 */
export function resolveSectionOrder(
  stored: string | null | undefined,
  customSectionIds: string[],
): string[] {
  const valid = new Set<string>([...BUILT_IN_ORDER, ...customSectionIds.map(customKey)])

  const seen = new Set<string>()
  const ordered: string[] = []

  for (const raw of (stored ?? '').split(',')) {
    const key = raw.trim()
    if (!key || seen.has(key) || !valid.has(key)) continue
    seen.add(key)
    ordered.push(key)
  }

  // Whatever the stored order did not mention, in the default order.
  for (const key of BUILT_IN_ORDER) {
    if (!seen.has(key)) { seen.add(key); ordered.push(key) }
  }
  for (const id of customSectionIds) {
    const key = customKey(id)
    if (!seen.has(key)) { seen.add(key); ordered.push(key) }
  }

  return ordered
}

export function serializeSectionOrder(keys: string[]): string {
  return keys.join(',')
}
