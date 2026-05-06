'use client'

import { useState } from 'react'
import {
  Globe, X,
  Users, Mail, HelpCircle, BookOpen,
  Package, Shield, FileText, Layers,
} from 'lucide-react'

export interface PageResult {
  id: string
  type: string
  name: string
  slug: string
  content: unknown
}

export const PAGE_TEMPLATES = [
  { type: 'about',    name: 'About Us',        slug: 'about-us',        Icon: Users,       desc: 'Your brand story' },
  { type: 'contact',  name: 'Contact Us',       slug: 'contact',         Icon: Mail,        desc: 'Get in touch' },
  { type: 'faq',      name: 'FAQ',              slug: 'faq',             Icon: HelpCircle,  desc: 'Common questions' },
  { type: 'blog',     name: 'Blog',             slug: 'blog',            Icon: BookOpen,    desc: 'Articles & updates' },
  { type: 'shipping', name: 'Shipping Policy',  slug: 'shipping-policy', Icon: Package,     desc: 'Delivery info' },
  { type: 'privacy',  name: 'Privacy Policy',   slug: 'privacy-policy',  Icon: Shield,      desc: 'Data handling' },
  { type: 'terms',    name: 'Terms of Service', slug: 'terms',           Icon: FileText,    desc: 'Legal terms' },
  { type: 'custom',   name: 'Custom Page',      slug: '',                Icon: Layers,      desc: 'Name it yourself' },
]

interface AddPageModalProps {
  storeId: string
  subdomain: string
  existingPages: Array<{ id: string; slug: string; name: string }>
  onCreated: (page: PageResult) => void
  onClose: () => void
}

export default function AddPageModal({ storeId, subdomain, existingPages, onCreated, onClose }: AddPageModalProps) {
  const [selectedTpl, setSelectedTpl] = useState<typeof PAGE_TEMPLATES[0] | null>(null)
  const [customName, setCustomName] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [creating, setCreating] = useState(false)

  const effectiveSlug = selectedTpl?.type === 'custom' ? customSlug : (selectedTpl?.slug ?? '')
  const canCreate = !!selectedTpl && !!effectiveSlug && (selectedTpl.type !== 'custom' || !!customName)

  function pickTemplate(tpl: typeof PAGE_TEMPLATES[0]) {
    setSelectedTpl(tpl)
    if (tpl.type === 'custom') {
      setCustomName('')
      setCustomSlug('')
    } else {
      setCustomName(tpl.name)
      setCustomSlug(tpl.slug)
    }
  }

  async function handleCreate() {
    if (!selectedTpl || !canCreate) return
    const name = selectedTpl.type === 'custom' ? customName : selectedTpl.name
    const slug = effectiveSlug
    setCreating(true)
    try {
      const res = await fetch(`/api/stores/${storeId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedTpl.type, name, slug }),
      })
      if (res.ok) {
        onCreated(await res.json())
        onClose()
      } else if (res.status === 409) {
        const existing = existingPages.find(p => p.slug === slug)
        if (existing) onCreated(existing as PageResult)
        onClose()
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 max-h-[90vh] overflow-y-auto thin-scrollbar">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Add New Page</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PAGE_TEMPLATES.map(tpl => {
            const isSelected = selectedTpl?.type === tpl.type
            const existingPage = tpl.slug ? existingPages.find(p => p.slug === tpl.slug) : null
            const alreadyExists = !!existingPage

            if (alreadyExists) {
              return (
                <button
                  key={tpl.type}
                  type="button"
                  onClick={() => { onCreated(existingPage as PageResult); onClose() }}
                  className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-left"
                >
                  <tpl.Icon className="w-4 h-4 mb-1.5 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-xs font-bold leading-tight text-zinc-400 dark:text-zinc-500">{tpl.name}</p>
                  <p className="text-[10px] mt-0.5 text-zinc-400 dark:text-zinc-500 font-semibold">Select existing</p>
                </button>
              )
            }

            return (
              <button
                key={tpl.type}
                type="button"
                onClick={() => pickTemplate(tpl)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <tpl.Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} />
                <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-zinc-800 dark:text-zinc-100'}`}>{tpl.name}</p>
                <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-400 dark:text-zinc-500'}`}>{tpl.desc}</p>
              </button>
            )
          })}
        </div>

        {selectedTpl?.type === 'custom' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 block">Page Name</label>
              <input
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                placeholder="e.g. Our Story"
                value={customName}
                onChange={e => {
                  const v = e.target.value
                  setCustomName(v)
                  setCustomSlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                }}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 block">URL Slug</label>
              <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden focus-within:border-zinc-400 dark:focus-within:border-zinc-500 transition-colors">
                <span className="px-2 text-xs text-zinc-400 dark:text-zinc-500 py-2 bg-zinc-50 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 whitespace-nowrap shrink-0">/{subdomain}/</span>
                <input
                  className="flex-1 px-2 py-2 text-sm outline-none bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                  placeholder="our-story"
                  value={customSlug}
                  onChange={e => setCustomSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                />
              </div>
            </div>
          </div>
        )}

        {selectedTpl && selectedTpl.type !== 'custom' && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2">
            <Globe className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
            <span className="truncate">/store/{subdomain}/{selectedTpl.slug}</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate || creating}
            className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors"
          >
            {creating ? 'Creating...' : 'Create Page'}
          </button>
        </div>
      </div>
    </div>
  )
}
