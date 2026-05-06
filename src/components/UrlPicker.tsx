'use client'

import { useState, useEffect } from 'react'
import {
  ChevronDown, ChevronUp, Plus, Home, Hash, CreditCard,
  Globe, Check, ShoppingBag,
} from 'lucide-react'
import AddPageModal, { type PageResult } from './AddPageModal'

interface StorePage {
  id: string
  name: string
  slug: string
  type: string
}

interface StoreProduct {
  id: string
  title: string
  status: string
}

interface UrlPickerProps {
  storeId: string
  subdomain: string
  value: string
  onChange: (url: string) => void
  placeholder?: string
  onPageCreated?: (page: { id: string; type: string; name: string; slug: string; content: unknown }) => void
}

const BUILT_IN = (sub: string) => [
  { label: 'Home',     url: `/store/${sub}`,          Icon: Home },
  { label: 'Products', url: '#products',               Icon: Hash },
  { label: 'Checkout', url: `/store/${sub}/checkout`,  Icon: CreditCard },
]

export default function UrlPicker({
  storeId,
  subdomain,
  value,
  onChange,
  placeholder = 'Select a page or enter URL',
  onPageCreated,
}: UrlPickerProps) {
  const [open, setOpen] = useState(false)
  const [pages, setPages] = useState<StorePage[]>([])
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetch(`/api/stores/${storeId}/pages`)
      .then(r => r.ok ? r.json() : [])
      .then(setPages)
      .catch(() => {})
    fetch(`/api/stores/${storeId}/products`)
      .then(r => r.ok ? r.json() : [])
      .then(setProducts)
      .catch(() => {})
  }, [storeId])

  const builtIn = BUILT_IN(subdomain)

  function getLabelForUrl(url: string): string | null {
    if (!url) return null
    const bi = builtIn.find(r => r.url === url)
    if (bi) return bi.label
    const page = pages.find(p => `/store/${subdomain}/${p.slug}` === url)
    if (page) return page.name
    const product = products.find(p => `/store/${subdomain}/products/${p.id}` === url)
    if (product) return product.title
    return null
  }

  const label = getLabelForUrl(value)
  const displayValue = label ?? value

  function select(url: string) {
    onChange(url)
    setOpen(false)
  }

  async function openModal() {
    setOpen(false)
    try {
      const res = await fetch(`/api/stores/${storeId}/pages`)
      if (res.ok) setPages(await res.json())
    } catch {}
    setShowModal(true)
  }

  function handlePageModalCreated(page: PageResult) {
    const alreadyInList = pages.some(p => p.id === page.id)
    if (!alreadyInList) {
      setPages(prev => [...prev, page as StorePage])
      onPageCreated?.(page)
    }
    select(`/store/${subdomain}/${page.slug}`)
  }

  return (
    <div>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
      >
        <span className={`truncate ${value ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}`}>
          {value ? displayValue : placeholder}
        </span>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
          : <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
        }
      </button>

      {/* Inline dropdown */}
      {open && (
        <div className="mt-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">

          {/* Built-in routes */}
          <div className="p-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 px-2 py-1">Built-in</p>
            {builtIn.map(r => (
              <button
                key={r.url}
                type="button"
                onClick={() => select(r.url)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
              >
                <r.Icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">{r.label}</span>
                {value === r.url && <Check className="w-3 h-3 text-zinc-900 shrink-0" />}
              </button>
            ))}
          </div>

          {/* Custom pages */}
          {pages.length > 0 && (
            <>
              <div className="border-t border-zinc-100 dark:border-zinc-800" />
              <div className="p-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 px-2 py-1">Your Pages</p>
                {pages.map(p => {
                  const url = `/store/${subdomain}/${p.slug}`
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => select(url)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                    >
                      <Globe className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">{p.name}</span>
                      {value === url && <Check className="w-3 h-3 text-zinc-900 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Products */}
          {products.length > 0 && (
            <>
              <div className="border-t border-zinc-100 dark:border-zinc-800" />
              <div className="p-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 px-2 py-1">Products</p>
                <div className="max-h-40 overflow-y-auto space-y-0.5 thin-scrollbar">
                  {products.map(p => {
                    const url = `/store/${subdomain}/products/${p.id}`
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => select(url)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1 truncate">{p.title}</span>
                        {value === url && <Check className="w-3 h-3 text-zinc-900 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Add New Page */}
          <div className="border-t border-zinc-100 dark:border-zinc-800" />
          <div className="p-2">
            <button
              type="button"
              onClick={openModal}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                <Plus className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Add New Page</span>
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <AddPageModal
          storeId={storeId}
          subdomain={subdomain}
          existingPages={pages}
          onCreated={handlePageModalCreated}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
