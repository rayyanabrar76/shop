import { prisma } from '@/lib/prisma'

/** Turn a product title into a URL-safe handle. */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
}

/**
 * A slug that is unique within the store, suffixing -2, -3 … on collision.
 * Slugs are unique per store at the database level, so a duplicate title would
 * otherwise fail the insert rather than just picking the next free handle.
 */
export async function uniqueProductSlug(
  storeId: string,
  title: string,
  ignoreProductId?: string,
): Promise<string> {
  const base = slugifyTitle(title) || 'product'
  let candidate = base

  for (let n = 2; n < 200; n++) {
    const clash = await prisma.product.findFirst({
      where: {
        storeId,
        slug: candidate,
        ...(ignoreProductId ? { NOT: { id: ignoreProductId } } : {}),
      },
      select: { id: true },
    })
    if (!clash) return candidate
    candidate = `${base}-${n}`
  }
  // Practically unreachable; keeps the URL unique rather than throwing.
  return `${base}-${Date.now().toString(36)}`
}
