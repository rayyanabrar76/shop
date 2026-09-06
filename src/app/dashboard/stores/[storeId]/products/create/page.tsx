'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  HiArrowLeft, HiCheck, HiX, HiUpload,
  HiExclamation, HiTag, HiChevronDown, HiEye,
} from 'react-icons/hi'
import { useDashboardPrice, useDashboardCurrency } from '@/components/CurrencyProvider'
import { currencySymbol, currencyDecimals, inputToAmount } from '@/lib/currency'

interface Category {
  id: string
  name: string
  slug: string
}

const inputCls = 'w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600'
const labelCls = 'text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5 block'

export default function CreateProductPage() {
  const price_ = useDashboardPrice()
  const storeCurrency = useDashboardCurrency()
  const router = useRouter()
  const params = useParams()
  const storeId = params.storeId as string

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [inventory, setInventory] = useState('')
  const [category, setCategory] = useState('')
  const [sku, setSku] = useState('')
  const [status, setStatus] = useState<'active' | 'DRAFT'>('active')
  const [categories, setCategories] = useState<Category[]>([])
  const [catOpen, setCatOpen] = useState(false)
  const catRef = useRef<HTMLDivElement>(null)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [primaryColor, setPrimaryColor] = useState('#6c47ff')
  const [borderRadius, setBorderRadius] = useState('0.75rem')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/stores/${storeId}/categories`)
      .then(r => r.json())
      .then(data => setCategories(data.categories ?? []))
      .catch(() => {})
    fetch(`/api/stores/${storeId}/theme`)
      .then(r => r.json())
      .then(data => {
        if (data?.primaryColor) setPrimaryColor(data.primaryColor)
        if (data?.borderRadius) setBorderRadius(data.borderRadius)
      })
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

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      let imageUrl: string | null = null
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
          status, imageUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); setLoading(false); return }
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
      let imageUrl: string | null = null
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
          status, imageUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); setLoading(false); return }
      window.open(`/store/${data.subdomain}/products/${data.id}`, '_blank')
      router.push(`/dashboard/stores/${storeId}/products/${data.id}`)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/stores/${storeId}/products`}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <HiArrowLeft className="w-4 h-4" />
            </Link>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">New Product</h1>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Create a new item for your storefront</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {error && (
              <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                <HiExclamation className="w-3.5 h-3.5" /> {error}
              </span>
            )}
            {title.trim() && price && Number(price) > 0 && !loading && (
              <button
                onClick={handleSaveAndView}
                title="Save & view live on store"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <HiEye className="w-3.5 h-3.5" />
                View Live
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !price || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-40"
            >
              <HiCheck className="w-3.5 h-3.5" />
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left: main fields ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Title + Description */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 space-y-4">
              <div>
                <label className={labelCls}>Product Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Classic White Tee"
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your product..."
                  rows={5}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
              <p className={labelCls}>Pricing & Inventory</p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-sm">{currencySymbol(storeCurrency)}</span>
                    <input
                      type="number"
                      min="0"
                      step={currencyDecimals(storeCurrency) === 0 ? "1" : "0.01"}
                      value={price}
                      onChange={e => {
                        const val = e.target.value
                        if (val === '' || Number(val) >= 0) setPrice(val)
                      }}
                      onKeyDown={e => {
                        if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault()
                      }}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 pl-7 pr-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
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
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
              <label className={labelCls}>Product Image</label>
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-2 relative rounded-xl border-2 border-dashed cursor-pointer transition-all flex items-center justify-center overflow-hidden
                  ${imagePreview ? 'border-zinc-200 dark:border-zinc-700' : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 bg-zinc-50/60 dark:bg-zinc-800/50'}`}
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
                    <button
                      onClick={e => { e.stopPropagation(); setImagePreview(null); setImageFile(null) }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black transition-colors"
                    >
                      <HiX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <HiUpload className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Click to upload</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">or drag and drop · PNG, JPG, WEBP</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: settings ── */}
          <div className="space-y-4">

            {/* Live Preview */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4">
              <p className={labelCls}>Card Preview</p>
              <div
                className="mt-2 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 flex flex-col"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                {/* Image */}
                <div className="relative bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0" style={{ height: 170 }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  )}
                  {category && (
                    <span
                      className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: primaryColor + '18', color: primaryColor }}
                    >
                      {category}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col gap-2 bg-white dark:bg-zinc-900">
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 line-clamp-2 min-h-5">
                    {title || <span className="text-zinc-300 dark:text-zinc-600 font-normal">Product title...</span>}
                  </p>
                  <p className="font-black text-sm" style={{ color: price ? '#09090b' : '#d4d4d8' }}>
                    {price_(Math.round(parseFloat(price || '0') * 100))}
                  </p>
                  <div
                    className="w-full py-2 text-center text-[11px] font-bold text-white"
                    style={{ backgroundColor: primaryColor, borderRadius }}
                  >
                    Add to Cart
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 text-center">Updates as you type</p>
            </div>

            {/* Status */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
              <label className={labelCls}>Status</label>
              <div className="flex gap-2 mt-2">
                {(['active', 'DRAFT'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border
                      ${status === s
                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                        : 'bg-white dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300'
                      }`}
                  >
                    {s === 'active' ? 'Published' : 'Draft'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category — custom dropdown */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <label className={labelCls + ' mb-0'}>Category</label>
                <Link
                  href={`/dashboard/stores/${storeId}/categories`}
                  className="text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  <HiTag className="w-3 h-3" /> Manage
                </Link>
              </div>

              {categories.length === 0 ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">No categories yet</span>
                  <Link href={`/dashboard/stores/${storeId}/categories`} className="text-[10px] font-bold text-black dark:text-white underline">
                    Create one
                  </Link>
                </div>
              ) : (
                <div ref={catRef} className="relative">
                  <button
                    onClick={() => setCatOpen(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                  >
                    <span className={category ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}>
                      {category || 'No category'}
                    </span>
                    <HiChevronDown className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform ${catOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {catOpen && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl z-50 overflow-hidden py-1 shadow-xl"
                    >
                      <button
                        onClick={() => { setCategory(''); setCatOpen(false) }}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <span className="text-zinc-400 dark:text-zinc-500">No category</span>
                        {category === '' && <HiCheck className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-100" />}
                      </button>
                      <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-2" />
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => { setCategory(cat.name); setCatOpen(false) }}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <HiTag className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
                            <span className="text-zinc-700 dark:text-zinc-200 font-medium">{cat.name}</span>
                          </div>
                          {category === cat.name && <HiCheck className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-100" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SKU */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
              <label className={labelCls}>SKU</label>
              <input
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="e.g. SHIRT-001"
                className={`${inputCls} font-mono`}
              />
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">Stock Keeping Unit — optional</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
