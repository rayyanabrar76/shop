'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { storeUrl } from '@/lib/config'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  HiCheck, HiX, HiUpload, HiCube, HiChevronRight, HiPhotograph, HiSearch,
  HiExclamation, HiTag, HiChevronDown, HiEye,
} from 'react-icons/hi'
import { HiPhoto } from 'react-icons/hi2'
import AiFieldLabel from '@/components/ai/AiFieldLabel'
import AiImageModal from '@/components/ai/AiImageModal'
import TagsInput from '@/components/TagsInput'
import CategoryFormModal from '@/components/CategoryFormModal'
import { useDashboardCurrency } from '@/components/CurrencyProvider'
import { currencySymbol, inputToAmount } from '@/lib/currency'

interface Category {
  id: string
  name: string
  slug: string
}

export interface CreatedProduct {
  id: string
  title: string
  slug: string | null
  subdomain: string
}

import { inputCls, labelCls, hintCls } from '@/components/dashboard/field-styles'
import AmountInput from '@/components/dashboard/AmountInput'
import AltTextField from '@/components/dashboard/AltTextField'
import ImagePreviewModal from '@/components/dashboard/ImagePreviewModal'
import MediaPicker from '@/components/MediaPicker'
import MediaLibraryModal from '@/components/MediaLibraryModal'

/**
 * The New Product form.
 *
 * Rendered full-page at /products/create and, with `embedded`, inside the
 * visual editor's modal. One definition so the two cannot drift apart —
 * `embedded` only changes chrome and what happens after a successful save.
 */
export default function ProductCreateForm({
  storeId,
  embedded = false,
  onSaved,
}: {
  storeId: string
  embedded?: boolean
  /** Called after a successful save. Embedded callers stay put instead of navigating. */
  onSaved?: (product: CreatedProduct) => void
}) {
  const storeCurrency = useDashboardCurrency()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [inventory, setInventory] = useState('')
  const [category, setCategory] = useState('')
  const [sku, setSku] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [status, setStatus] = useState<'active' | 'DRAFT'>('active')
  const [categories, setCategories] = useState<Category[]>([])
  const [catOpen, setCatOpen] = useState(false)
  const catRef = useRef<HTMLDivElement>(null)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  // Set when the photo came from the generator: it is already stored on the
  // server, so there is nothing left to upload on save.
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [imageAlt, setImageAlt] = useState('')
  /** Which image the viewer is showing: the main one, or a gallery index. */
  const [viewing, setViewing] = useState<'main' | number | null>(null)
  const [extraImages, setExtraImages] = useState<{ url: string; alt: string }[]>([])
  const [addingImage, setAddingImage] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [imageAiOpen, setImageAiOpen] = useState(false)
  const [categoryModal, setCategoryModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/stores/${storeId}/categories`)
      .then(r => r.json())
      .then(data => setCategories(data.categories ?? []))
      .catch(() => {})
  }, [storeId])

  useEffect(() => {
    if (!catOpen) return
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [catOpen])

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setGeneratedUrl(null)
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleImageFile(file)
  }, [])

  /** Uploads a picked file if there is one, then creates the product. */
  async function createProduct(): Promise<CreatedProduct | null> {
    let imageUrl: string | null = generatedUrl
    if (imageFile) {
      const formData = new FormData()
      formData.append('file', imageFile)
      const uploadRes = await fetch(`/api/stores/${storeId}/upload`, { method: 'POST', body: formData })
      if (uploadRes.ok) imageUrl = (await uploadRes.json()).url
    }

    const res = await fetch(`/api/stores/${storeId}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, description,
        price: inputToAmount(price),
        inventory: parseInt(inventory) || 0,
        category: category || null,
        sku: sku || null,
        tags,
        status, imageUrl,
        imageAlt,
        images: extraImages.filter(g => g.url && g.url !== imageUrl),
        seoTitle, seoDescription,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      return null
    }
    return data as CreatedProduct
  }

  /** Clears the form so the next product can be added without reopening. */
  function reset() {
    setTitle(''); setDescription(''); setPrice(''); setInventory('')
    setCategory(''); setSku(''); setTags([]); setStatus('active')
    setImageFile(null); setImagePreview(null); setGeneratedUrl(null)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const product = await createProduct()
      if (!product) { setLoading(false); return }

      if (embedded) {
        // Stay put: the caller refreshes the preview behind the modal.
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
        reset()
        // Outside the success path: the product is already saved, so a caller
        // that throws here must not turn that into "something went wrong".
        try { onSaved?.(product) } catch { /* preview refresh is best effort */ }
        setLoading(false)
        return
      }
      router.push(`/dashboard/stores/${storeId}/products`)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  async function handleSaveAndView() {
    setLoading(true)
    setError('')
    try {
      const product = await createProduct()
      if (!product) { setLoading(false); return }

      window.open(storeUrl(product.subdomain, `/products/${product.slug || product.id}?owner=1`), '_blank')

      if (embedded) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
        reset()
        try { onSaved?.(product) } catch { /* preview refresh is best effort */ }
        setLoading(false)
        return
      }
      router.push(`/dashboard/stores/${storeId}/products/${product.id}`)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const canSave = title.trim().length > 0 && price !== '' && Number(price) > 0

  return (
    <div className={embedded ? '' : 'min-h-full bg-(--admin-page)'}>
      <div className={embedded ? 'p-5' : 'max-w-5xl mx-auto px-6 pt-6 pb-10'}>

        {/* Header, the modal supplies its own title, so only actions there */}
        <div className={`flex items-center justify-between ${embedded ? 'mb-4' : 'mb-5'}`}>
          {embedded ? (
            <div className="flex items-center gap-2 text-xs">
              {saved && (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <HiCheck className="w-3.5 h-3.5" /> Saved
                </span>
              )}
              {error && (
                <span className="flex items-center gap-1 text-red-500 font-medium">
                  <HiExclamation className="w-3.5 h-3.5" /> {error}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <Link
                href={`/dashboard/stores/${storeId}/products`}
                aria-label="Back"
                className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
              >
                <HiCube className="w-4 h-4" />
              </Link>
              <HiChevronRight className="w-3.5 h-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" />
              <h1 className="truncate text-[15px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">New product</h1>
            </div>
          )}

          <div className="flex items-center gap-2">
            {!embedded && error && (
              <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                <HiExclamation className="w-3.5 h-3.5" /> {error}
              </span>
            )}
            {canSave && !loading && (
              <button
                onClick={handleSaveAndView}
                title="Save & view live on store"
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-(--admin-border) bg-(--admin-card) px-3 text-[11.5px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 hover:border-(--admin-field-border) transition-colors"
              >
                <HiEye className="w-3.5 h-3.5" />
                View live
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !price || loading}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-3 text-[11.5px] font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors disabled:opacity-40"
            >
              <HiCheck className="w-3.5 h-3.5" />
              {loading ? 'Saving…' : 'Save product'}
            </button>
          </div>
        </div>

        <div className={embedded ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-5'}>

          {/* ── Left: main fields ── */}
          <div className={embedded ? 'space-y-4' : 'lg:col-span-2 space-y-4'}>

            {/* Title + Description */}
            <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-5 space-y-4">
              {/* group/ai: the button inside the label only shows on hover,
                  and the hover target has to be the whole field. */}
              <div className="group/ai">
                <AiFieldLabel
                  label="Product Title"
                  storeId={storeId}
                  kind="heading"
                  current={title}
                  hint="the name of a product in this shop"
                  onWrite={setTitle}
                  labelClassName={labelCls}
                />
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Classic White Tee"
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div className="group/ai">
                <AiFieldLabel
                  label="Description"
                  storeId={storeId}
                  kind="paragraph"
                  current={description}
                  hint={`the description of "${title || 'a product'}" in this shop`}
                  onWrite={setDescription}
                  labelClassName={labelCls}
                />
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your product..."
                  rows={5}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div>
                <label className={labelCls}>Tags</label>
                <TagsInput value={tags} onChange={setTags} />
                <p className="text-[10px] text-zinc-500 mt-1.5">
                  Words shoppers might search for. Used for on-site search and SEO keywords.
                </p>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-5">
              <p className={labelCls}>Pricing &amp; Inventory</p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">Price</label>
                  {/* Symbol in the flow, not overlaid: codes like PKR are far
                      wider than "$" and overlapped a fixed padding. */}
                  <div className="flex items-center rounded-xl border border-(--admin-border) overflow-hidden transition-all bg-white dark:bg-zinc-800 focus-within:border-(--admin-field-border-focus)">
                    <span className="pl-3 pr-1.5 text-zinc-500 text-sm shrink-0 select-none">{currencySymbol(storeCurrency)}</span>
                    <AmountInput
                      value={price}
                      onChange={setPrice}
                      currency={storeCurrency}
                      aria-label="Price"
                      placeholder="0.00"
                      className="flex-1 min-w-0 pr-3 py-2 text-sm outline-none bg-transparent text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">Inventory</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={inventory}
                    onChange={e => {
                      const val = e.target.value
                      if (val === '' || /^\d+$/.test(val)) setInventory(val)
                    }}
                    onKeyDown={e => {
                      if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault()
                    }}
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-5">
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls + ' mb-0'}>Product Images</label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setLibraryOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-(--admin-border) text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-(--admin-field-border) transition-colors"
                  >
                    <HiPhotograph className="w-3.5 h-3.5" /> Choose from Library
                  </button>
                  <button
                    onClick={() => setImageAiOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-(--admin-border) text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-(--admin-field-border) transition-colors"
                  >
                    <HiPhoto className="w-3.5 h-3.5" /> Generate with AI
                  </button>
                </div>
              </div>
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-2 relative rounded-xl border-2 border-dashed cursor-pointer transition-all flex items-center justify-center overflow-hidden
                  ${imagePreview ? 'border-(--admin-border)' : 'border-(--admin-border) hover:border-(--admin-field-border-hover) bg-zinc-50/60 dark:bg-zinc-800/50'}`}
                style={{ minHeight: 160 }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                />
                {imagePreview ? (
                  <div className="relative w-full group">
                    <img src={imagePreview} alt="Preview" className="w-full object-cover max-h-64 rounded-xl" />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        onClick={e => { e.stopPropagation(); setViewing('main') }}
                        title="Open full size"
                        className="p-1.5 bg-black/60 text-white rounded-lg hover:bg-black transition-colors"
                      >
                        <HiSearch className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setImagePreview(null); setImageFile(null); setGeneratedUrl(null) }}
                        className="p-1.5 bg-black/60 text-white rounded-lg hover:bg-black transition-colors"
                      >
                        <HiX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <HiUpload className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Click to upload</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">or drag and drop · PNG, JPG, WEBP</p>
                    </div>
                  </div>
                )}
              </div>

              {imagePreview && (
                <div className="mt-2">
                  {/* An uploaded file is usually named something like
                      08367.png, which tells a screen reader and an image
                      crawler nothing. This is the line that does. */}
                  <AltTextField
                    storeId={storeId}
                    imageUrl={generatedUrl}
                    title={title}
                    value={imageAlt}
                    onChange={setImageAlt}
                    context="the main product photo"
                  />
                </div>
              )}

              {extraImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Gallery images</p>
                  <div className="space-y-2">
                    {extraImages.map((img, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="relative group w-14 h-14 shrink-0 rounded-xl overflow-hidden border border-(--admin-border)">
                          <img
                            src={img.url}
                            alt={img.alt}
                            onClick={() => setViewing(i)}
                            title="Open full size"
                            className="w-full h-full object-cover cursor-zoom-in"
                          />
                          <button
                            onClick={() => setExtraImages(imgs => imgs.filter((_, j) => j !== i))}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <HiX className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <AltTextField
                            storeId={storeId}
                            imageUrl={img.url}
                            title={title}
                            value={img.alt}
                            onChange={v => setExtraImages(imgs => imgs.map((g, j) => j === i ? { ...g, alt: v } : g))}
                            context="one of several gallery shots of this product"
                            showHint={false}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {addingImage ? (
                <div className="space-y-2 mt-3">
                  <MediaPicker storeId={storeId} value={newImageUrl} onChange={setNewImageUrl} accept="image" />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (newImageUrl) { setExtraImages(imgs => [...imgs, { url: newImageUrl, alt: '' }]); setNewImageUrl('') }
                        setAddingImage(false)
                      }}
                      className="flex h-8 items-center rounded-lg bg-zinc-900 dark:bg-zinc-50 px-3 text-[11px] font-semibold text-white dark:text-zinc-900"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setAddingImage(false); setNewImageUrl('') }}
                      className="flex h-8 items-center rounded-lg border border-(--admin-border) px-3 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingImage(true)}
                  className="mt-3 flex h-8 items-center gap-1.5 rounded-lg border border-(--admin-border) px-3 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <HiPhotograph className="w-3.5 h-3.5" /> Add gallery image
                </button>
              )}
            </div>
          </div>

          {/* ── Right: settings ── */}
          <div className="space-y-4">

            {/* Status */}
            <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-5">
              <label className={labelCls}>Status</label>
              <div className="flex gap-2 mt-2">
                {(['active', 'DRAFT'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border
                      ${status === s
                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                        : 'bg-white dark:bg-zinc-800 text-zinc-500 border-(--admin-border) hover:border-(--admin-field-border) hover:text-zinc-600 dark:hover:text-zinc-300'
                      }`}
                  >
                    {s === 'active' ? 'Published' : 'Draft'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category, custom dropdown */}
            <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-5">
              <div className="flex items-center justify-between mb-3">
                <label className={labelCls + ' mb-0'}>Category</label>
                {/* A modal, not a link: leaving the form would lose everything
                    typed so far, and in the editor it would close the editor. */}
                <button
                  type="button"
                  onClick={() => setCategoryModal(true)}
                  className="text-[10px] text-zinc-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  <HiTag className="w-3 h-3" /> New category
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-(--admin-edge)">
                  <span className="text-xs text-zinc-500">No categories yet</span>
                  <button
                    type="button"
                    onClick={() => setCategoryModal(true)}
                    className="text-[10px] font-bold text-black dark:text-white underline"
                  >
                    Create one
                  </button>
                </div>
              ) : (
                <div ref={catRef} className="relative">
                  <button
                    onClick={() => setCatOpen(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-(--admin-border) bg-white dark:bg-zinc-800 text-sm hover:border-(--admin-field-border) transition-colors"
                  >
                    <span className={category ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-500'}>
                      {category ? (categories.find(c => c.slug === category)?.name ?? category) : 'No category'}
                    </span>
                    <HiChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${catOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {catOpen && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1.5 bg-(--admin-card) border border-(--admin-border) rounded-xl z-50 overflow-hidden py-1 shadow-xl"
                    >
                      <button
                        onClick={() => { setCategory(''); setCatOpen(false) }}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <span className="text-zinc-500">No category</span>
                        {category === '' && <HiCheck className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-100" />}
                      </button>
                      <div className="h-px bg-(--admin-edge) mx-2" />
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => { setCategory(cat.slug); setCatOpen(false) }}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <HiTag className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
                            <span className="text-zinc-700 dark:text-zinc-200 font-medium">{cat.name}</span>
                          </div>
                          {category === cat.slug && <HiCheck className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-100" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SKU */}
            <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-5">
              <label className={labelCls}>SKU</label>
              <input
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="e.g. SHIRT-001"
                className={`${inputCls} font-mono`}
              />
              <p className="text-[10px] text-zinc-500 mt-1.5">Stock Keeping Unit, optional</p>
            </div>

            {/* The same search listing the edit form carries, so a product is
                not created blind and then fixed for search afterwards. */}
            <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-5 space-y-4">
              <label className={labelCls}>Search engine listing</label>

              <div className="rounded-xl border border-(--admin-border) p-3.5">
                <p className="text-[15px] text-blue-700 dark:text-blue-400 truncate">
                  {seoTitle.trim() || title || 'Product title'}
                </p>
                <p className="text-[12px] text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">
                  {seoDescription.trim() || description.trim() || 'Add a description so this reads well in results.'}
                </p>
              </div>

              <div className="group/ai">
                <AiFieldLabel
                  label="Page title"
                  storeId={storeId}
                  kind="seo-title"
                  current={seoTitle || title}
                  hint={`the search result title for "${title || 'a product'}"`}
                  onWrite={setSeoTitle}
                  labelClassName={labelCls}
                >
                  <span className={`text-[10px] tabular-nums ${seoTitle.length > 60 ? 'text-amber-600' : 'text-zinc-500'}`}>
                    {seoTitle.length}/60
                  </span>
                </AiFieldLabel>
                <input
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  placeholder={title || 'Uses the product title'}
                  className={inputCls}
                />
              </div>

              <div className="group/ai">
                <AiFieldLabel
                  label="Meta description"
                  storeId={storeId}
                  kind="seo-description"
                  current={seoDescription || description}
                  hint={`the search result description for "${title || 'a product'}"`}
                  onWrite={setSeoDescription}
                  labelClassName={labelCls}
                >
                  <span className={`text-[10px] tabular-nums ${seoDescription.length > 160 ? 'text-amber-600' : 'text-zinc-500'}`}>
                    {seoDescription.length}/160
                  </span>
                </AiFieldLabel>
                <textarea
                  value={seoDescription}
                  onChange={e => setSeoDescription(e.target.value)}
                  rows={3}
                  placeholder="Uses the product description"
                  className={`${inputCls} resize-none`}
                />
              </div>

              <p className={hintCls}>
                Leave either blank to use the product&apos;s own title and description.
              </p>
            </div>
          </div>
        </div>
      </div>

      {categoryModal && (
        <CategoryFormModal
          storeId={storeId}
          onClose={() => setCategoryModal(false)}
          onCreated={created => {
            setCategories(prev => [...prev, created])
            setCategory(created.slug)
            setCategoryModal(false)
          }}
        />
      )}

      {viewing !== null && (imagePreview || typeof viewing === 'number') && (
        <ImagePreviewModal
          storeId={storeId}
          productTitle={title}
          onClose={() => setViewing(null)}
          url={viewing === 'main' ? (imagePreview ?? '') : extraImages[viewing].url}
          alt={viewing === 'main' ? imageAlt : extraImages[viewing].alt}
          context={viewing === 'main' ? 'the main product photo' : 'one of several gallery shots of this product'}
          onAltChange={v =>
            viewing === 'main'
              ? setImageAlt(v)
              : setExtraImages(imgs => imgs.map((g, j) => (j === viewing ? { ...g, alt: v } : g)))
          }
        />
      )}

      {libraryOpen && (
        <MediaLibraryModal
          storeId={storeId}
          accept="image"
          onClose={() => setLibraryOpen(false)}
          onSelect={url => {
            setImageFile(null)
            setGeneratedUrl(url)
            setImagePreview(url)
            setLibraryOpen(false)
          }}
        />
      )}

      <AiImageModal
        open={imageAiOpen}
        onClose={() => setImageAiOpen(false)}
        storeId={storeId}
        seed={title}
        onApply={url => {
          setImageFile(null)
          setGeneratedUrl(url)
          setImagePreview(url)
        }}
      />
    </div>
  )
}
