import { headers } from 'next/headers'

/**
 * Base path for storefront links in a server component.
 *
 * The middleware sets x-store-base when it rewrites a subdomain or custom
 * domain request. Its presence means the store is already at the host root, so
 * links need no prefix; otherwise we are on the /store/<subdomain> fallback.
 */
export async function getStoreBase(subdomain: string): Promise<string> {
  try {
    const h = await headers()
    return h.get('x-store-base') ? '' : `/store/${subdomain}`
  } catch {
    // headers() is unavailable in some rendering contexts — fall back to the
    // path form, which works everywhere.
    return `/store/${subdomain}`
  }
}
