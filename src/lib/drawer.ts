/**
 * The mobile drawer's contents.
 *
 * Kept as one JSON column rather than fifteen scalar ones. The drawer is a
 * single composed thing that gains a row whenever someone thinks of another
 * one, and a migration per idea is how a schema ends up with forty columns
 * that only one screen reads.
 *
 * Browser-safe: no Prisma, no server imports. The editor panel, the storefront
 * header and the API all read the same shape from here, so a field cannot mean
 * one thing on one side and something else on the other.
 */

export interface DrawerSection {
  /** Whether this block appears in the drawer at all. */
  show: boolean
  /** The heading above it. Blank hides just the heading, not the block. */
  label: string
}

export interface DrawerConfig {
  /** The "All products" row that opens the full catalogue. */
  allProducts: DrawerSection
  categories: DrawerSection & {
    /**
     * Which categories to list, in the order they are listed. Empty means
     * every category the shop has, which is what a drawer does before anyone
     * has picked any.
     */
    ids: string[]
  }
  carousel: DrawerSection & {
    /** The products to show, in order. Empty shows nothing. */
    productIds: string[]
    showTitle: boolean
    showPrice: boolean
    /** The cards' corners. Blank follows the shop's own curvature. */
    radius: string
  }
  /**
   * The navigation links. These are the header's own links, shown a second
   * way: one menu, not two lists to keep in step with each other.
   */
  links: DrawerSection
  contact: DrawerSection & {
    /** Free text: an address, opening hours, a phone number. */
    text: string
  }
}

export const DRAWER_DEFAULTS: DrawerConfig = {
  links:      { show: true,  label: '' },
  allProducts:{ show: true,  label: 'All products' },
  categories: { show: true,  label: 'Categories', ids: [] },
  carousel:   { show: false, label: 'Featured', productIds: [], showTitle: true, showPrice: true, radius: '' },
  contact:    { show: false, label: 'Contact', text: '' },
}

/** The order the blocks are drawn in, top to bottom. */
export const DRAWER_ORDER = ['links', 'allProducts', 'categories', 'carousel', 'contact'] as const
export type DrawerSectionKey = (typeof DRAWER_ORDER)[number]

export const DRAWER_SECTION_NAMES: Record<DrawerSectionKey, string> = {
  links: 'Menu links',
  allProducts: 'All products',
  categories: 'Categories',
  carousel: 'Product carousel',
  contact: 'Contact',
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback
}

function ids(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string' && x.length > 0)
  // Older rows, and anything hand-edited, may hold a comma-separated string.
  if (typeof v === 'string') return v.split(',').map(x => x.trim()).filter(Boolean)
  return []
}

/**
 * Anything at all becomes a usable config.
 *
 * The column is nullable and holds whatever was last written, so this is the
 * only place allowed to assume a shape. Every consumer calls it and then reads
 * plain fields.
 */
export function resolveDrawer(raw: unknown): DrawerConfig {
  const d = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as
    Partial<Record<keyof DrawerConfig, Record<string, unknown>>>
  const D = DRAWER_DEFAULTS
  return {
    links: {
      show: bool(d.links?.show, D.links.show),
      label: str(d.links?.label, D.links.label),
    },
    allProducts: {
      show: bool(d.allProducts?.show, D.allProducts.show),
      label: str(d.allProducts?.label, D.allProducts.label),
    },
    categories: {
      show: bool(d.categories?.show, D.categories.show),
      label: str(d.categories?.label, D.categories.label),
      ids: ids(d.categories?.ids),
    },
    carousel: {
      show: bool(d.carousel?.show, D.carousel.show),
      label: str(d.carousel?.label, D.carousel.label),
      productIds: ids(d.carousel?.productIds),
      showTitle: bool(d.carousel?.showTitle, D.carousel.showTitle),
      showPrice: bool(d.carousel?.showPrice, D.carousel.showPrice),
      radius: str(d.carousel?.radius, D.carousel.radius),
    },
    contact: {
      show: bool(d.contact?.show, D.contact.show),
      label: str(d.contact?.label, D.contact.label),
      text: str(d.contact?.text, D.contact.text),
    },
  }
}
