'use client'

import { useEffect, useState } from 'react'
import { ImageIcon, Plus, Tag, X } from 'lucide-react'
import { HiPhoto } from 'react-icons/hi2'
import ProductPickerModal from '@/components/ProductPickerModal'
import MediaPicker from '@/components/MediaPicker'
import AiFieldLabel from '@/components/ai/AiFieldLabel'
import AiImageModal from '@/components/ai/AiImageModal'
import { useCategoryForm, type CreatedCategory, type EditableCategory } from '@/components/use-category-form'
import { useModalEscape } from '@/components/useModalEscape'

export type { CreatedCategory }

/**
 * Create-a-category form: image, title, description and the products that
 * belong to it. Shared by the Categories admin page and the Shop by Category
 * picker in the theme editor so the two cannot drift apart.
 *
 * Products reference a category by slug, so assigning them here saves opening
 * each product just to file it.
 */
export default function CategoryFormModal({
  storeId,
  onClose,
  onCreated,
  category,
}: {
  storeId: string
  onClose: () => void
  onCreated: (category: CreatedCategory) => void
  /** Pass a category to edit it; omit to create a new one. */
  category?: EditableCategory | null
}) {
  // State and saving live in useCategoryForm, shared with the full-page form
  // at /categories/new. Only the layout differs between the two.
  const f = useCategoryForm(storeId, onCreated, category)
  const [picking, setPicking] = useState(false)
  const [imageAiOpen, setImageAiOpen] = useState(false)

  useModalEscape(() => { if (!f.saving) onClose() })

  const fieldCls =
    'w-full rounded-xl border border-(--admin-field-border) px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-(--admin-field-border-focus) focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600'
  const labelCls =
    'text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 mb-2 block'

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm p-3 sm:p-4 dialog-dim"
      onMouseDown={e => { if (e.target === e.currentTarget && !f.saving) onClose() }}
    >
      <div
        className="w-full max-w-4xl max-h-[88dvh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-(--admin-border) shadow-[0_32px_80px_-20px_rgba(0,0,0,0.45)] overflow-hidden dialog-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-(--admin-edge)">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4 text-white dark:text-zinc-900" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {f.isEdit ? 'Edit category' : 'New category'}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Group products so customers can browse them together.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body, single column now that products live in their own picker,
            which is what was squeezing this layout. */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls + ' mb-0'}>Cover image</label>
                <button
                  type="button"
                  onClick={() => setImageAiOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-(--admin-border) text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-(--admin-field-border) transition-colors"
                >
                  <HiPhoto className="w-3.5 h-3.5" /> Generate with AI
                </button>
              </div>
              {/* The picker stays visible with an image set, so the cover can
                  be swapped without deleting it first. */}
              <div className="max-w-xs space-y-2">
                {f.imageUrl && (
                  <div className="relative">
                    <img
                      src={f.imageUrl}
                      alt=""
                      className="w-full aspect-4/3 rounded-xl object-cover border border-(--admin-border)"
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
              </div>
              <p className="text-[10px] text-zinc-400 mt-2">
                Shown on the Shop by Category tile. Falls back to a product photo.
              </p>
            </div>

            <div className="group/ai">
              <AiFieldLabel
                label="Title"
                storeId={storeId}
                kind="heading"
                current={f.name}
                hint="the name of a product category in this shop"
                onWrite={f.setName}
              />
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

            <div className="group/ai">
              <AiFieldLabel
                label="Description"
                storeId={storeId}
                kind="paragraph"
                current={f.description}
                hint={`a short line about the "${f.name || 'this'}" category`}
                onWrite={f.setDescription}
              />
              <textarea
                value={f.description}
                onChange={e => f.setDescription(e.target.value)}
                rows={3}
                placeholder="Optional, a short line about this group"
                className={`${fieldCls} resize-none leading-relaxed`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls + ' mb-0'}>Products</label>
                <button
                  type="button"
                  onClick={() => setPicking(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-(--admin-border) text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add products
                </button>
              </div>

              {f.productIds.length === 0 ? (
                <div className="rounded-xl border border-dashed border-(--admin-border) px-4 py-8 text-center">
                  <p className="text-xs text-zinc-400">No products yet. Add some, or set a product&apos;s category from its own page.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {f.products.filter(p => f.productIds.includes(p.id)).map(p => (
                    <div key={p.id} className="relative group min-w-0">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-full aspect-square rounded-xl object-cover border border-(--admin-edge)" />
                      ) : (
                        <div className="w-full aspect-square rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                        </div>
                      )}
                      <button
                        onClick={() => f.toggleProduct(p.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-zinc-900/80 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove ${p.title}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-snug">{p.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {f.error && <p className="text-[11px] text-red-500">{f.error}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-(--admin-edge) bg-zinc-50/60 dark:bg-zinc-900">
          <p className="text-[11px] text-red-500 font-medium min-h-4 truncate">{f.error}</p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onClose}
              disabled={f.saving}
              className="px-4 py-2.5 rounded-xl border border-(--admin-border) text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={f.submit}
              disabled={!f.canSubmit}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {f.saving ? 'Saving…' : f.isEdit ? 'Save changes' : 'Create category'}
            </button>
          </div>
        </div>
      </div>

      <AiImageModal
        open={imageAiOpen}
        onClose={() => setImageAiOpen(false)}
        storeId={storeId}
        seed={f.name}
        context={[
          `Category: ${f.name || '(not named yet)'}`,
          f.description.trim() ? `What it holds: ${f.description.trim()}` : null,
        ].filter(Boolean).join('\n')}
        onApply={url => f.setImageUrl(url)}
      />


      {picking && (
        <ProductPickerModal
          products={f.products}
          initialSelected={f.productIds}
          onCancel={() => setPicking(false)}
          onConfirm={ids => { f.setProductIds(ids); setPicking(false) }}
        />
      )}
    </div>
  )
}
