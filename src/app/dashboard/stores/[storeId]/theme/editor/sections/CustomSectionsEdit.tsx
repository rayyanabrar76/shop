'use client'

import { useState, useEffect } from 'react'
import SectionHeader from './SectionHeader'
import MediaPicker from '@/components/MediaPicker'
import CategoryPicker from './CategoryPicker'
import { labelCls, inputCls } from '../types'
import { Plus, Trash2, GripVertical, Eye, EyeOff, Pencil } from 'lucide-react'
import AddSectionModal from './AddSectionModal'
import UrlPicker from '@/components/UrlPicker'
import AiFieldLabel from '@/components/ai/AiFieldLabel'

export interface CustomSection {
  id: string
  name: string
  layout: string
  heading?: string | null
  text?: string | null
  imageUrl?: string | null
  buttonLabel?: string | null
  buttonUrl?: string | null
  buttonVariant?: string | null
  buttonRadius?: string | null
  buttonColor?: string | null
  buttonFont?: string | null
  showButton?: boolean
  categoryIds?: string
  showCount?: boolean
  bgColor?: string | null
  position: number
  visible: boolean
}

interface CustomSectionsEditProps {
  storeId: string
  subdomain: string
  pageId?: string | null
  onBack: () => void
  onSectionsChange: (sections: CustomSection[]) => void
  onPageCreated?: (page: any) => void
  focusSectionId?: { id: string; ts: number } | null
  initialSections?: CustomSection[]
  /** Timestamp from the preview's "Add section" pill; each new value opens the picker. */
  openAddModal?: number | null
}

const inactiveBtnCls = 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-600 dark:text-zinc-300'
const activeBtnCls = 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'

export default function CustomSectionsEdit({ storeId, subdomain, pageId = null, onBack, onSectionsChange, onPageCreated, focusSectionId, openAddModal, initialSections }: CustomSectionsEditProps) {
  const [sections, setSections] = useState<CustomSection[]>(initialSections ?? [])
  const [loading, setLoading] = useState(!initialSections || initialSections.length === 0)
  // Derived rather than synced in an effect: the picker is open if it was
  // opened from this panel, or if the preview's "Add section" pill fired a
  // timestamp newer than the last dismissal. Clicking the pill twice reopens
  // it because the timestamp changes.
  const [manualAddOpen, setManualAddOpen] = useState(false)
  const [addDismissedAt, setAddDismissedAt] = useState(0)
  const showAddModal = manualAddOpen || (!!openAddModal && openAddModal > addDismissedAt)
  const openAdd  = () => setManualAddOpen(true)
  const closeAdd = () => { setManualAddOpen(false); setAddDismissedAt(Date.now()) }
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const pageQuery = pageId ? `?pageId=${pageId}` : '?pageId=home'

  useEffect(() => { fetchSections() }, [pageId])

  useEffect(() => {
    if (focusSectionId) setEditingId(focusSectionId.id)
  }, [focusSectionId])

  async function fetchSections() {
    setLoading(true)
    try {
      const res = await fetch(`/api/stores/${storeId}/custom-sections${pageQuery}`)
      if (res.ok) {
        const data = await res.json()
        setSections(data)
        onSectionsChange(data)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(name: string, layout: string) {
    const res = await fetch(`/api/stores/${storeId}/custom-sections${pageQuery}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, layout, heading: 'Section Heading', text: 'Add your content here.', pageId }),
    })
    if (res.ok) {
      const newSection = await res.json()
      const updated = [...sections, newSection]
      setSections(updated)
      onSectionsChange(updated)
      closeAdd()
      setEditingId(newSection.id)
    }
  }

  async function handleUpdate(id: string, patch: Partial<CustomSection>) {
    const updated = sections.map(s => s.id === id ? { ...s, ...patch } : s)
    setSections(updated)
    onSectionsChange(updated)
    await fetch(`/api/stores/${storeId}/custom-sections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  }

  async function handleDelete(id: string) {
    const updated = sections.filter(s => s.id !== id)
    setSections(updated)
    onSectionsChange(updated)
    setDeleteConfirmId(null)
    setEditingId(null)
    await fetch(`/api/stores/${storeId}/custom-sections/${id}`, { method: 'DELETE' })
  }

  const editing = sections.find(s => s.id === editingId)

  if (editing) {
    const isCategoryGrid = editing.layout === 'shop-by-category'
    // A category grid supplies its own tiles, so the image and generic button
    // controls do not apply to it.
    const usesImage = !isCategoryGrid && (editing.layout === 'image-text' || editing.layout === 'text-image' || editing.layout === 'image-banner')
    const usesText = editing.layout !== 'heading-only'
    const usesButton = !isCategoryGrid && editing.layout !== 'heading-text' && editing.layout !== 'heading-only'

    return (
      <>
        <div>
          <SectionHeader title={editing.name} description={`Layout: ${editing.layout}`} onBack={() => setEditingId(null)} />
          <div className="p-4 space-y-4">

            <div>
              <label className={labelCls}>Section Name</label>
              <input className={inputCls} value={editing.name} onChange={e => handleUpdate(editing.id, { name: e.target.value })} />
              <p className="text-[10px] text-zinc-500 mt-1">For your reference, not shown to customers</p>
            </div>

            <div data-field="custom-heading" className="group/ai">
              <AiFieldLabel
                label="Heading"
                storeId={storeId}
                kind="heading"
                current={editing.heading ?? ''}
                hint={`the heading of a "${editing.layout}" section on the storefront`}
                onWrite={text => handleUpdate(editing.id, { heading: text })}
                labelClassName={labelCls + ' mb-0'}
              />
              <input className={inputCls} value={editing.heading ?? ''} onChange={e => handleUpdate(editing.id, { heading: e.target.value })} placeholder="Big bold heading" />
            </div>

            {isCategoryGrid && (
              <>
                <div data-field="custom-categories">
                  <label className={labelCls}>Categories</label>
                  <CategoryPicker
                    storeId={storeId}
                    value={editing.categoryIds ?? ''}
                    onChange={v => handleUpdate(editing.id, { categoryIds: v })}
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Leave empty to show every category.</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <label className={labelCls}>Show View All Link</label>
                    <p className="text-[10px] text-zinc-400">A link beside the heading</p>
                  </div>
                  <button
                    onClick={() => handleUpdate(editing.id, { showButton: !editing.showButton })}
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${editing.showButton ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 shadow transition-transform ${editing.showButton ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {editing.showButton && (
                  <>
                    <div>
                      <label className={labelCls}>Link Label</label>
                      <input className={inputCls} value={editing.buttonLabel ?? ''} onChange={e => handleUpdate(editing.id, { buttonLabel: e.target.value })} placeholder="View all" />
                    </div>
                    <div>
                      <label className={labelCls}>Link</label>
                      <input className={inputCls} value={editing.buttonUrl ?? ''} onChange={e => handleUpdate(editing.id, { buttonUrl: e.target.value })} placeholder={`/store/${subdomain}/products`} />
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <label className={labelCls}>Show Product Count</label>
                    <p className="text-[10px] text-zinc-400">e.g. &quot;4 products&quot; under each tile</p>
                  </div>
                  <button
                    onClick={() => handleUpdate(editing.id, { showCount: !editing.showCount })}
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${editing.showCount ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 shadow transition-transform ${editing.showCount ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </>
            )}

            {usesText && (
              <div data-field="custom-text" className="group/ai">
                <AiFieldLabel
                  label="Text"
                  storeId={storeId}
                  kind="paragraph"
                  current={editing.text ?? ''}
                  hint={`the body text of a "${editing.layout}" section, under the heading "${editing.heading ?? ''}"`}
                  onWrite={text => handleUpdate(editing.id, { text })}
                  labelClassName={labelCls + ' mb-0'}
                />
                <textarea
                  className={inputCls + ' min-h-20 resize-none'}
                  value={editing.text ?? ''}
                  onChange={e => handleUpdate(editing.id, { text: e.target.value })}
                  placeholder="Section description or paragraph..."
                />
              </div>
            )}

            {usesImage && (
              <div>
                <label className={labelCls}>Image or Video</label>
                <MediaPicker
                  storeId={storeId}
                  value={editing.imageUrl ?? ''}
                  onChange={(url) => handleUpdate(editing.id, { imageUrl: url })}
                  accept="all"
                />
              </div>
            )}

            {usesButton && (
              <div data-field="custom-button" className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className={labelCls}>Button</label>
                  <button
                    onClick={() => handleUpdate(editing.id, { showButton: !editing.showButton })}
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${editing.showButton ? 'bg-zinc-900' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editing.showButton ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>

                {editing.showButton && (
                  <div className="space-y-4">
                    <div className="group/ai">
                      <AiFieldLabel
                        label="Button Label"
                        storeId={storeId}
                        kind="button"
                        current={editing.buttonLabel ?? ''}
                        hint={`the button in a "${editing.layout}" section headed "${editing.heading ?? ''}"`}
                        onWrite={text => handleUpdate(editing.id, { buttonLabel: text })}
                        labelClassName={labelCls + ' mb-0'}
                      />
                      <input className={inputCls} value={editing.buttonLabel ?? ''} onChange={e => handleUpdate(editing.id, { buttonLabel: e.target.value })} placeholder="Shop Now" />
                    </div>
                    <div>
                      <label className={labelCls}>Button URL</label>
                      <UrlPicker
                        storeId={storeId}
                        subdomain={subdomain}
                        value={editing.buttonUrl ?? ''}
                        onChange={url => handleUpdate(editing.id, { buttonUrl: url })}
                        onPageCreated={onPageCreated}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Button Style</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['solid', 'outline', 'ghost'].map(v => (
                          <button
                            key={v}
                            onClick={() => handleUpdate(editing.id, { buttonVariant: v })}
                            className={`py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                              (editing.buttonVariant ?? 'solid') === v ? activeBtnCls : inactiveBtnCls
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={labelCls}>Button Curvature</label>
                        <span className="text-[10px] font-mono text-zinc-500">{editing.buttonRadius ?? '0.5rem'}</span>
                      </div>
                      <div className="flex gap-2">
                        {[
                          { label: 'Sharp', value: '0px' },
                          { label: 'Soft',  value: '0.5rem' },
                          { label: 'Round', value: '0.75rem' },
                          { label: 'Pill',  value: '1.5rem' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => handleUpdate(editing.id, { buttonRadius: opt.value })}
                            className={`flex-1 py-1.5 text-[10px] font-bold border transition-all ${
                              (editing.buttonRadius ?? '0.5rem') === opt.value
                                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                                : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                            }`}
                            style={{ borderRadius: opt.value }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Button Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer shrink-0"
                          value={editing.buttonColor ?? '#6c47ff'}
                          onChange={e => handleUpdate(editing.id, { buttonColor: e.target.value })}
                        />
                        <input
                          className={inputCls}
                          value={editing.buttonColor ?? ''}
                          onChange={e => handleUpdate(editing.id, { buttonColor: e.target.value })}
                          placeholder="Default (theme color)"
                        />
                        {editing.buttonColor && (
                          <button
                            onClick={() => handleUpdate(editing.id, { buttonColor: null })}
                            className="text-[10px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 shrink-0 whitespace-nowrap"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Button Font</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Default', value: null,    family: 'inherit' },
                          { label: 'Serif',   value: 'serif', family: 'serif' },
                          { label: 'Mono',    value: 'mono',  family: 'monospace' },
                        ].map(opt => (
                          <button
                            key={String(opt.value)}
                            onClick={() => handleUpdate(editing.id, { buttonFont: opt.value })}
                            className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                              (editing.buttonFont ?? null) === opt.value ? activeBtnCls : inactiveBtnCls
                            }`}
                            style={{ fontFamily: opt.family }}
                          >
                            Aa {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className={labelCls}>Background Color</label>
              <div className="flex items-center gap-2">
                <input type="color" className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer" value={editing.bgColor ?? '#ffffff'} onChange={e => handleUpdate(editing.id, { bgColor: e.target.value })} />
                <input className={inputCls} value={editing.bgColor ?? ''} onChange={e => handleUpdate(editing.id, { bgColor: e.target.value })} placeholder="Leave empty for default" />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setDeleteConfirmId(editing.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Section
              </button>
            </div>
          </div>
        </div>

        {deleteConfirmId === editing.id && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 w-full max-w-xs p-6 space-y-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 mx-auto">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Delete &ldquo;{editing.name}&rdquo;?</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">This section will be permanently removed. This can&apos;t be undone.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(editing.id)}
                  className="flex-1 py-2 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div>
      <SectionHeader title="Custom Sections" description="Add your own content blocks" onBack={onBack} />
      <div className="p-4 space-y-3">

        <button
          onClick={() => openAdd()}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-700 text-white text-sm font-bold transition-opacity hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add New Section
        </button>

        {loading && <p className="text-center text-xs text-zinc-500 py-4">Loading...</p>}

        {!loading && sections.length === 0 && (
          <div className="text-center py-8 text-xs text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
            No custom sections yet.<br />Click &ldquo;Add New Section&rdquo; to create one.
          </div>
        )}

        {sections.map(s => (
          <div key={s.id} className="flex items-center gap-2 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <GripVertical className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{s.name}</p>
              <p className="text-[10px] text-zinc-500">{s.layout}</p>
            </div>
            <button
              onClick={() => handleUpdate(s.id, { visible: !s.visible })}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              {s.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setEditingId(s.id)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {showAddModal && (
          <AddSectionModal
            onClose={() => closeAdd()}
            onAdd={handleAdd}
          />
        )}
      </div>
    </div>
  )
}
