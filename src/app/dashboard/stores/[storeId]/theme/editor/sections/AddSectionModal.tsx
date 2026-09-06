'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface AddSectionModalProps {
  onClose: () => void
  onAdd: (name: string, layout: string) => void
}

const LAYOUTS = [
  {
    value: 'shop-by-category',
    label: 'Shop by Category',
    description: 'Grid of your categories',
    bestFor: 'Best for helping people browse a large catalogue',
    preview: (
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="space-y-1">
            <div className="aspect-square bg-zinc-300 rounded" />
            <div className="h-1 w-3/4 bg-zinc-700 rounded" />
          </div>
        ))}
      </div>
    ),
  },
  {
    value: 'heading-text',
    label: 'Heading + Text',
    description: 'Centered heading and paragraph',
    bestFor: 'Best for About Us, mission statements',
    preview: (
      <div className="space-y-1">
        <div className="h-2 w-2/3 mx-auto bg-zinc-700 rounded" />
        <div className="h-1 w-full bg-zinc-300 rounded" />
        <div className="h-1 w-5/6 mx-auto bg-zinc-300 rounded" />
      </div>
    ),
  },
  {
    value: 'heading-only',
    label: 'Big Heading',
    description: 'Just a large heading',
    bestFor: 'Best for section titles & separators',
    preview: (
      <div className="space-y-1 py-2">
        <div className="h-3 w-4/5 mx-auto bg-zinc-700 rounded" />
      </div>
    ),
  },
  {
    value: 'image-text',
    label: 'Image + Text',
    description: 'Image left, text right',
    bestFor: 'Best for About Us, team & features',
    preview: (
      <div className="grid grid-cols-2 gap-1.5">
        <div className="aspect-video bg-zinc-300 rounded" />
        <div className="space-y-1">
          <div className="h-1.5 w-3/4 bg-zinc-700 rounded" />
          <div className="h-1 w-full bg-zinc-300 rounded" />
          <div className="h-1 w-2/3 bg-zinc-300 rounded" />
          <div className="h-2 w-1/2 bg-zinc-700 rounded mt-1" />
        </div>
      </div>
    ),
  },
  {
    value: 'text-image',
    label: 'Text + Image',
    description: 'Text left, image right',
    bestFor: 'Best for About Us, team & features',
    preview: (
      <div className="grid grid-cols-2 gap-1.5">
        <div className="space-y-1">
          <div className="h-1.5 w-3/4 bg-zinc-700 rounded" />
          <div className="h-1 w-full bg-zinc-300 rounded" />
          <div className="h-1 w-2/3 bg-zinc-300 rounded" />
          <div className="h-2 w-1/2 bg-zinc-700 rounded mt-1" />
        </div>
        <div className="aspect-video bg-zinc-300 rounded" />
      </div>
    ),
  },
  {
    value: 'image-banner',
    label: 'Image Banner',
    description: 'Full-width image with text overlay',
    bestFor: 'Best for promotions & seasonal sales',
    preview: (
      <div className="aspect-3/1 bg-zinc-700 rounded relative flex items-center justify-center">
        <div className="space-y-0.5 w-2/3">
          <div className="h-1.5 w-full bg-white/80 rounded" />
          <div className="h-1 w-3/4 mx-auto bg-white/60 rounded" />
        </div>
      </div>
    ),
  },
  {
    value: 'centered-cta',
    label: 'Call to Action',
    description: 'Centered heading + text + button',
    bestFor: 'Best for newsletter & sign-up CTA',
    preview: (
      <div className="space-y-1.5 py-1">
        <div className="h-2.5 w-3/4 mx-auto bg-zinc-700 rounded" />
        <div className="h-1 w-5/6 mx-auto bg-zinc-300 rounded" />
        <div className="h-2 w-1/3 mx-auto bg-zinc-700 rounded" />
      </div>
    ),
  },
]

export default function AddSectionModal({ onClose, onAdd }: AddSectionModalProps) {
  const [name, setName] = useState('')
  const [layout, setLayout] = useState('heading-text')

  function handleSubmit() {
    if (!name.trim()) return
    onAdd(name.trim(), layout)
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-zinc-200 dark:border-zinc-700">

        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">New Section</h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Pick a layout and name your section</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1">

          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 block">Section Name</label>
            <input
              autoFocus
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. About Us, Why Choose Us, Our Promise"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2 block">Layout</label>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUTS.map(l => (
                <button
                  key={l.value}
                  onClick={() => setLayout(l.value)}
                  className={`group p-3 rounded-xl border-2 transition-all text-left ${
                    layout === l.value
                      ? 'border-zinc-900 dark:border-zinc-400 bg-zinc-50 dark:bg-zinc-800'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                  }`}
                >
                  <div className="relative bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 mb-2 overflow-hidden">
                    {l.preview}
                    <div className="absolute inset-0 bg-zinc-900/85 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                      <p className="text-[10px] text-white font-semibold text-center leading-tight">{l.bestFor}</p>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{l.label}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{l.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-5 py-2 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            Create Section
          </button>
        </div>
      </div>
    </div>
  )
}
