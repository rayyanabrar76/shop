'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  HiPlus, HiTag, HiPencil, HiTrash, HiX,
  HiExclamation, HiArrowLeft, HiChevronDown, HiPhotograph, HiEye,
} from 'react-icons/hi'
import ProductPickerModal from '@/components/ProductPickerModal'
import { formatPrice } from '@/lib/currency'
import { storeUrl } from '@/lib/config'

interface ProductRow {
  id: string
  title: string
  imageUrl: string | null
  price: number
  status: string
  category: string | null
}

interface Category {
  id: string
  name: string
  slug: string
  visible: boolean
  storeId: string
  createdAt: Date
  description?: string | null
  imageUrl?: string | null
  products: ProductRow[]
  _count: { products: number }
}

export default function CategoriesClient({
  storeId,
  categories: initial,
  allProducts,
  currency,
  subdomain,
}: {
  storeId: string
  categories: Category[]
  allProducts: ProductRow[]
  currency: string
  subdomain: string
}) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [picking, setPicking] = useState<Category | null>(null)
  const [savingProducts, setSavingProducts] = useState(false)

  async function toggleVisible(cat: Category) {
    const next = !cat.visible
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, visible: next } : c))
    await fetch(`/api/stores/${storeId}/categories/${cat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: next }),
    })
  }

  /**
   * Assignment is a field on the product, not a join table, so moving products
   * in or out means patching each product that actually changed.
   */
  async function saveProducts(cat: Category, ids: string[]) {
    setSavingProducts(true)
    const before = new Set(cat.products.map(p => p.id))
    const after = new Set(ids)
    const added = ids.filter(id => !before.has(id))
    const removed = [...before].filter(id => !after.has(id))

    try {
      await Promise.all([
        ...added.map(id => fetch(`/api/stores/${storeId}/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: cat.slug }),
        })),
        ...removed.map(id => fetch(`/api/stores/${storeId}/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: null }),
        })),
      ])
      const next = allProducts.filter(p => after.has(p.id))
      setCategories(prev => prev.map(c =>
        c.id === cat.id ? { ...c, products: next, _count: { products: next.length } } : c
      ))
      setPicking(null)
      router.refresh()
    } finally {
      setSavingProducts(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true); setDeleteError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/categories/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error ?? 'Failed to delete') }
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id)); setDeleteTarget(null); router.refresh()
    } catch (e: any) { setDeleteError(e.message) }
    finally { setDeleting(false) }
  }

  const totalAssigned = new Set(categories.flatMap(c => c.products.map(p => p.id))).size
  const uncategorised = allProducts.length - totalAssigned

  return (
    <div className="p-5 pt-16 md:p-10 md:pt-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/stores/${storeId}`} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200">
            <HiArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Categories</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Organise your products into groups.</p>
          </div>
        </div>
        <Link href={`/dashboard/stores/${storeId}/categories/new`} className="flex items-center gap-2 rounded-xl bg-black dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-sm">
          <HiPlus className="w-4 h-4" /> New Category
        </Link>
      </div>

      {/* At-a-glance counts */}
      {categories.length > 0 && (
        <div className="flex items-center gap-5 mb-5 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">
            <span className="font-bold text-zinc-900 dark:text-zinc-50">{categories.length}</span> categor{categories.length !== 1 ? 'ies' : 'y'}
          </span>
          <span className="w-px h-3 bg-zinc-200 dark:bg-zinc-700" />
          <span className="text-zinc-500 dark:text-zinc-400">
            <span className="font-bold text-zinc-900 dark:text-zinc-50">{totalAssigned}</span> of {allProducts.length} products filed
          </span>
          {uncategorised > 0 && (
            <>
              <span className="w-px h-3 bg-zinc-200 dark:bg-zinc-700" />
              <span className="text-amber-600 dark:text-amber-400 font-medium">{uncategorised} uncategorised</span>
            </>
          )}
        </div>
      )}

      {categories.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-20 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <HiTag className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">No categories yet</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Create your first category to organise products.</p>
          <Link href={`/dashboard/stores/${storeId}/categories/new`} className="mt-4 text-xs font-bold text-black dark:text-white underline">Create a category</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => {
            const isOpen = expanded === cat.id
            // Same fallback the storefront tile uses, so this matches what a
            // shopper sees rather than showing an empty square.
            const cover = cat.imageUrl || cat.products.find(p => p.imageUrl)?.imageUrl || null

            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Cover — clicking it opens the form, which is where the
                      image is changed. */}
                  <Link
                    href={`/dashboard/stores/${storeId}/categories/${cat.id}`}
                    title="Change cover image"
                    className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center group/cover"
                  >
                    {cover ? (
                      <img src={cover} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <HiTag className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                    )}
                    <span className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity">
                      <HiPhotograph className="w-4 h-4 text-white" />
                    </span>
                  </Link>

                  {/* Name + meta */}
                  <Link href={`/dashboard/stores/${storeId}/categories/${cat.id}`} className="flex-1 min-w-0 group/name">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate group-hover/name:underline">{cat.name}</h3>
                      {!cat.visible && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 shrink-0">
                          Hidden
                        </span>
                      )}
                    </div>
                    {cat.description ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{cat.description}</p>
                    ) : (
                      <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">/products?category={cat.slug}</p>
                    )}
                  </Link>

                  {/* Product thumbnails */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : cat.id)}
                    className="flex items-center gap-2 shrink-0"
                    title={cat._count.products > 0 ? 'Show products' : undefined}
                  >
                    {cat.products.length > 0 ? (
                      <div className="flex -space-x-2">
                        {cat.products.slice(0, 4).map(p => (
                          <div
                            key={p.id}
                            className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"
                          >
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                              : <HiPhotograph className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />}
                          </div>
                        ))}
                        {cat.products.length > 4 && (
                          <div className="w-8 h-8 rounded-lg border-2 border-white dark:border-zinc-900 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-white dark:text-zinc-900">+{cat.products.length - 4}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Empty</span>
                    )}
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums w-16 text-left">
                      {cat._count.products} item{cat._count.products !== 1 ? 's' : ''}
                    </span>
                    {cat.products.length > 0 && (
                      <HiChevronDown className={`w-4 h-4 text-zinc-300 dark:text-zinc-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleVisible(cat)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none mr-1 ${cat.visible ? 'bg-black dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                      title={cat.visible ? 'Hide from store' : 'Show in store'}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-zinc-900 shadow transition-transform ${cat.visible ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>
                    <button
                      onClick={() => setPicking(cat)}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      title="Choose which products are in this category"
                    >
                      Products
                    </button>
                    <a
                      href={storeUrl(subdomain, `/categories/${cat.slug}`)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
                      title="View on storefront"
                    >
                      <HiEye className="w-3.5 h-3.5" />
                    </a>
                    <Link
                      href={`/dashboard/stores/${storeId}/categories/${cat.id}`}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
                      title="Edit name, image and description"
                    >
                      <HiPencil className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => { setDeleteTarget(cat); setDeleteError('') }}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-zinc-400 dark:text-zinc-500 hover:text-red-500"
                      title="Delete"
                    >
                      <HiTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Products in this category */}
                {isOpen && cat.products.length > 0 && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {cat.products.map(p => (
                        <Link
                          key={p.id}
                          href={`/dashboard/stores/${storeId}/products/${p.id}`}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors min-w-0 group/p"
                        >
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                              : <HiPhotograph className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-100 truncate group-hover/p:underline">{p.title}</p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                              {formatPrice(p.price, currency)}
                              {p.status !== 'active' && <span className="ml-1.5 text-amber-600 dark:text-amber-400">Draft</span>}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Choose products for a category */}
      {picking && (
        <ProductPickerModal
          products={allProducts.map(p => ({ id: p.id, title: p.title, imageUrl: p.imageUrl }))}
          initialSelected={picking.products.map(p => p.id)}
          onCancel={() => !savingProducts && setPicking(null)}
          onConfirm={ids => saveProducts(picking, ids)}
        />
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 w-full max-w-sm p-6 space-y-4">
            <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 dark:text-zinc-500"><HiX className="w-4 h-4" /></button>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center shrink-0"><HiExclamation className="w-5 h-5 text-red-500" /></div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Delete category?</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">&quot;{deleteTarget.name}&quot;</span> will be deleted.
                  {deleteTarget._count.products > 0 && <span className="text-amber-600 dark:text-amber-400 font-medium"> {deleteTarget._count.products} product{deleteTarget._count.products !== 1 ? 's' : ''} will be uncategorised.</span>}
                </p>
              </div>
            </div>
            {deleteError && <p className="text-xs text-red-500 font-medium">{deleteError}</p>}
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                <HiTrash className="w-4 h-4" />{deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
