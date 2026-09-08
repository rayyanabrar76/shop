'use client'

import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/dashboard/PageHeader'
import TableSearch from '@/components/dashboard/TableSearch'
import {
  HiPlus, HiTag, HiPencil, HiTrash, HiX,
  HiExclamation, HiChevronDown, HiPhotograph, HiEye,
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
  const [query, setQuery] = useState('')
  const [visibility, setVisibility] = useState('')
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


  // Name, description, and the slug that shows up in the storefront URL, so
  // a category can be found by what it is called or by how it is addressed.
  const shown = (() => {
    const q = query.trim().toLowerCase()
    return categories.filter(c => {
      if (visibility === 'visible' && !c.visible) return false
      if (visibility === 'hidden' && c.visible) return false
      if (!q) return true
      return c.name.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
    })
  })()

  return (
    <>
      <PageHeader
        storeId={storeId}
        maxWidth="max-w-7xl"
        icon={<HiTag className="w-5 h-5" />}
        title="Categories"
        count={categories.length}
        action={
          <Link
            href={`/dashboard/stores/${storeId}/categories/new`}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-3 text-[11.5px] font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
          >
            <HiPlus className="w-3.5 h-3.5" /> New category
          </Link>
        }
      />

    <div className="max-w-7xl px-6 pb-10">
      {/* Only when something is wrong. "8 of 8 products filed" is a line
          that says nothing on the day it is true, and the day it is not true
          the number that matters is the one left over. So the count of filed
          products goes and only the shortfall stays. */}
      {uncategorised > 0 && (
        <p className="mb-4 text-[11px] font-medium text-amber-600 dark:text-amber-400">
          {uncategorised} product{uncategorised === 1 ? '' : 's'} not in any category
        </p>
      )}

      {categories.length === 0 ? (
        <div className="bg-(--admin-card) border border-(--admin-border) rounded-2xl py-16 flex flex-col items-center justify-center text-center">
          <div className="w-11 h-11 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-3">
            <HiTag className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
          </div>
          <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">No categories yet</p>
          <p className="text-[11px] text-zinc-500 mt-1">Groups make a catalogue browsable.</p>
          <Link
            href={`/dashboard/stores/${storeId}/categories/new`}
            className="mt-4 flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-3 text-[11px] font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
          >
            <HiPlus className="w-3 h-3" /> Create a category
          </Link>
        </div>
      ) : (
        /* One rounded card holding the list, the same shape Products uses,
           so the two pages read as the same kind of thing. */
        <div className="bg-(--admin-card) border border-(--admin-border) rounded-2xl overflow-hidden">
          <TableSearch
            value={query}
            onChange={setQuery}
            placeholder="Search categories"
            matches={shown.length}
            total={categories.length}
            filter={{
              value: visibility,
              onChange: setVisibility,
              options: [
                { value: 'visible', label: 'Visible' },
                { value: 'hidden', label: 'Hidden' },
              ],
            }}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-(--admin-edge)">
                  <th className="px-5 py-3 text-[11px] font-semibold text-zinc-500">Category</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-zinc-500">Products</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-zinc-500">Visible</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--admin-edge)">
                {shown.map(cat => {
                  const isOpen = expanded === cat.id
                  // Same fallback the storefront tile uses, so this matches
                  // what a shopper sees rather than showing an empty square.
                  const cover = cat.imageUrl || cat.products.find(p => p.imageUrl)?.imageUrl || null

                  return (
                    <Fragment key={cat.id}>
                      <tr
                        onClick={e => {
                          const el = e.target as HTMLElement
                          if (el.closest('a, button, [role="menu"]')) return
                          if (window.getSelection()?.toString()) return
                          router.push(`/dashboard/stores/${storeId}/categories/${cat.id}`)
                        }}
                        className="group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-zinc-200/70 dark:ring-zinc-700/70">
                              {cover
                                ? <img src={cover} alt="" className="w-full h-full object-cover" />
                                : <HiTag className="w-4 h-4 text-zinc-500" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/dashboard/stores/${storeId}/categories/${cat.id}`}
                                  className="text-[13px] font-medium text-zinc-900 dark:text-zinc-50 hover:underline block truncate"
                                >
                                  {cat.name}
                                </Link>
                                {!cat.visible && (
                                  <span className="inline-flex shrink-0 items-center gap-1 pl-1.5 pr-2 h-5 rounded-full text-[10.5px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                    Hidden
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-500 truncate">
                                {cat.description || `/products?category=${cat.slug}`}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3">
                          {/* The thumbnails are the control that opens the
                              drawer, so the count and the faces of what is
                              inside are one target rather than two. */}
                          <button
                            onClick={() => setExpanded(isOpen ? null : cat.id)}
                            className="flex items-center gap-2"
                            title={cat._count.products > 0 ? 'Show products' : undefined}
                          >
                            {cat.products.length > 0 ? (
                              <div className="flex -space-x-2">
                                {cat.products.slice(0, 4).map(p => (
                                  <div
                                    key={p.id}
                                    className="w-7 h-7 rounded-lg overflow-hidden border-2 border-(--admin-card) bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"
                                  >
                                    {p.imageUrl
                                      ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                                      : <HiPhotograph className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />}
                                  </div>
                                ))}
                                {cat.products.length > 4 && (
                                  <div className="w-7 h-7 rounded-lg border-2 border-(--admin-card) bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                                    <span className="text-[9px] font-bold text-white dark:text-zinc-900">+{cat.products.length - 4}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Empty</span>
                            )}
                            <span className="text-[13px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                              {cat._count.products} item{cat._count.products !== 1 ? 's' : ''}
                            </span>
                            {cat.products.length > 0 && (
                              <HiChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            )}
                          </button>
                        </td>

                        <td className="px-5 py-3">
                          <button
                            onClick={() => toggleVisible(cat)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${cat.visible ? 'bg-black dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                            title={cat.visible ? 'Hide from store' : 'Show in store'}
                          >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-(--admin-card) shadow transition-transform ${cat.visible ? 'translate-x-4' : 'translate-x-1'}`} />
                          </button>
                        </td>

                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setPicking(cat)}
                              className="h-7 px-2.5 rounded-lg border border-(--admin-border) text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-(--admin-field-border) transition-colors"
                              title="Choose which products are in this category"
                            >
                              Products
                            </button>
                            <a
                              href={storeUrl(subdomain, `/categories/${cat.slug}`)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-zinc-500 hover:text-black dark:hover:text-zinc-100"
                              title="View on storefront"
                            >
                              <HiEye className="w-4 h-4" />
                            </a>
                            <Link
                              href={`/dashboard/stores/${storeId}/categories/${cat.id}`}
                              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-zinc-500 hover:text-black dark:hover:text-zinc-100"
                              title="Edit name, image and description"
                            >
                              <HiPencil className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => { setDeleteTarget(cat); setDeleteError('') }}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-all text-zinc-500 hover:text-red-500"
                              title="Delete"
                            >
                              <HiTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* What is inside, opened under its own row rather than
                          floating beside it. */}
                      {isOpen && cat.products.length > 0 && (
                        <tr>
                          <td colSpan={4} className="p-0">
                            <div className="border-t border-(--admin-edge) bg-zinc-50/60 dark:bg-zinc-950/40 p-4">
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                {cat.products.map(p => (
                                  <Link
                                    key={p.id}
                                    href={`/dashboard/stores/${storeId}/products/${p.id}`}
                                    className="flex items-center gap-2.5 p-2 rounded-xl bg-(--admin-card) border border-(--admin-border) hover:border-(--admin-field-border) transition-colors min-w-0 group/p"
                                  >
                                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                                      {p.imageUrl
                                        ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                                        : <HiPhotograph className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-100 truncate group-hover/p:underline">{p.title}</p>
                                      <p className="text-[10px] text-zinc-500">
                                        {formatPrice(p.price, currency)}
                                        {p.status !== 'active' && <span className="ml-1.5 text-amber-600 dark:text-amber-400">Draft</span>}
                                      </p>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {shown.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                {query.trim() ? <>No categories match “{query.trim()}”</> : 'No categories in this view'}
              </p>
              <button
                onClick={() => { setQuery(''); setVisibility('') }}
                className="mt-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Show all categories
              </button>
            </div>
          )}
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
          <div className="relative bg-(--admin-card) rounded-2xl shadow-2xl border border-(--admin-border) w-full max-w-sm p-6 space-y-4">
            <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"><HiX className="w-4 h-4" /></button>
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
