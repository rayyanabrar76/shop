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
