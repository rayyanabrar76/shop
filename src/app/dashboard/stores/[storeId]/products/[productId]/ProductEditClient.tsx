'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  HiArrowLeft, HiCheck, HiTag,
  HiChevronDown, HiEye, HiPlus, HiTrash, HiX,
} from 'react-icons/hi'
import MediaPicker from '@/components/MediaPicker'

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
  position: number
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
  imageUrl: string | null
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

const inputCls = 'w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600'
const labelCls = 'text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5 block'

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
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
      >
        <span className={selected ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}>{selected?.label ?? placeholder}</span>
        <HiChevronDown className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl z-50 overflow-hidden py-1 shadow-lg dark:shadow-black/30">
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

export default function ProductEditClient({ storeId, product, categories }: {
  storeId: string
  product: Product
  categories: Category[]
}) {
  const router = useRouter()

  const [title, setTitle] = useState(product.title)
  const [description, setDescription] = useState(product.description ?? '')
  const [price, setPrice] = useState(String(product.price))
  const [inventory, setInventory] = useState(String(product.inventory))
  const [status, setStatus] = useState(product.status)
  const [category, setCategory] = useState(product.category ?? '')
  const [sku, setSku] = useState(product.sku ?? '')
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? '')

  const [extraImages, setExtraImages] = useState<string[]>(
    product.images.map(i => i.url).filter(u => u !== product.imageUrl)
  )
  const [addingImage, setAddingImage] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')

  const [variants, setVariants] = useState<VariantLocal[]>(
    product.variants.map(v => ({
      id: v.id,
      name: v.name,
      options: v.options.map(o => ({
        id: o.id,
        label: o.label,
        priceOverride: o.priceOverride !== null ? String(o.priceOverride) : '',
        inventory: String(o.inventory),
        sku: o.sku ?? '',
      })),
    }))
  )

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const statusOptions = [
    { value: 'active', label: 'Published' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'ARCHIVED', label: 'Archived' },
  ]

  const categoryOptions = [
    { value: '', label: 'No category' },
    ...categories.map(c => ({ value: c.slug, label: c.name })),
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
    setSaving(true); setError(''); setSaved(false)
    try {
      const allImages = [
        ...(imageUrl ? [imageUrl] : []),
        ...extraImages.filter(u => u && u !== imageUrl),
      ]
      const res = await fetch(`/api/stores/${storeId}/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description,
          price: parseInt(price),
          inventory: parseInt(inventory) || 0,
          status, category: category || null,
          sku: sku || null,
          imageUrl: imageUrl || null,
          images: allImages,
          variants: variants.map(v => ({
            id: v.isNew ? undefined : v.id,
            name: v.name,
            options: v.options.map(o => ({
              id: o.isNew ? undefined : o.id,
              label: o.label,
              priceOverride: o.priceOverride ? parseInt(o.priceOverride) : null,
              inventory: parseInt(o.inventory) || 0,
              sku: o.sku || null,
            })),
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const isValid = title.trim().length > 0 && price !== '' && Number(price) > 0

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200">
              <HiArrowLeft className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate max-w-72">{product.title}</h1>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Edit product details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><HiCheck className="w-3.5 h-3.5" /> Saved</span>}
            {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
            <Link href={`/store/${product.store.subdomain}/products/${product.id}`} target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <HiEye className="w-3.5 h-3.5" /> View Live
            </Link>
            <button onClick={handleSave} disabled={saving || !isValid}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50">
              <HiCheck className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Title + Description */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 space-y-4">
              <div>
                <label className={labelCls}>Product Title <span className="text-red-400">*</span></label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className={`${inputCls} ${title.trim() === '' ? 'border-red-200 dark:border-red-900' : ''}`} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} className={`${inputCls} resize-none`} />
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
              <p className={labelCls}>Pricing & Inventory</p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">Price (cents) <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-xs">¢</span>
                    <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)}
                      onKeyDown={e => ['e','E','+','-'].includes(e.key) && e.preventDefault()}
                      className={`w-full rounded-xl border pl-7 pr-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 ${price === '' || Number(price) <= 0 ? 'border-red-200 dark:border-red-900' : 'border-zinc-200 dark:border-zinc-700'}`} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">Stock Level</label>
                  <input type="number" value={inventory} onChange={e => setInventory(e.target.value)} className={inputCls} />
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">Stock is used when no variants. Set inventory per variant option below.</p>
            </div>

            {/* Images */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 space-y-4">
              <label className={labelCls}>Product Images</label>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Main image</p>
                <MediaPicker storeId={storeId} value={imageUrl} onChange={setImageUrl} accept="image" />
              </div>

              {extraImages.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Gallery images</p>
                  <div className="flex flex-wrap gap-2">
                    {extraImages.map((url, i) => (
                      <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setExtraImages(imgs => imgs.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <HiX className="w-3 h-3" />
                        </button>
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
                        if (newImageUrl) { setExtraImages(imgs => [...imgs, newImageUrl]); setNewImageUrl('') }
                        setAddingImage(false)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-bold"
                    >Add</button>
                    <button onClick={() => { setAddingImage(false); setNewImageUrl('') }}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
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
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className={labelCls + ' mb-0'}>Variants</label>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">e.g. Size, Color — each with its own inventory</p>
                </div>
                <button onClick={addVariant}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <HiPlus className="w-3.5 h-3.5" /> Add variant
                </button>
              </div>

              {variants.length === 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
                  No variants — product sells as a single item
                </p>
              )}

              {variants.map(variant => (
                <div key={variant.id} className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700">
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
                    <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase px-1">
                      <span>Label</span>
                      <span>Price (¢)</span>
                      <span>Stock</span>
                      <span></span>
                    </div>
                    {variant.options.map(opt => (
                      <div key={opt.id} className="grid grid-cols-4 gap-2 items-center">
                        <input value={opt.label} onChange={e => updateOption(variant.id, opt.id, 'label', e.target.value)}
                          placeholder="e.g. Small"
                          className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50" />
                        <input type="number" value={opt.priceOverride} onChange={e => updateOption(variant.id, opt.id, 'priceOverride', e.target.value)}
                          placeholder="Base"
                          className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50" />
                        <input type="number" value={opt.inventory} onChange={e => updateOption(variant.id, opt.id, 'inventory', e.target.value)}
                          placeholder="0"
                          className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50" />
                        <button onClick={() => removeOption(variant.id, opt.id)}
                          className="justify-self-end p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all">
                          <HiX className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addOption(variant.id)}
                      className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors mt-1 font-medium">
                      <HiPlus className="w-3 h-3" /> Add option
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right ── */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
              <label className={labelCls}>Status</label>
              <div className="mt-2">
                <CustomDropdown options={statusOptions} value={status} onChange={setStatus} />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <label className={labelCls + ' mb-0'}>Category</label>
                <Link href={`/dashboard/stores/${storeId}/categories`} className="text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  <HiTag className="w-3 h-3" /> Manage
                </Link>
              </div>
              {categories.length === 0 ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">No categories yet</span>
                  <Link href={`/dashboard/stores/${storeId}/categories`} className="text-[10px] font-bold text-black dark:text-white underline">Create one</Link>
                </div>
              ) : (
                <CustomDropdown options={categoryOptions} value={category} onChange={setCategory} placeholder="No category"
                  renderOption={opt => (
                    <div className="flex items-center gap-2">
                      {opt.value && <HiTag className="w-3 h-3 text-zinc-300 dark:text-zinc-600 shrink-0" />}
                      <span className={opt.value ? 'text-zinc-700 dark:text-zinc-200 font-medium' : 'text-zinc-400 dark:text-zinc-500'}>{opt.label}</span>
                    </div>
                  )} />
              )}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
              <label className={labelCls}>SKU</label>
              <input value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. SHIRT-001" className={`${inputCls} font-mono`} />
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">Stock Keeping Unit — optional</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 space-y-3">
              <label className={labelCls}>Info</label>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 dark:text-zinc-500">Product ID</span>
                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md truncate max-w-32">{product.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 dark:text-zinc-500">Created</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(product.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
