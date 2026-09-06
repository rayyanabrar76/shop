export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000'

/**
 * Public URL of a storefront, as a customer would visit it.
 *
 * Prefers the store's own subdomain. Wildcard subdomains are impossible on
 * *.vercel.app — Vercel issues no certificate for them — so there we fall back
 * to the /store/<subdomain> path form, which the middleware also serves.
 */
export function storeUrl(subdomain: string, path = ''): string {
  const suffix = path.startsWith('/') || path === '' ? path : `/${path}`

  if (APP_DOMAIN.endsWith('.vercel.app')) {
    return `${APP_URL}/store/${subdomain}${suffix}`
  }

  const protocol = APP_URL.startsWith('https') ? 'https' : 'http'
  return `${protocol}://${subdomain}.${APP_DOMAIN}${suffix}`
}
