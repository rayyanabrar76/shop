'use client'

import { useState } from 'react'
import { EditorItem, useIsEditor, notifyEdit } from './EditorHighlight'

interface StoreBannerProps {
  theme: {
    showBanner?: boolean | null
    bannerText?: string | null
    primaryColor?: string | null
  } | null
  isEditor?: boolean
  onEdit?: (s: string) => void
}

export default function StoreBanner({ theme, isEditor: isEditorProp, onEdit }: StoreBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  // Read before the early return: hooks cannot sit behind a condition.
  const detected = useIsEditor()
  const isEditor = isEditorProp ?? detected
  const notify = onEdit ?? notifyEdit

  if (!theme?.showBanner || dismissed) return null

  return (
    <div
      className="py-2 px-4 text-center text-sm font-medium relative flex items-center justify-center gap-2"
      style={{
        backgroundColor: theme?.primaryColor ?? '#0a0a0a',
        color: '#ffffff',
      }}
    >
      <EditorItem section="banner" field="banner-text" label="Banner text" isEditor={isEditor} onEdit={notify}>
        <span>{theme?.bannerText ?? 'Welcome to our store'}</span>
      </EditorItem>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors text-lg leading-none"
        aria-label="Dismiss banner"
      >
        &times;
      </button>
    </div>
  )
}