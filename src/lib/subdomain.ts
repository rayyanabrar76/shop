/**
 * Subdomain rules shared by the create-store form, the settings page and the
 * API routes, so the client never asks for something the server will reject.
 */

export const SUBDOMAIN_MIN = 3
export const SUBDOMAIN_MAX = 63

/**
 * Names that would collide with the app itself. `www` and `api` are skipped by
 * the middleware rewrite, so a store on them would be unreachable; the rest are
 * routes/hostnames we don't want a tenant to impersonate.
 */
export const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'app', 'admin', 'dashboard', 'store', 'stores', 'shop',
  'sign-in', 'sign-up', 'signin', 'signup', 'auth', 'account', 'billing',
  'pricing', 'terms', 'privacy', 'support', 'help', 'docs', 'blog', 'status',
  'mail', 'smtp', 'ftp', 'cdn', 'static', 'assets', 'media', 'img', 'images',
  'test', 'staging', 'dev', 'preview', 'localhost', 'shopflow', 'webhooks',
])

/** Turn free text (a store name) into a valid-ish subdomain candidate. */
export function slugifySubdomain(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')  // strip accents
    .replace(/[^a-z0-9]+/g, '-')      // everything else becomes a hyphen
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SUBDOMAIN_MAX)
    .replace(/-+$/g, '')
}

/**
 * Looser normalizer for what the user is actively typing: keeps a trailing
 * hyphen so `my-` can become `my-store`, but strips leading hyphens and
 * anything illegal.
 */
export function normalizeSubdomainInput(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .slice(0, SUBDOMAIN_MAX)
}

/** Returns an error message, or null when `value` is a usable subdomain. */
export function validateSubdomain(value: string): string | null {
  const v = value.trim().toLowerCase()
  if (!v) return 'Subdomain is required.'
  if (v.length < SUBDOMAIN_MIN) return `Subdomain must be at least ${SUBDOMAIN_MIN} characters.`
  if (v.length > SUBDOMAIN_MAX) return `Subdomain must be ${SUBDOMAIN_MAX} characters or fewer.`
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(v)) {
    return 'Use lowercase letters, numbers and hyphens only, starting and ending with a letter or number.'
  }
  if (v.includes('--')) return 'Subdomain cannot contain two hyphens in a row.'
  if (RESERVED_SUBDOMAINS.has(v)) return 'That subdomain is reserved. Please pick another.'
  return null
}
