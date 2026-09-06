'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ImageIcon, Plus, X, Eye } from 'lucide-react'
import { HiSparkles, HiPhoto } from 'react-icons/hi2'
import AiCategoryModal from '@/components/ai/AiCategoryModal'
import AiImageModal from '@/components/ai/AiImageModal'
import ProductPickerModal from '@/components/ProductPickerModal'
import MediaPicker from '@/components/MediaPicker'
import { useCategoryForm, type EditableCategory } from '@/components/use-category-form'
import { storeUrl } from '@/lib/config'

/**
 * The full-page category form, used to add one at /categories/new and to edit
 * one at /categories/[categoryId]. Pass `category` to edit; the hook handles
 * PATCH vs POST, so only the wording differs here.
 */
export default function CategoryFormPage({
  storeId,
  subdomain,
  category,
}: {
  storeId: string
  subdomain: string
  category?: EditableCategory | null
}) {
  const router = useRouter()
  const [picking, setPicking] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [imageAiOpen, setImageAiOpen] = useState(false)
  const f = useCategoryForm(storeId, () => {
    router.push(`/dashboard/stores/${storeId}/categories`)
    router.refresh()
  }, category)

  const fieldCls =
    'w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600'
  const labelCls =
    'text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-2 block'
  const cardCls =
    'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-sm'

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sticky action bar, so Save is reachable however long the list gets */}
      <div className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/dashboard/stores/${storeId}/categories`}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors shrink-0"
              aria-label="Back to categories"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-[15px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
              {f.name.trim() || (f.isEdit ? 'Edit category' : 'Add category')}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {f.error && <p className="text-[11px] text-red-500 font-medium truncate max-w-55">{f.error}</p>}
            {/* A new category has no page to view until it is saved, so the
                eye is present but inert rather than a broken link. */}
            {f.isEdit && category ? (
              <a
                href={storeUrl(subdomain, `/categories/${category.slug}`)}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
                title="View on storefront"
              >
                <Eye className="w-4 h-4" />
              </a>
            ) : (
              <span
                className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                title="Save the category first to view it on your storefront"
              >
                <Eye className="w-4 h-4" />
              </span>
            )}
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              <HiSparkles className="w-3.5 h-3.5" /> Write with AI
            </button>
            <Link
              href={`/dashboard/stores/${storeId}/categories`}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {f.isEdit ? 'Cancel' : 'Discard'}
            </Link>
            <button
              onClick={f.submit}
              disabled={!f.canSubmit}
              className="px-5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {f.saving ? 'Saving…' : f.isEdit ? 'Save changes' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-7 grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-5 items-start">
        {/* Details */}
        <div className="space-y-5">
          <div className={`${cardCls} p-6`}>
            <div className="flex gap-5">
              <div className="w-40 shrink-0">
                <label className={labelCls}>Image</label>
                {/* The picker stays visible with an image set, so the cover
                    can be swapped without deleting it first. */}
                {f.imageUrl && (
                  <div className="relative mb-2">
                    <img
                      src={f.imageUrl}
                      alt=""
                      className="w-40 h-40 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700"
                    />
                    <button
                      onClick={() => f.setImageUrl('')}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-zinc-900/80 backdrop-blur text-white flex items-center justify-center hover:bg-zinc-900 transition-colors"
                      aria-label="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <MediaPicker storeId={storeId} value={f.imageUrl} onChange={f.setImageUrl} accept="image" hidePreview />
                <button
                  type="button"
                  onClick={() => setImageAiOpen(true)}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                >
                  <HiPhoto className="w-3.5 h-3.5" /> Generate with AI
                </button>
              </div>

              <div className="flex-1 min-w-0 space-y-4">
                <div>
                  <label className={labelCls}>Title</label>
                  <input
                    autoFocus
                    value={f.name}
                    onChange={e => f.setName(e.target.value)}
                    placeholder="e.g. Glazed"
                    className={fieldCls}
                  />
                  {f.slug && (
                    <p className="text-[10px] text-zinc-400 mt-1.5 font-mono">/products?category={f.slug}</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    value={f.description}
                    onChange={e => f.setDescription(e.target.value)}
                    rows={4}
                    placeholder="Optional — a short line about this group"
                    className={`${fieldCls} resize-none leading-relaxed`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items already chosen, mirroring Shopify's "Collection items" card */}
          <div className={cardCls}>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Category items</p>
              <span className="text-[11px] font-semibold text-zinc-400 tabular-nums">{f.productIds.length}</span>
              {f.productIds.length === 0 && (
                <p className="text-xs text-zinc-400 ml-auto">Pick products on the right to fill this category</p>
              )}
            </div>
            {f.productIds.length > 0 && (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {f.products
                  .filter(p => f.productIds.includes(p.id))
                  .map(p => (
                    <div key={p.id} className="relative group">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-full aspect-square rounded-xl object-cover border border-zinc-100 dark:border-zinc-700" />
                      ) : (
                        <div className="w-full aspect-square rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                        </div>
                      )}
                      <button
                        onClick={() => f.toggleProduct(p.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-zinc-900/80 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove ${p.title}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1.5 line-clamp-2 leading-snug">{p.title}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        <div className={`${cardCls} overflow-hidden lg:sticky lg:top-24`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Products</p>
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add products
            </button>
          </div>
          <div className="p-5">
            {f.productIds.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-6">
                Nothing selected yet.
              </p>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {f.productIds.length} product{f.productIds.length === 1 ? '' : 's'} selected — shown in the card on the left.
              </p>
            )}
          </div>
        </div>
      </div>

      <AiImageModal
        open={imageAiOpen}
        onClose={() => setImageAiOpen(false)}
        storeId={storeId}
        seed={f.name}
        onApply={url => f.setImageUrl(url)}
      />

      <AiCategoryModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        storeId={storeId}
        products={f.products}
        onImage={url => f.setImageUrl(url)}
        onApply={(result, pick) => {
          if (pick.title) f.setName(result.title)
          if (pick.description) f.setDescription(result.description)
          if (pick.products) f.setProductIds(result.productIds)
        }}
      />

      {picking && (
        <ProductPickerModal
          products={f.products}
          initialSelected={f.productIds}
          onCancel={() => setPicking(false)}
          onConfirm={ids => {
            // The hook owns the selection; apply the delta it returns.
            f.productIds.filter(id => !ids.includes(id)).forEach(f.toggleProduct)
            ids.filter(id => !f.productIds.includes(id)).forEach(f.toggleProduct)
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}
