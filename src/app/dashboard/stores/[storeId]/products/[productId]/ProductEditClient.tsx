'use client'

import { useState, useRef, useEffect } from 'react'
import { storeUrl } from '@/lib/config'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  HiCheck, HiTag, HiCube, HiChevronRight,
  HiChevronDown, HiEye, HiPlus, HiTrash, HiX,
} from 'react-icons/hi'
import { HiPhoto } from 'react-icons/hi2'
import MediaPicker from '@/components/MediaPicker'
import AiFieldLabel from '@/components/ai/AiFieldLabel'
import AiImageModal from '@/components/ai/AiImageModal'
import TagsInput from '@/components/TagsInput'
import CategoryFormModal from '@/components/CategoryFormModal'
import { useDashboardCurrency } from '@/components/CurrencyProvider'
import { amountToInput, currencySymbol, inputToAmount } from '@/lib/currency'

interface Category { id: string; name: string; slug: string }

interface VariantOptionLocal {
  id: string
  label: string
  priceOverride: string
  inventory: string
  sku: string
  isNew?: boolean
}

interface VariantLocal {
  id: string
  name: string
  options: VariantOptionLocal[]
  isNew?: boolean
}

interface ProductImage {
  id: string
  url: string
  alt: string | null
  position: number
}

/** A gallery image while it is being edited: url plus its description. */
interface GalleryImage {
  url: string
  alt: string
}

interface Product {
  id: string
  title: string
  description: string | null
  price: number
  inventory: number
  status: string
  category: string | null
  sku: string | null
  tags: string[]
  imageUrl: string | null
  slug: string | null
  seoTitle: string | null
  seoDescription: string | null
  imageAlt: string | null
  createdAt: Date
  store: { subdomain: string }
  images: ProductImage[]
  variants: {
    id: string
    name: string
    options: {
      id: string
      label: string
      priceOverride: number | null
      inventory: number
      sku: string | null
    }[]
  }[]
}

import { inputCls, labelCls } from '@/components/dashboard/field-styles'
import AmountInput from '@/components/dashboard/AmountInput'
import AltTextField from '@/components/dashboard/AltTextField'
import ImagePreviewModal from '@/components/dashboard/ImagePreviewModal'

function CustomDropdown({ options, value, onChange, placeholder = 'Select...', renderOption }: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  renderOption?: (opt: { value: string; label: string }) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-(--admin-border) bg-white dark:bg-zinc-800 text-sm hover:border-(--admin-field-border) transition-colors"
      >
        <span className={selected ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-500'}>{selected?.label ?? placeholder}</span>
        <HiChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-zinc-800 border border-(--admin-border) rounded-xl z-50 overflow-hidden py-1 shadow-lg dark:shadow-black/30">
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
              {renderOption ? renderOption(opt) : <span className="text-zinc-700 dark:text-zinc-200 font-medium">{opt.label}</span>}
              {value === opt.value && <HiCheck className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-100 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductEditClient({ storeId, product, categories, embedded = false, onSaved }: {
  storeId: string
  product: Product
  categories: Category[]
  /** Renders without the page chrome, for the visual editor's modal. */
  embedded?: boolean
  /** Fired after a successful save so the caller can refresh its preview. */
  onSaved?: () => void
}) {
  const router = useRouter()
  const currency = useDashboardCurrency()

  const [title, setTitle] = useState(product.title)
  const [description, setDescription] = useState(product.description ?? '')
  const [price, setPrice] = useState(amountToInput(product.price, currency))
  const [inventory, setInventory] = useState(String(product.inventory))
  const [status, setStatus] = useState(product.status)
  const [category, setCategory] = useState(product.category ?? '')
  const [sku, setSku] = useState(product.sku ?? '')
  const [tags, setTags] = useState<string[]>(product.tags ?? [])
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? '')

  const [imageAiOpen, setImageAiOpen] = useState(false)
  const [categoryModal, setCategoryModal] = useState(false)
  // Local copy so a category created from the modal shows up without a reload.
  const [cats, setCats] = useState<Category[]>(categories)

  const [extraImages, setExtraImages] = useState<GalleryImage[]>(
    product.images
      .filter(i => i.url !== product.imageUrl)
      .map(i => ({ url: i.url, alt: i.alt ?? '' }))
  )
  const [imageAlt, setImageAlt] = useState(product.imageAlt ?? '')
  /** Which image the viewer is showing: the main one, or a gallery index. */
  const [viewing, setViewing] = useState<'main' | number | null>(null)
  const [seoTitle, setSeoTitle] = useState(product.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(product.seoDescription ?? '')
  const [addingImage, setAddingImage] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')

  const [variants, setVariants] = useState<VariantLocal[]>(
    product.variants.map(v => ({
      id: v.id,
      name: v.name,
      options: v.options.map(o => ({
        id: o.id,
        label: o.label,
        priceOverride: o.priceOverride !== null ? amountToInput(o.priceOverride, currency) : '',
        inventory: String(o.inventory),
        sku: o.sku ?? '',
      })),
    }))
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  /**
   * Why the button is animating: 'ok' after a save that worked, 'fail'
   * after one that did not, 'nudge' when something tried to leave the page
   * with edits still unsaved.
   */
  const [flash, setFlash] = useState<'ok' | 'fail' | 'nudge' | null>(null)

  /**
   * Everything the form would send, as one comparable string.
   *
   * Save was previously offered whether or not there was anything to save,
   * so the only way to know whether an edit had been kept was to remember
   * pressing the button. Comparing this against the snapshot taken when the
   * page loaded, and again after each successful save, is what lets the
   * button go quiet when the form matches what the server already has.
   */
  const snapshot = JSON.stringify({
    title, description, price, inventory, status, category, sku, tags,
    imageUrl, extraImages, imageAlt, seoTitle, seoDescription, variants,
  })
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot)
  const dirty = snapshot !== savedSnapshot

  const statusOptions = [
    { value: 'active', label: 'Published' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'ARCHIVED', label: 'Archived' },
  ]

  const categoryOptions = [
    { value: '', label: 'No category' },
    ...cats.map(c => ({ value: c.slug, label: c.name })),
  ]

  function addVariant() {
    setVariants(v => [...v, {
      id: `new-${Date.now()}`,
      name: '',
      options: [{ id: `new-opt-${Date.now()}`, label: '', priceOverride: '', inventory: '0', sku: '', isNew: true }],
      isNew: true,
    }])
  }

  function removeVariant(variantId: string) {
    setVariants(v => v.filter(x => x.id !== variantId))
  }

  function updateVariantName(variantId: string, name: string) {
    setVariants(v => v.map(x => x.id === variantId ? { ...x, name } : x))
  }

  function addOption(variantId: string) {
    setVariants(v => v.map(x => x.id === variantId ? {
      ...x,
      options: [...x.options, { id: `new-opt-${Date.now()}`, label: '', priceOverride: '', inventory: '0', sku: '', isNew: true }],
    } : x))
  }

  function removeOption(variantId: string, optionId: string) {
    setVariants(v => v.map(x => x.id === variantId ? { ...x, options: x.options.filter(o => o.id !== optionId) } : x))
  }

  function updateOption(variantId: string, optionId: string, field: keyof VariantOptionLocal, value: string) {
    setVariants(v => v.map(x => x.id === variantId ? {
      ...x,
      options: x.options.map(o => o.id === optionId ? { ...o, [field]: value } : o),
    } : x))
  }

  async function handleSave() {
    setSaving(true); setError(''); setFlash(null)
    try {
      const allImages = [
        ...(imageUrl ? [{ url: imageUrl, alt: imageAlt }] : []),
        ...extraImages.filter(g => g.url && g.url !== imageUrl),
      ]
      const res = await fetch(`/api/stores/${storeId}/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description,
          price: inputToAmount(price),
          inventory: parseInt(inventory) || 0,
          status, category: category || null,
          sku: sku || null,
          tags,
          imageUrl: imageUrl || null,
          images: allImages,
          imageAlt, seoTitle, seoDescription,
          variants: variants.map(v => ({
            id: v.isNew ? undefined : v.id,
            name: v.name,
            options: v.options.map(o => ({
              id: o.isNew ? undefined : o.id,
              label: o.label,
              priceOverride: o.priceOverride ? inputToAmount(o.priceOverride) : null,
              inventory: parseInt(o.inventory) || 0,
              sku: o.sku || null,
            })),
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      // The form now matches the server, so the button has nothing left
      // to offer and goes quiet on the next render.
      setSavedSnapshot(snapshot)
      setFlash('ok')
      setTimeout(() => setFlash(null), 400)
      // Best effort: the save already succeeded, so a failure refreshing the
      // caller's preview must not be reported as a failed save.
      try { onSaved?.() } catch { /* ignore */ }
      // The dashboard page needs re-rendering; the modal has no server data.
      if (!embedded) router.refresh()
    } catch (e: any) {
      setError(e.message)
      setFlash('fail')
      setTimeout(() => setFlash(null), 450)
    } finally {
      setSaving(false)
    }
  }

  const isValid = title.trim().length > 0 && price !== '' && Number(price) > 0
  const canSave = dirty && isValid && !saving

  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** True while an extra history entry is parked in front of this page. */
  const parked = useRef(false)
  /**
   * Throws the edits away and puts the form back to what the server holds.
   *
   * Read straight out of the snapshot the dirty check compares against, so
   * the two can never disagree about what "unchanged" means: whatever is in
   * there is exactly what makes the Save button go quiet again.
   */
  function discard() {
    const was = JSON.parse(savedSnapshot)
    setTitle(was.title); setDescription(was.description); setPrice(was.price)
    setInventory(was.inventory); setStatus(was.status); setCategory(was.category)
    setSku(was.sku); setTags(was.tags); setImageUrl(was.imageUrl)
    setExtraImages(was.extraImages); setImageAlt(was.imageAlt)
    setSeoTitle(was.seoTitle); setSeoDescription(was.seoDescription)
    setVariants(was.variants)
    setError('')
    setFlash(null)
  }

  /** A stock count is a whole number of things on a shelf: never below none. */
  const atLeastNone = (v: string) => {
    if (v === '') return ''
    const n = Math.floor(Number(v))
    return Number.isFinite(n) && n > 0 ? String(n) : '0'
  }

  /** Points at the Save button rather than letting the edits walk out. */
  function nudgeToSave() {
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current)
    // Dropping the class and putting it back a frame later is what makes a
    // second attempt shake again instead of sitting there already animated.
    setFlash(null)
    requestAnimationFrame(() => setFlash('nudge'))
    nudgeTimer.current = setTimeout(() => setFlash(null), 1600)
  }
  useEffect(() => () => { if (nudgeTimer.current) clearTimeout(nudgeTimer.current) }, [])

  /**
   * Nothing leaves this page with unsaved edits on it.
   *
   * Two exits to cover. A real unload (closing the tab, reloading, following
   * a link out) gets the browser's own confirm, which is the only thing that
   * can stop it. Everything inside the app is a link the router handles, so
   * those are caught on the way down and turned into a shake of the Save
   * button instead: the answer to "where did my edits go" should be visible
   * on the page, not in a dialog that appears somewhere else.
   *
   * The browser's own Back button is caught too, by parking one extra
   * history entry for this same URL while there are edits pending. Back
   * then lands on that entry rather than on the previous page, the entry is
   * put straight back, and the button shakes. The entry is handed back the
   * moment the form is clean again, so Back behaves normally from then on.
   */
  useEffect(() => {
    if (!dirty || embedded) return

    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }

    const onClick = (e: MouseEvent) => {
      // A modified click is the reader asking for a new tab, which leaves
      // this page exactly where it is.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname) return
      e.preventDefault()
      e.stopPropagation()
      nudgeToSave()
    }

    const onPopState = () => {
      // Back consumed the parked entry, so park another one. The stack ends
      // up the same length it was, one entry deeper than the real page.
      window.history.pushState(null, '', window.location.href)
      nudgeToSave()
    }

    window.history.pushState(null, '', window.location.href)
    parked.current = true
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('popstate', onPopState)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('popstate', onPopState)
      document.removeEventListener('click', onClick, true)
    }
  }, [dirty, embedded])

  /**
   * Hands the parked entry back once the form is clean.
   *
   * It points at this same URL, so going back through it is invisible: the
   * page does not move, the history stack returns to its real depth, and the
   * next Back press leaves the way it always would have.
   */
  useEffect(() => {
    if (dirty || !parked.current) return
    parked.current = false
    window.history.back()
  }, [dirty])

  return (
    <div className={embedded ? '' : 'min-h-full bg-(--admin-page)'}>
      <div className={embedded ? 'p-4 sm:p-5' : 'max-w-5xl px-4 md:px-6 pt-5 md:pt-6 pb-10'}>
        {/* Header, the modal supplies its own title, so only actions there */}
        <div className={`flex items-center justify-between gap-3 ${embedded ? 'mb-4' : 'mb-5'}`}>
          {embedded ? <div /> : (
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                onClick={() => (dirty ? nudgeToSave() : router.back())}
                aria-label="Back"
                className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
              >
                <HiCube className="w-4 h-4" />
              </button>
              <HiChevronRight className="w-3.5 h-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" />
              <h1 className="truncate text-[13px] md:text-[15px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{product.title}</h1>
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <span className="hidden sm:inline min-w-0 truncate text-[11.5px]">
              {error
                ? <span className="text-red-500 font-medium">{error}</span>
                : flash === 'nudge'
                  ? <span className="font-medium text-amber-600 dark:text-amber-400">Save your changes first</span>
                  : dirty
                    ? <span className="text-zinc-500">Unsaved changes</span>
                    : null}
            </span>
            <Link href={storeUrl(product.store.subdomain, `/products/${product.slug || product.id}?owner=1`)} target="_blank"
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-(--admin-border) bg-(--admin-card) px-3 text-[11.5px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 hover:border-(--admin-field-border) transition-colors">
              <HiEye className="w-3.5 h-3.5" /> <span className="hidden sm:inline">View live</span>
            </Link>
            {dirty && (
              <button
                onClick={discard}
                disabled={saving}
                title="Discard your changes"
                className="flex h-8 shrink-0 items-center rounded-lg border border-(--admin-border) bg-(--admin-card) px-3 text-[11.5px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
            )}
            {/* Nothing edited yet? Then this is a plain grey button rather
                than a dimmed dark one: half-opacity black on a white card
                still reads as the primary action of the page. */}
            <button onClick={handleSave} disabled={!canSave}
              title={dirty ? undefined : 'No changes to save'}
              className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[11.5px] font-semibold transition-colors disabled:cursor-not-allowed ${
                canSave || saving
                  ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
              } ${flash === 'ok' ? 'admin-pop' : flash ? 'admin-shake' : ''}`}>
              <HiCheck className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : <><span className="sm:hidden">Save</span><span className="hidden sm:inline">Save changes</span></>}
            </button>
          </div>
        </div>

        <div className={embedded ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-5'}>

          {/* ── Left ── */}
          <div className={embedded ? 'space-y-4' : 'lg:col-span-2 space-y-4'}>

            {/* Title + Description */}
            <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-4 md:p-5 space-y-4">
              {/* group/ai has to sit on the field, not on the row above it:
                  the button reveals on group-hover/ai, so with the group any
                  higher it appeared while the pointer was nowhere near the
                  input it writes. */}
              <div className="group/ai">
                <AiFieldLabel
                  label="Product Title *"
                  storeId={storeId}
                  kind="heading"
                  current={title}
                  hint="the name of a product in this shop"
                  onWrite={setTitle}
                />
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className={`${inputCls} ${title.trim() === '' ? 'border-red-200 dark:border-red-900' : ''}`} />
              </div>
              <div className="group/ai">
                <AiFieldLabel
                  label="Description"
                  storeId={storeId}
                  kind="paragraph"
                  current={description}
                  hint={`the description of the product "${title || 'this product'}"`}
                  onWrite={setDescription}
                />
                <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} className={`${inputCls} resize-none`} />
              </div>
              <div className="group/ai">
                <AiFieldLabel
                  label="Tags"
                  storeId={storeId}
                  kind="keywords"
                  current={tags.join(', ')}
                  context={[
                    `Product title: ${title || '(not written yet)'}`,
                    description.trim() ? `Product description: ${description.trim()}` : null,
                    category ? `Category: ${category}` : null,
                  ].filter(Boolean).join('\n')}
                  hint={`search keywords for the product "${title || 'this product'}"`}
                  onWrite={text => setTags(prev => {
                    // Added to what is there, not swapped for it: a tag you
                    // typed yourself is the one you were surest about.
                    const next = [...prev]
                    for (const raw of text.split(',')) {
                      const tag = raw.trim().toLowerCase().replace(/^#/, '')
                      if (tag && !next.includes(tag) && next.length < 20) next.push(tag)
                    }
                    return next
                  })}
                  labelClassName={labelCls}
                />
                <TagsInput value={tags} onChange={setTags} />
                <p className="text-[10px] text-zinc-500 mt-1.5">
                  Words shoppers might search for. Used for on-site search and SEO keywords.
                </p>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-4 md:p-5">
              <p className={labelCls}>Pricing & Inventory</p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">Price <span className="text-red-400">*</span></label>
                  {/* The symbol sits in the flow rather than absolutely over the
                      field: codes like PKR or CHF are far wider than "$" and
                      overlapped a fixed padding. */}
                  <div className={`flex items-center rounded-xl border overflow-hidden transition-all bg-white dark:bg-zinc-800 focus-within:border-(--admin-field-border-focus) ${price === '' || Number(price) <= 0 ? 'border-red-200 dark:border-red-900' : 'border-(--admin-border)'}`}>
                    <span className="pl-3 pr-1.5 text-zinc-500 text-xs shrink-0 select-none">{currencySymbol(currency)}</span>
                    <AmountInput
                      value={price}
                      onChange={setPrice}
                      currency={currency}
                      aria-label="Price"
                      className="flex-1 min-w-0 pr-3 py-2 text-sm outline-none bg-transparent text-zinc-900 dark:text-zinc-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">Stock Level</label>
                  <input
                    type="number" min="0" step="1"
                    value={inventory}
                    onChange={e => setInventory(atLeastNone(e.target.value))}
                    onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                    className={inputCls}
                  />
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">Stock is used when no variants. Set inventory per variant option below.</p>
            </div>

            {/* Images */}
            <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <label className={labelCls + ' mb-0 min-w-0 truncate'}>Product Images</label>
                <button
                  onClick={() => setImageAiOpen(true)}
                  className="flex shrink-0 h-9 sm:h-auto items-center gap-1.5 px-2.5 sm:py-1.5 rounded-lg border border-(--admin-border) text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-(--admin-field-border) transition-colors"
                >
                  <HiPhoto className="w-3.5 h-3.5 shrink-0" /> Generate with AI
                </button>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Main image</p>
                <MediaPicker storeId={storeId} value={imageUrl} onChange={setImageUrl} accept="image" onOpen={() => setViewing('main')} />
                {imageUrl && (
                  <div className="mt-2">
                    {/* An uploaded file is usually named something like
                        08367.png, which tells a screen reader and an image
                        crawler nothing. This is the line that does. */}
                    <AltTextField
                      storeId={storeId}
                      imageUrl={imageUrl}
                      title={title}
                      value={imageAlt}
                      onChange={setImageAlt}
                      context="the main product photo"
                    />
                  </div>
                )}
              </div>

              {extraImages.length > 0 && (
                <div>
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
                <div className="space-y-2">
                  <MediaPicker storeId={storeId} value={newImageUrl} onChange={setNewImageUrl} accept="image" />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (newImageUrl) { setExtraImages(imgs => [...imgs, { url: newImageUrl, alt: '' }]); setNewImageUrl('') }
                        setAddingImage(false)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-bold"
                    >Add</button>
                    <button onClick={() => { setAddingImage(false); setNewImageUrl('') }}
                      className="px-3 py-1.5 rounded-lg border border-(--admin-border) text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingImage(true)}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors font-medium">
                  <HiPlus className="w-3.5 h-3.5" /> Add gallery image
                </button>
              )}
            </div>

            {/* Variants */}
            <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className={labelCls + ' mb-0'}>Variants</label>
                  <p className="text-xs text-zinc-500 mt-0.5">e.g. Size, Color, each with its own inventory</p>
                </div>
                <button onClick={addVariant}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-(--admin-border) text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <HiPlus className="w-3.5 h-3.5" /> Add variant
                </button>
              </div>

              {variants.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-4 border border-dashed border-(--admin-border) rounded-xl">
                  No variants, product sells as a single item
                </p>
              )}

              {variants.map(variant => (
                <div key={variant.id} className="rounded-xl border border-(--admin-border) overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border-b border-(--admin-border)">
                    <input
                      value={variant.name}
                      onChange={e => updateVariantName(variant.id, e.target.value)}
                      placeholder="Variant name (e.g. Size)"
                      className="flex-1 text-sm font-semibold bg-transparent outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 text-zinc-800 dark:text-zinc-100"
                    />
                    <button onClick={() => removeVariant(variant.id)} className="p-1 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all">
                      <HiTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-zinc-500 uppercase px-1">
                      <span>Label</span>
                      <span>Price ({currencySymbol(currency)})</span>
                      <span>Stock</span>
                      <span></span>
                    </div>
                    {variant.options.map(opt => (
                      <div key={opt.id} className="grid grid-cols-4 gap-2 items-center">
                        <input value={opt.label} onChange={e => updateOption(variant.id, opt.id, 'label', e.target.value)}
                          placeholder="e.g. Small"
                          className="rounded-lg border border-(--admin-field-border) px-2.5 py-1.5 text-sm outline-none focus:border-(--admin-field-border-focus) bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50" />
                        <AmountInput value={opt.priceOverride} currency={currency}
                          onChange={v => updateOption(variant.id, opt.id, 'priceOverride', v)}
                          aria-label="Price override"
                          placeholder="Base"
                          className="rounded-lg border border-(--admin-field-border) px-2.5 py-1.5 text-sm outline-none focus:border-(--admin-field-border-focus) bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50" />
                        <input type="number" min="0" step="1" value={opt.inventory}
                          onChange={e => updateOption(variant.id, opt.id, 'inventory', atLeastNone(e.target.value))}
                          onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                          placeholder="0"
                          className="rounded-lg border border-(--admin-field-border) px-2.5 py-1.5 text-sm outline-none focus:border-(--admin-field-border-focus) bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50" />
                        <button onClick={() => removeOption(variant.id, opt.id)}
                          className="justify-self-end p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all">
                          <HiX className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addOption(variant.id)}
                      className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-black dark:hover:text-white transition-colors mt-1 font-medium">
                      <HiPlus className="w-3 h-3" /> Add option
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right ── */}
          <div className="space-y-4">
            <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-4 md:p-5">
              <label className={labelCls}>Status</label>
              <div className="mt-2">
                <CustomDropdown options={statusOptions} value={status} onChange={setStatus} />
              </div>
            </div>

            <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <label className={labelCls + ' mb-0'}>Category</label>
                {/* A modal, not a link: leaving would drop unsaved edits, and
                    in the visual editor it would close the editor. */}
                <button
                  type="button"
                  onClick={() => setCategoryModal(true)}
                  className="text-[10px] text-zinc-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  <HiTag className="w-3 h-3" /> New category
                </button>
              </div>
              {cats.length === 0 ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-(--admin-edge)">
                  <span className="text-xs text-zinc-500">No categories yet</span>
                  <button type="button" onClick={() => setCategoryModal(true)} className="text-[10px] font-bold text-black dark:text-white underline">Create one</button>
                </div>
              ) : (
                <CustomDropdown options={categoryOptions} value={category} onChange={setCategory} placeholder="No category"
                  renderOption={opt => (
                    <div className="flex items-center gap-2">
                      {opt.value && <HiTag className="w-3 h-3 text-zinc-300 dark:text-zinc-600 shrink-0" />}
                      <span className={opt.value ? 'text-zinc-700 dark:text-zinc-200 font-medium' : 'text-zinc-500'}>{opt.label}</span>
                    </div>
                  )} />
              )}
            </div>

            <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-4 md:p-5">
              <label className={labelCls}>SKU</label>
              <input value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. SHIRT-001" className={`${inputCls} font-mono`} />
              <p className="text-[10px] text-zinc-500 mt-1.5">Stock Keeping Unit, optional</p>
            </div>

            {/* What a search result will look like. The old card in this slot
                showed the product's database id and its creation date, which
                is the one pair of facts a merchant can do nothing with. */}
            <div className="bg-(--admin-card) rounded-2xl border border-(--admin-border) p-4 md:p-5 space-y-4">
              <label className={labelCls}>Search engine listing</label>

              <div className="rounded-xl border border-(--admin-border) p-3.5">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {storeUrl(product.store.subdomain, `/products/${product.slug || product.id}`).replace(/^https?:\/\//, '')}
                </p>
                <p className="text-[15px] text-blue-700 dark:text-blue-400 truncate mt-0.5">
                  {seoTitle.trim() || title || 'Product title'}
                </p>
                <p className="text-[12px] text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">
                  {seoDescription.trim() || description?.trim() || 'Add a description so this reads well in results.'}
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
                  current={seoDescription || description || ''}
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

              <p className="text-[11px] text-zinc-500">
                Leave either blank to use the product&apos;s own title and description.
              </p>
            </div>
          </div>
        </div>
      </div>

      {viewing !== null && (
        <ImagePreviewModal
          storeId={storeId}
          productTitle={title}
          onClose={() => setViewing(null)}
          url={viewing === 'main' ? (imageUrl ?? '') : extraImages[viewing].url}
          alt={viewing === 'main' ? imageAlt : extraImages[viewing].alt}
          context={viewing === 'main' ? 'the main product photo' : 'one of several gallery shots of this product'}
          onAltChange={v =>
            viewing === 'main'
              ? setImageAlt(v)
              : setExtraImages(imgs => imgs.map((g, j) => (j === viewing ? { ...g, alt: v } : g)))
          }
        />
      )}

      {categoryModal && (
        <CategoryFormModal
          storeId={storeId}
          onClose={() => setCategoryModal(false)}
          onCreated={created => {
            setCats(prev => [...prev, created])
            setCategory(created.slug)
            setCategoryModal(false)
          }}
        />
      )}


      <AiImageModal
        open={imageAiOpen}
        onClose={() => setImageAiOpen(false)}
        storeId={storeId}
        seed={title}
        context={[
          `Product title: ${title || '(not written yet)'}`,
          description.trim() ? `Product description: ${description.trim()}` : null,
          category ? `Category: ${category}` : null,
        ].filter(Boolean).join('\n')}
        onApply={url => {
          // An existing main image is kept as a gallery shot rather than lost.
          if (imageUrl && imageUrl !== url) {
            setExtraImages(imgs => imgs.some(g => g.url === imageUrl) ? imgs : [...imgs, { url: imageUrl, alt: imageAlt }])
          }
          setImageUrl(url)
        }}
      />
    </div>
  )
}
