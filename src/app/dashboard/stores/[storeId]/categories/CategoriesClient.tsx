'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HiPlus, HiTag, HiPencil, HiTrash, HiX, HiCheck, HiExclamation, HiArrowLeft } from 'react-icons/hi'

interface Category {
  id: string; name: string; slug: string; visible: boolean; storeId: string; createdAt: Date
  _count: { products: number }
}

function toSlug(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function CategoriesClient({ storeId, categories: initial }: { storeId: string; categories: Category[] }) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function handleCreate() {
    if (!createName.trim()) return
    setCreating(true); setCreateError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: createName.trim(), slug: toSlug(createName) }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create')
      setCategories(prev => [{ ...data.category, _count: { products: 0 } }, ...prev])
      setCreateName(''); setShowCreate(false); router.refresh()
    } catch (e: any) { setCreateError(e.message) }
    finally { setCreating(false) }
  }

  async function handleEdit(id: string) {
    setEditSaving(true); setEditError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/categories/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName.trim(), slug: toSlug(editName) }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update')
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name: data.category.name, slug: data.category.slug } : c))
      setEditId(null); router.refresh()
    } catch (e: any) { setEditError(e.message) }
    finally { setEditSaving(false) }
  }

  async function toggleVisible(cat: Category) {
    const next = !cat.visible
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, visible: next } : c))
    await fetch(`/api/stores/${storeId}/categories/${cat.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visible: next }) })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true); setDeleteError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/categories/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error ?? 'Failed to delete') }
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id)); setDeleteTarget(null); router.refresh()
    } catch (e: any) { setDeleteError(e.message) }
    finally { setDeleting(false) }
  }

  return (
    <div className="p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/stores/${storeId}`} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200">
            <HiArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Categories</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Organise your products into groups.</p>
          </div>
        </div>
        <button onClick={() => { setShowCreate(true); setCreateError('') }} className="flex items-center gap-2 rounded-xl bg-black dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-sm">
          <HiPlus className="w-4 h-4" /> New Category
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">New Category</p>
            <button onClick={() => { setShowCreate(false); setCreateName('') }} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 dark:text-zinc-500">
              <HiX className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Name</label>
            <input autoFocus className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              placeholder="e.g. Summer Collection" value={createName} onChange={e => setCreateName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          </div>
          {createError && <p className="text-xs text-red-500 font-medium">{createError}</p>}
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating || !createName.trim()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-40">
              <HiCheck className="w-4 h-4" />{creating ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => { setShowCreate(false); setCreateName('') }} className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/60">
          <div className="col-span-6 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Name</div>
          <div className="col-span-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Products</div>
          <div className="col-span-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Visible in store</div>
          <div className="col-span-1" />
        </div>

        {categories.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <HiTag className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">No categories yet</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Create your first category to organise products.</p>
            <button onClick={() => setShowCreate(true)} className="mt-4 text-xs font-bold text-black dark:text-white underline">Create a category</button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {categories.map(cat => (
              <div key={cat.id} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                {editId === cat.id ? (
                  <>
                    <div className="col-span-6 pr-3">
                      <input autoFocus className="w-full border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                        value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') setEditId(null) }} />
                      {editError && <p className="text-[10px] text-red-500 mt-1">{editError}</p>}
                    </div>
                    <div className="col-span-2" /><div className="col-span-3" />
                    <div className="col-span-1 flex items-center gap-1 justify-end">
                      <button onClick={() => handleEdit(cat.id)} disabled={editSaving} className="p-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"><HiCheck className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-400 dark:text-zinc-500"><HiX className="w-3.5 h-3.5" /></button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-6 flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0"><HiTag className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" /></div>
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{cat.name}</span>
                    </div>
                    <div className="col-span-2"><span className="text-sm text-zinc-500 dark:text-zinc-400">{cat._count.products} product{cat._count.products !== 1 ? 's' : ''}</span></div>
                    <div className="col-span-3">
                      <button onClick={() => toggleVisible(cat)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${cat.visible ? 'bg-black dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'}`} title={cat.visible ? 'Hide from store' : 'Show in store'}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-zinc-900 shadow transition-transform ${cat.visible ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <div className="col-span-1 flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditId(cat.id); setEditName(cat.name); setEditError('') }} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200" title="Edit"><HiPencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setDeleteTarget(cat); setDeleteError('') }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-zinc-400 dark:text-zinc-500 hover:text-red-500" title="Delete"><HiTrash className="w-3.5 h-3.5" /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {categories.length > 0 && (
          <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/60">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</p>
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 w-full max-w-sm p-6 space-y-4">
            <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 dark:text-zinc-500"><HiX className="w-4 h-4" /></button>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center shrink-0"><HiExclamation className="w-5 h-5 text-red-500" /></div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Delete category?</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">"{deleteTarget.name}"</span> will be deleted.
                  {deleteTarget._count.products > 0 && <span className="text-amber-600 dark:text-amber-400 font-medium"> {deleteTarget._count.products} product{deleteTarget._count.products !== 1 ? 's' : ''} will be uncategorised.</span>}
                </p>
              </div>
            </div>
            {deleteError && <p className="text-xs text-red-500 font-medium">{deleteError}</p>}
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                <HiTrash className="w-4 h-4" />{deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
