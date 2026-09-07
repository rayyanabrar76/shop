'use client'

import { createContext, useContext, useMemo, useState, useEffect } from 'react'

export type CartVariantSelection = {
  variantName: string
  optionLabel: string
}

export type CartItem = {
  cartKey: string
  productId: string
  title: string
  price: number
  quantity: number
  imageUrl?: string | null
  variantSelections?: CartVariantSelection[]
}

type CartContextValue = {
  items: CartItem[]
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  remove: (cartKey: string) => void
  removeItemCompletely: (cartKey: string) => void
  clear: () => void
  total: number
}

const CartContext = createContext<CartContextValue | null>(null)

const LEGACY_KEY = 'shopflow_cart'

export function CartProvider({
  children,
  storeKey,
}: {
  children: React.ReactNode
  /**
   * Which shop this cart belongs to. Every store gets its own subdomain in
   * production, so localStorage is already separate — but on a path-routed
   * host (localhost/store/<name>, and the owner's preview) all shops share one
   * origin, and a single key let items follow the shopper from one store into
   * the next. Checkout then rejected the whole cart, since it only prices
   * products belonging to the store being bought from.
   */
  storeKey?: string
}) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const key = storeKey ? `${LEGACY_KEY}:${storeKey}` : LEGACY_KEY

  useEffect(() => {
    setIsInitialized(false)
    let saved = localStorage.getItem(key)

    // One-time move of a cart saved under the old shared key, so a shopper
    // mid-purchase when this ships does not lose what they picked out.
    //
    // Only on a dedicated store origin, where the old cart provably belongs to
    // this shop. Under /store/<name> the origin is shared, so that cart could
    // have been filled at a different shop — adopting it here would recreate
    // the bleed this key is meant to stop.
    const ownOrigin = !window.location.pathname.startsWith('/store/')
    if (saved === null && key !== LEGACY_KEY && ownOrigin) {
      const legacy = localStorage.getItem(LEGACY_KEY)
      if (legacy !== null) {
        localStorage.setItem(key, legacy)
        localStorage.removeItem(LEGACY_KEY)
        saved = legacy
      }
    }

    try { setItems(saved ? JSON.parse(saved) : []) } catch { setItems([]) }
    setIsInitialized(true)
  }, [key])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(key, JSON.stringify(items))
    }
  }, [items, isInitialized, key])

  const value = useMemo<CartContextValue>(() => ({
    items,
    isOpen,
    setIsOpen,
    add: (item, quantity = 1) => {
      setItems(prev => {
        const existing = prev.find(p => p.cartKey === item.cartKey)
        if (!existing) return [...prev, { ...item, quantity }]
        return prev.map(p => p.cartKey === item.cartKey ? { ...p, quantity: p.quantity + quantity } : p)
      })
      setIsOpen(true)
    },
    remove: (cartKey) =>
      setItems(prev => {
        const existing = prev.find(p => p.cartKey === cartKey)
        if (existing && existing.quantity > 1) {
          return prev.map(p => p.cartKey === cartKey ? { ...p, quantity: p.quantity - 1 } : p)
        }
        return prev.filter(p => p.cartKey !== cartKey)
      }),
    removeItemCompletely: (cartKey) =>
      setItems(prev => prev.filter(p => p.cartKey !== cartKey)),
    clear: () => { setItems([]); setIsOpen(false) },
    total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  }), [items, isOpen])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
