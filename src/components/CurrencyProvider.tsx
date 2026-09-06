'use client'

import { createContext, useContext } from 'react'
import { useParams } from 'next/navigation'
import { DEFAULT_CURRENCY, formatPrice } from '@/lib/currency'

/**
 * Carries the storefront's currency to client components.
 *
 * The storefront has a layout that already loads the store, so providing it
 * once there beats threading a prop through every cart, grid and checkout
 * component. Server components skip this and call formatPrice() directly with
 * the store row they already fetched.
 */
const CurrencyContext = createContext<string>(DEFAULT_CURRENCY)

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: string | null | undefined
  children: React.ReactNode
}) {
  return (
    <CurrencyContext.Provider value={currency ?? DEFAULT_CURRENCY}>
      {children}
    </CurrencyContext.Provider>
  )
}

/** The active currency code, e.g. "PKR". */
export function useCurrency(): string {
  return useContext(CurrencyContext)
}

/** Format a stored integer amount in the active currency: price(1999) -> "$19.99". */
export function usePrice(): (amount: number) => string {
  const currency = useContext(CurrencyContext)
  return (amount: number) => formatPrice(amount, currency)
}

/* ── Dashboard side ─────────────────────────────────────────────────────────
 * The dashboard has no per-store layout, but its top-level layout already
 * loads every store the user owns. Providing that map once and picking the
 * entry matching the [storeId] route param gives every dashboard client
 * component the right currency without threading a prop through each page.
 */
const StoreCurrencyMapContext = createContext<Record<string, string>>({})

export function DashboardCurrencyProvider({
  currencies,
  children,
}: {
  currencies: Record<string, string>
  children: React.ReactNode
}) {
  return (
    <StoreCurrencyMapContext.Provider value={currencies}>
      {children}
    </StoreCurrencyMapContext.Provider>
  )
}

/** Currency of the store in the current dashboard route. */
export function useDashboardCurrency(): string {
  const map = useContext(StoreCurrencyMapContext)
  const params = useParams()
  const storeId = typeof params?.storeId === 'string' ? params.storeId : ''
  return map[storeId] ?? DEFAULT_CURRENCY
}

/** Format a stored integer amount in the current dashboard store's currency. */
export function useDashboardPrice(): (amount: number) => string {
  const currency = useDashboardCurrency()
  return (amount: number) => formatPrice(amount, currency)
}
