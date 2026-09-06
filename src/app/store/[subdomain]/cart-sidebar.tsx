'use client'

import { useCart } from './cart'
import { X, ShoppingBag, Plus, Minus, ArrowRight, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePrice } from '@/components/CurrencyProvider'
import { useStoreBase } from '@/components/StoreBaseProvider'

interface CartSidebarProps {
  themeStyle?: {
    primaryColor: string
    borderRadius: string
    buttonStyle: string
  }
  subdomain?: string
}

export default function CartSidebar({ themeStyle, subdomain }: CartSidebarProps) {
  const storeBase = useStoreBase()
  const price = usePrice()
  const { items, total, remove, add, clear, isOpen, setIsOpen } = useCart()
  const router = useRouter()

  const primary = themeStyle?.primaryColor ?? '#0a0a0a'
  const radius = themeStyle?.borderRadius ?? '0.75rem'
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)

  function handleCheckout() {
    if (!subdomain) return
    setIsOpen(false)
    router.push(`${storeBase}/checkout`)
  }

  return (
    <>
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          backgroundColor: isOpen ? 'rgba(0,0,0,0.25)' : 'transparent',
          backdropFilter: isOpen ? 'blur(2px)' : 'none',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full sm:w-100 flex-col bg-white"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: isOpen ? '-20px 0 60px rgba(0,0,0,0.12)' : 'none',
        }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 leading-none">Your Cart</h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {itemCount === 0 ? 'Empty' : `${itemCount} item${itemCount !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button onClick={clear} className="p-2 rounded-xl text-zinc-300 hover:text-red-400 hover:bg-red-50 transition-all" title="Clear cart">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mx-6 h-px bg-zinc-100 shrink-0" />

        <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-5 space-y-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center gap-4 py-16">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ backgroundColor: `${primary}15` }}>
                <ShoppingBag className="w-8 h-8" style={{ color: primary }} />
              </div>
              <div>
                <p className="font-semibold text-zinc-800 text-sm">Nothing here yet</p>
                <p className="text-xs text-zinc-400 mt-1">Add something from the store</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-xs font-bold underline underline-offset-4 text-zinc-500 hover:text-zinc-900 transition-colors">
                Continue shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartKey} className="flex gap-4 group items-start">
                <div className="shrink-0 overflow-hidden bg-zinc-100" style={{ borderRadius: radius, width: 72, height: 72, minWidth: 72 }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} style={{ width: 72, height: 72, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div className="flex items-center justify-center" style={{ width: 72, height: 72 }}>
                      <ShoppingBag className="w-5 h-5 text-zinc-300" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between py-0.5 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 leading-snug line-clamp-2">{item.title}</p>
                      {item.variantSelections && item.variantSelections.length > 0 && (
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {item.variantSelections.map(v => `${v.variantName}: ${v.optionLabel}`).join(' · ')}
                        </p>
                      )}
                    </div>
                    <button onClick={() => remove(item.cartKey)} className="shrink-0 p-1 rounded-lg text-zinc-300 hover:text-red-400 hover:bg-red-50 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 border border-zinc-200 rounded-xl p-1 bg-zinc-50">
                      <button onClick={() => remove(item.cartKey)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-zinc-500 hover:text-zinc-900">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-zinc-800">{item.quantity}</span>
                      <button onClick={() => add(item, 1)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-zinc-500 hover:text-zinc-900">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-black text-zinc-900">{price(item.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-zinc-100 px-6 pt-5 pb-6 space-y-4 shrink-0">
          {items.length > 0 ? (
            <>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Subtotal</span>
                  <span className="text-xs font-semibold text-zinc-700">{price(total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Shipping</span>
                  <span className="text-xs font-semibold text-emerald-600">Calculated at checkout</span>
                </div>
                <div className="h-px bg-zinc-100" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-zinc-900">Total</span>
                  <span className="text-xl font-black text-zinc-900">{price(total)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                className="group flex w-full items-center justify-center gap-2 py-4 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer"
                style={{ backgroundColor: primary, borderRadius: radius, boxShadow: `0 8px 24px ${primary}40` }}
              >
                Checkout
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="text-[10px] text-zinc-400 text-center">Secure checkout · Free returns</p>
            </>
          ) : (
            <p className="text-[10px] text-zinc-300 text-center">Your cart is empty</p>
          )}
        </div>
      </aside>
    </>
  )
}
