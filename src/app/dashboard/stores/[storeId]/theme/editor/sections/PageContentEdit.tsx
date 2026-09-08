'use client'

import { useState, useEffect } from 'react'
import SectionHeader from './SectionHeader'
import MediaPicker from '@/components/MediaPicker'
import { labelCls, inputCls } from '../types'
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil, Layers } from 'lucide-react'
import CustomSectionsEdit, { type CustomSection } from './CustomSectionsEdit'

export interface StorePage {
  id: string
  type: string
  name: string
  slug: string
  content: any
}

interface PageContentEditProps {
  storeId: string
  subdomain: string
  page: StorePage
  onContentChange: (content: unknown) => void
  onSectionsChange: (sections: CustomSection[]) => void
  onPageCreated?: (page: any) => void
  onBack: () => void
  autoNav?: { section: string; ts: number } | null
  focusSectionId?: { id: string; ts: number } | null
}

// ─── Section definitions ──────────────────────────────────────────────────────

const CUSTOM_SECTION = { id: 'custom', label: 'Custom Sections', description: 'Add your own content blocks' }

function getSections(type: string): { id: string; label: string; description: string }[] {
  switch (type) {
    case 'faq':
      return [
        { id: 'header', label: 'Page Header', description: 'Heading for the FAQ page' },
        { id: 'items',  label: 'FAQ Items',   description: 'Questions and answers' },
        CUSTOM_SECTION,
      ]
    case 'about':
      return [
        { id: 'header', label: 'Page Header', description: 'Heading and intro text' },
        { id: 'story',  label: 'Our Story',   description: 'Story, mission, and image' },
        CUSTOM_SECTION,
      ]
    case 'contact':
      return [
        { id: 'header',   label: 'Page Header',    description: 'Heading and intro text' },
        { id: 'details',  label: 'Contact Details', description: 'Address, email, phone' },
        CUSTOM_SECTION,
      ]
    case 'shipping':
    case 'privacy':
    case 'terms':
      return [
        { id: 'header',  label: 'Page Header',    description: 'Heading for the page' },
        { id: 'content', label: 'Policy Content', description: 'Main policy text' },
        CUSTOM_SECTION,
      ]
    case 'blog':
      return [
        { id: 'header', label: 'Page Header', description: 'Heading and intro text' },
        CUSTOM_SECTION,
      ]
    default:
      return [
        { id: 'header',  label: 'Page Header', description: 'Heading for the page' },
        { id: 'content', label: 'Content',      description: 'Main page content' },
        CUSTOM_SECTION,
      ]
  }
}

// ─── Section editors ──────────────────────────────────────────────────────────

function HeaderSection({
  type,
  content,
  onChange,
  onBack,
}: {
  type: string
  content: any
  onChange: (patch: object) => void
  onBack: () => void
}) {
  const showIntro = type === 'about' || type === 'contact' || type === 'blog'

  return (
    <div>
      <SectionHeader title="Page Header" onBack={onBack} />
      <div className="p-4 space-y-4">
        <div data-field="page-heading">
          <label className={labelCls}>Heading</label>
          <input
            className={inputCls}
            value={content?.heading ?? ''}
            onChange={e => onChange({ heading: e.target.value })}
            placeholder="Page heading"
          />
        </div>
        {showIntro && (
          <div data-field="page-intro">
            <label className={labelCls}>Intro</label>
            <textarea
              className={inputCls + ' min-h-20 resize-none'}
              value={content?.intro ?? ''}
              onChange={e => onChange({ intro: e.target.value })}
              placeholder="Brief intro text..."
            />
          </div>
        )}
      </div>
    </div>
  )
}

function FaqItemsSection({
  content,
  onChange,
  onBack,
}: {
  content: any
  onChange: (patch: object) => void
  onBack: () => void
}) {
  const items: { id: string; q: string; a: string }[] = content?.items ?? []
  const [editingId, setEditingId] = useState<string | null>(null)

  function updateItems(next: { id: string; q: string; a: string }[]) {
    onChange({ items: next })
  }

  function addItem() {
    const newItem = { id: `item-${Date.now()}`, q: 'New question?', a: 'Answer here.' }
    updateItems([...items, newItem])
    setEditingId(newItem.id)
  }

  function updateItem(id: string, key: 'q' | 'a', value: string) {
    updateItems(items.map(item => item.id === id ? { ...item, [key]: value } : item))
  }

  function removeItem(id: string) {
    updateItems(items.filter(item => item.id !== id))
    if (editingId === id) setEditingId(null)
  }

  return (
    <div>
      <SectionHeader title="FAQ Items" description="Questions and answers" onBack={onBack} />
      <div className="p-4 space-y-3">
        <button
          onClick={addItem}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-700 text-white text-sm font-bold transition-opacity hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add Question
        </button>

        {items.length === 0 && (
          <div className="text-center py-6 text-xs text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
            No FAQ items yet. Add your first question.
          </div>
        )}

        {items.map((item, idx) => {
          const isOpen = editingId === item.id
          return (
            <div
              key={item.id}
              className={`rounded-xl border overflow-hidden bg-white dark:bg-zinc-900 transition-all ${isOpen ? 'border-zinc-900 dark:border-zinc-500 ring-2 ring-zinc-900/10 dark:ring-zinc-500/20' : 'border-zinc-200 dark:border-zinc-700'}`}
            >
              <div
                className="flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer select-none"
                onClick={() => setEditingId(isOpen ? null : item.id)}
              >
                <span className="text-sm font-semibold flex-1 truncate text-zinc-800 dark:text-zinc-100">Q{idx + 1}: {item.q}</span>
                <button
                  onClick={e => { e.stopPropagation(); removeItem(item.id) }}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-500 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />}
              </div>
              {isOpen && (
                <div className="px-3 pb-3 space-y-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div data-field="faq-question" className="space-y-1 pt-2">
                    <label className={labelCls}>Question</label>
                    <input
                      className={inputCls}
                      value={item.q}
                      onChange={e => updateItem(item.id, 'q', e.target.value)}
                      placeholder="What is your question?"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Answer</label>
                    <textarea
                      className={inputCls + ' min-h-20 resize-none'}
                      value={item.a}
                      onChange={e => updateItem(item.id, 'a', e.target.value)}
                      placeholder="Your answer..."
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AboutStorySection({
  storeId,
  content,
  onChange,
  onBack,
}: {
  storeId: string
  content: any
  onChange: (patch: object) => void
  onBack: () => void
}) {
  return (
    <div>
      <SectionHeader title="Our Story" description="Story, mission, and image" onBack={onBack} />
      <div className="p-4 space-y-4">
        <div data-field="page-story">
          <label className={labelCls}>Our Story</label>
          <textarea
            className={inputCls + ' min-h-24 resize-none'}
            value={content?.story ?? ''}
            onChange={e => onChange({ story: e.target.value })}
            placeholder="Tell your brand story..."
          />
        </div>
        <div>
          <label className={labelCls}>Our Mission</label>
          <textarea
            className={inputCls + ' min-h-20 resize-none'}
            value={content?.mission ?? ''}
            onChange={e => onChange({ mission: e.target.value })}
            placeholder="Your mission statement..."
          />
        </div>
        <div>
          <label className={labelCls}>Image</label>
          <MediaPicker
            storeId={storeId}
            value={content?.imageUrl ?? ''}
            onChange={url => onChange({ imageUrl: url || null })}
            accept="image"
            placeholder="Choose an image"
          />
        </div>
      </div>
    </div>
  )
}

function ContactDetailsSection({
  content,
  onChange,
  onBack,
}: {
  content: any
  onChange: (patch: object) => void
  onBack: () => void
}) {
  return (
    <div>
      <SectionHeader title="Contact Details" description="Address, email, phone" onBack={onBack} />
      <div className="p-4 space-y-4">
        <div>
          <label className={labelCls}>Address</label>
          <input
            className={inputCls}
            value={content?.address ?? ''}
            onChange={e => onChange({ address: e.target.value })}
            placeholder="123 Main Street, City, Country"
          />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input
            className={inputCls}
            type="email"
            value={content?.email ?? ''}
            onChange={e => onChange({ email: e.target.value })}
            placeholder="hello@yourstore.com"
          />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input
            className={inputCls}
            value={content?.phone ?? ''}
            onChange={e => onChange({ phone: e.target.value })}
            placeholder="+1 (234) 567-8900"
          />
        </div>
      </div>
    </div>
  )
}

function PolicyContentSection({
  content,
  onChange,
  onBack,
}: {
  content: any
  onChange: (patch: object) => void
  onBack: () => void
}) {
  return (
    <div>
      <SectionHeader title="Policy Content" description="Main policy text" onBack={onBack} />
      <div className="p-4">
        <div data-field="page-content">
          <label className={labelCls}>Content</label>
          <textarea
            className={inputCls + ' min-h-64 resize-none'}
            value={content?.content ?? ''}
            onChange={e => onChange({ content: e.target.value })}
            placeholder="Enter policy content..."
          />
        </div>
      </div>
    </div>
  )
}

function GenericContentSection({
  content,
  onChange,
  onBack,
}: {
  content: any
  onChange: (patch: object) => void
  onBack: () => void
}) {
  return (
    <div>
      <SectionHeader title="Content" description="Main page content" onBack={onBack} />
      <div className="p-4">
        <div data-field="page-content">
          <label className={labelCls}>Content</label>
          <textarea
            className={inputCls + ' min-h-48 resize-none'}
            value={content?.content ?? ''}
            onChange={e => onChange({ content: e.target.value })}
            placeholder="Add your content here."
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PageContentEdit({
  storeId,
  subdomain,
  page,
  onContentChange,
  onSectionsChange,
  onPageCreated,
  onBack,
  autoNav,
  focusSectionId,
}: PageContentEditProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [content, setContent] = useState<any>(page.content ?? {})

  useEffect(() => {
    if (autoNav) setActiveSection(autoNav.section)
  }, [autoNav])

  const sections = getSections(page.type)

  function handleChange(patch: object) {
    const next = { ...content, ...patch }
    setContent(next)
    onContentChange(next)
    fetch(`/api/stores/${storeId}/pages/${page.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: next }),
    }).catch(() => {})
  }

  // ── Custom sections drill-in ───────────────────────────────────────────────
  if (activeSection === 'custom') {
    return (
      <CustomSectionsEdit
        storeId={storeId}
        subdomain={subdomain}
        pageId={page.id}
        onBack={() => setActiveSection(null)}
        onSectionsChange={onSectionsChange}
        onPageCreated={onPageCreated}
        focusSectionId={focusSectionId}
      />
    )
  }

  // ── Other section sub-editors ─────────────────────────────────────────────
  if (activeSection !== null) {
    if (activeSection === 'header') {
      return (
        <HeaderSection
          type={page.type}
          content={content}
          onChange={handleChange}
          onBack={() => setActiveSection(null)}
        />
      )
    }

    if (activeSection === 'items' && page.type === 'faq') {
      return (
        <FaqItemsSection
          content={content}
          onChange={handleChange}
          onBack={() => setActiveSection(null)}
        />
      )
    }

    if (activeSection === 'story' && page.type === 'about') {
      return (
        <AboutStorySection
          storeId={storeId}
          content={content}
          onChange={handleChange}
          onBack={() => setActiveSection(null)}
        />
      )
    }

    if (activeSection === 'details' && page.type === 'contact') {
      return (
        <ContactDetailsSection
          content={content}
          onChange={handleChange}
          onBack={() => setActiveSection(null)}
        />
      )
    }

    if (activeSection === 'content' && ['shipping', 'privacy', 'terms'].includes(page.type)) {
      return (
        <PolicyContentSection
          content={content}
          onChange={handleChange}
          onBack={() => setActiveSection(null)}
        />
      )
    }

    if (activeSection === 'content') {
      return (
        <GenericContentSection
          content={content}
          onChange={handleChange}
          onBack={() => setActiveSection(null)}
        />
      )
    }
  }

  // ── Section list ──────────────────────────────────────────────────────────
  return (
    <div>
      <SectionHeader
        title={page.name}
        description={`${page.type} page`}
        onBack={onBack}
      />
      <div className="p-4 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Page Sections</p>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left ${
              s.id === 'custom' ? 'border-dashed border-zinc-200 dark:border-zinc-700' : 'border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <div className="min-w-0 flex items-center gap-2.5">
              {s.id === 'custom' && <Layers className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{s.label}</p>
                <p className="text-[10px] text-zinc-500">{s.description}</p>
              </div>
            </div>
            <Pencil className="w-3.5 h-3.5 text-zinc-500 shrink-0 ml-2" />
          </button>
        ))}
      </div>
    </div>
  )
}
