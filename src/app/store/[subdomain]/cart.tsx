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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const savedCart = localStorage.getItem('shopflow_cart')
    if (savedCart) {
      try { setItems(JSON.parse(savedCart)) } catch {}
    }
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('shopflow_cart', JSON.stringify(items))
    }
  }, [items, isInitialized])

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
