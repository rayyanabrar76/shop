'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, Package } from 'lucide-react'
import { useModalEscape } from '@/components/useModalEscape'
import ProductCreateForm from '../../products/ProductCreateForm'
import ProductEditClient from '../../products/[productId]/ProductEditClient'

interface Category { id: string; name: string; slug: string }

/**
 * Opens the New Product / Edit Product form over the storefront preview.
 *
 * Both forms are the same components the dashboard pages render — passed
 * `embedded` so they drop their page chrome. Editing needs the product fetched
 * client-side, since the dashboard page gets it on the server.
 */
export default function ProductModal({
  storeId,
  productId,
  onClose,
  onSaved,
}: {
  storeId: string
  /** null opens the create form. */
  productId: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = productId !== null

  const [product, setProduct] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadError, setLoadError] = useState('')
  const loading = isEdit && !product && !loadError

  useModalEscape(onClose)

  // Dismiss only when the press AND the release both land on the backdrop.
  // Testing mousedown alone closed the form if a click began inside and
  // finished outside — dragging to select text, or the layout shifting under
  // the cursor after the form resets on save.
  const [pressedBackdrop, setPressedBackdrop] = useState(false)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false

    Promise.all([
      fetch(`/api/stores/${storeId}/products/${productId}`).then(r => r.json()),
      fetch(`/api/stores/${storeId}/categories`).then(r => r.json()).catch(() => null),
    ])
      .then(([p, c]) => {
        if (cancelled) return
        if (!p?.product) { setLoadError(p?.error || 'Could not load that product'); return }
        setProduct(p.product)
        setCategories(c?.categories ?? [])
      })
      .catch(() => { if (!cancelled) setLoadError('Could not load that product') })

    return () => { cancelled = true }
  }, [isEdit, storeId, productId])

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
      onMouseDown={e => setPressedBackdrop(e.target === e.currentTarget)}
      onMouseUp={e => {
        if (pressedBackdrop && e.target === e.currentTarget) onClose()
        setPressedBackdrop(false)
      }}
    >
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden">

        <div className="flex items-start gap-3 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">
              {isEdit ? (product?.title ?? 'Edit product') : 'New product'}
            </h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              {isEdit ? 'Changes show in the preview once saved' : 'Add an item to your storefront'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 -mr-1 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar">
          {loadError ? (
            <p className="p-8 text-center text-sm text-red-500 font-medium">{loadError}</p>
          ) : loading ? (
            <div className="p-16 flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-xs font-medium">Loading product...</p>
            </div>
          ) : isEdit ? (
            <ProductEditClient
              storeId={storeId}
              product={product}
              categories={categories}
              embedded
              onSaved={onSaved}
            />
          ) : (
            <ProductCreateForm storeId={storeId} embedded onSaved={onSaved} />
          )}
        </div>
      </div>
    </div>
  )
}
