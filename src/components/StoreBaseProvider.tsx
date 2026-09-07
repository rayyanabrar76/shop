'use client'

import { createContext, useContext } from 'react'

/**
 * The path every storefront link should be built from.
 *
 * On a subdomain or custom domain the store is already at the host root, so the
 * base is empty and links look like /products/classic-glazed. On the
 * path-based fallback (localhost, or the shared vercel.app URL) it is
 * /store/<subdomain>, which is what the middleware rewrites to.
 *
 * Without this every link is hardcoded to /store/<subdomain>, which on a
 * subdomain produces /store/<sub>/store/<sub>/... once the rewrite runs.
 */
const StoreBaseContext = createContext<string>('')

export function StoreBaseProvider({
  base,
  children,
}: {
  base: string
  children: React.ReactNode
}) {
  return <StoreBaseContext.Provider value={base}>{children}</StoreBaseContext.Provider>
}

export function useStoreBase(): string {
  return useContext(StoreBaseContext)
}

/**
 * Turn a link saved in the editor into one that works on this host.
 *
 * The link picker writes paths as /store/<subdomain>/..., which is correct on
 * the path-based fallback and wrong everywhere else: on a subdomain the store
 * is already at the root, so the saved path is appended to it and you get
 * thedonutsfactory.localhost/store/thedonutsfactory/categories/donut-boxes.
 *
 * Rather than migrate every saved link, the prefix is stripped here and the
 * right base put back — so old links and new ones both resolve, on every kind
 * of host.
 */
export function resolveStoreHref(url: string, base: string, subdomain?: string): string {
  if (!url) return url
  // Absolute links, anchors and mailto/tel are the author's own business.
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('#') || /^(mailto|tel):/i.test(url)) return url

  // Strip the editor's /store/<subdomain> prefix. The subdomain is optional
  // because not every caller knows it, and the pattern is unambiguous here —
  // no storefront page lives under a top-level /store/ segment.
  let path = url
  if (subdomain && (path === `/store/${subdomain}` || path.startsWith(`/store/${subdomain}/`))) {
    path = path.slice(`/store/${subdomain}`.length) || '/'
  } else if (!subdomain) {
    // No subdomain to match against, so match the shape instead. Unambiguous
    // here: no storefront page lives under a top-level /store/ segment.
    path = path.replace(/^\/store\/[^/]+(?=\/|$)/, '') || '/'
  }
  if (!path.startsWith('/')) return path
  return `${base}${path === '/' ? '' : path}` || '/'
}
