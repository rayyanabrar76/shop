'use client'

import { ShoppingBag } from 'lucide-react'
// No more @/ or ../ logic needed!
import { useCart, CartItem } from './cart' 

export default function CartIcon() {
  const { items, setIsOpen } = useCart()
  
  const itemCount = items.reduce((acc: number, item: CartItem) => acc + item.quantity, 0)

  return (
    <button 
      onClick={() => setIsOpen(true)}
      className="relative p-2 transition-transform hover:scale-110 active:scale-95"
    >
      <ShoppingBag className="h-6 w-6" />
      
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white shadow-sm">
          {itemCount}
        </span>
      )}
    </button>
  )
}