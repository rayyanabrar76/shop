'use client'

import { useState, useRef, useEffect } from 'react'
import { storeUrl } from '@/lib/config'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  HiPlus, HiDotsHorizontal, HiEye, HiCube,
  HiPhotograph, HiTrash, HiX, HiExclamation, HiPencil,
} from 'react-icons/hi'
import { useDashboardPrice } from '@/components/CurrencyProvider'
import PageHeader from '@/components/dashboard/PageHeader'

interface Product {
  id: string
  title: string
  status: string
  inventory: number
  price: number
  category: string | null
  imageUrl: string | null
  slug: string | null
  store: { subdomain: string }
}

const MENU_WIDTH = 176 // matches w-44

function RowMenu({ product, storeId, onDelete }: { product: Product; storeId: string; onDelete: (p: Product) => void }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // The table scrolls horizontally, and a container with overflow-x: auto also
  // clips vertically (CSS promotes the other axis from visible to auto). An
  // absolutely-positioned menu therefore got cut off and forced the table to
  // scroll, so it is rendered into a portal and positioned against the button.
  function toggle() {
    if (open) { setOpen(false); return }
    const r = btnRef.current?.getBoundingClientRect()
    if (r) {
      const below = window.innerHeight - r.bottom
      const flipUp = below < 140 && r.top > below
      setCoords({
        top: flipUp ? r.top - 6 - 96 : r.bottom + 6,
        left: Math.max(8, Math.min(r.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
      })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    function close() { setOpen(false) }
    document.addEventListener('mousedown', onPointerDown)
    // Fixed coordinates go stale the moment anything scrolls underneath.
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="p-2 text-zinc-500 hover:text-black dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
        title="More options"
      >
        <HiDotsHorizontal className="w-4 h-4" />
      </button>

      {open && coords && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH }}
          className="bg-(--admin-card) border border-(--admin-border) rounded-xl z-50 overflow-hidden py-1 shadow-lg"
        >
          <Link
            href={`/dashboard/stores/${storeId}/products/${product.id}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <HiPencil className="w-3.5 h-3.5 text-zinc-500" />
            Edit product
          </Link>
          <div className="h-px bg-(--admin-edge) mx-2 my-1" />
          <button
            onClick={() => { setOpen(false); onDelete(product) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <HiTrash className="w-3.5 h-3.5 text-red-500" />
            Delete product
          </button>
        </div>,
        document.body,
      )}
    </>
  )
}

export default function ProductsClient({ storeId, products: initial, categories = [] }: { storeId: string; subdomain: string; products: Product[]; categories?: { name: string; slug: string }[] }) {
  const price = useDashboardPrice()
  // Match on slug or name: products created by an older form saved the name.
  const categoryLabel = (value: string | null) =>
    value ? (categories.find(c => c.slug === value || c.name === value)?.name ?? null) : null
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(initial)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true); setDeleteError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/products/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed to delete') }
      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id))
      setDeleteTarget(null)
      router.refresh()
    } catch (e: any) {
      setDeleteError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        storeId={storeId}
        maxWidth="max-w-7xl"
        icon={<HiCube className="w-5 h-5" />}
        title="Products"
        count={products.length}
        action={
          <Link
            href={`/dashboard/stores/${storeId}/products/create`}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-3 text-[11.5px] font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
          >
            <HiPlus className="w-3.5 h-3.5" /> Add product
          </Link>
        }
      />

    <div className="max-w-7xl mx-auto px-6 pb-10">
      {/* One rounded card holding the list, with the seams between rows kept
          to a whisper: the shape does the containing, so the rules inside
          only need to hint at where one product ends. */}
      <div className="bg-(--admin-card) border border-(--admin-border) rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-(--admin-edge)">
                <th className="px-5 py-3 text-[11px] font-semibold text-zinc-500">Product</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-zinc-500">Status</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-zinc-500">Inventory</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-zinc-500">Price</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--admin-edge)">
              {products.map((p) => (
                <tr
                  key={p.id}
                  onClick={e => {
                    const el = e.target as HTMLElement
                    if (el.closest('a, button, [role="menu"]')) return
                    // A click that ends a text selection is a read, not a nav.
                    if (window.getSelection()?.toString()) return
                    router.push(`/dashboard/stores/${storeId}/products/${p.id}`)
                  }}
                  className="group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-zinc-200/70 dark:ring-zinc-700/70">
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                          : <HiPhotograph className="w-4 h-4 text-zinc-500" />
                        }
                      </div>
                      <div className="min-w-0">
                        <Link href={`/dashboard/stores/${storeId}/products/${p.id}`} className="text-[13px] font-medium text-zinc-900 dark:text-zinc-50 hover:underline block truncate">
                          {p.title}
                        </Link>
                        <p className="text-[11px] text-zinc-500 truncate">{categoryLabel(p.category) ?? 'No category'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-3">
                    <span className={`text-[13px] ${p.inventory === 0 ? 'text-red-500 font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      {p.inventory} in stock
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[13px] font-medium text-zinc-900 dark:text-zinc-50 tabular-nums">
                    {price(p.price)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={storeUrl(p.store.subdomain, `/products/${p.slug || p.id}?owner=1`)}
                        target="_blank"
                        className="p-2 text-zinc-500 hover:text-black dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                        title="View on store"
                      >
                        <HiEye className="w-4 h-4" />
                      </Link>
                      <RowMenu product={p} storeId={storeId} onDelete={(p) => { setDeleteTarget(p); setDeleteError('') }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-11 h-11 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-3">
              <HiCube className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
            </div>
            <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">No products yet</h3>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-50">Your catalogue starts with the first one.</p>
            <Link
              href={`/dashboard/stores/${storeId}/products/create`}
              className="mt-4 flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-3 text-[11px] font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
            >
              <HiPlus className="w-3 h-3" /> Add your first product
            </Link>
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-(--admin-card) rounded-2xl shadow-2xl border border-(--admin-border) w-full max-w-md p-6 space-y-4">
            <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 disabled:opacity-50">
              <HiX className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                <HiExclamation className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Delete product?</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">&quot;{deleteTarget.title}&quot;</span> will be permanently removed. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-(--admin-edge)">
              <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 overflow-hidden shrink-0">
                {deleteTarget.imageUrl
                  ? <img src={deleteTarget.imageUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><HiPhotograph className="w-4 h-4 text-zinc-500" /></div>
                }
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{deleteTarget.title}</p>
                <p className="text-xs text-zinc-500">{price(deleteTarget.price)} · {deleteTarget.inventory} in stock</p>
              </div>
            </div>
            {deleteError && <p className="text-xs text-red-500 font-medium">{deleteError}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                <HiTrash className="w-4 h-4" />
                {deleting ? 'Deleting...' : 'Yes, delete it'}
              </button>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 py-2.5 rounded-xl border border-(--admin-border) text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PUBLISHED: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900',
    active:    'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900',
    DRAFT:     'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-(--admin-border)',
    ARCHIVED:  'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900',
  }
  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  const dot: Record<string, string> = {
    PUBLISHED: 'bg-emerald-500', active: 'bg-emerald-500',
    DRAFT: 'bg-zinc-400', ARCHIVED: 'bg-red-500',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium pl-1.5 pr-2.5 h-[22px] rounded-full border ${styles[status] ?? styles.DRAFT}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] ?? dot.DRAFT}`} />
      {label}
    </span>
  )
}
