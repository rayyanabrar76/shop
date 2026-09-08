'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { HiX, HiExternalLink, HiPhotograph } from 'react-icons/hi'
import AltTextField from './AltTextField'

/** "…/ChatGPT_Image_Sep_6_dgZlp1Twu.png?tr=w-240" -> "ChatGPT_Image_Sep_6_dgZlp1Twu.png" */
function fileNameOf(url: string): string {
  try {
    const path = url.split('?')[0]
    return decodeURIComponent(path.slice(path.lastIndexOf('/') + 1)) || 'image'
  } catch {
    return 'image'
  }
}

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * A product image, large, with its alt text beside it.
 *
 * The forms could only ever show a thumbnail, so there was no way to check
 * whether the description actually matches the photo, which is the one thing
 * a person has to do that the model cannot. Opening the image and putting the
 * alt field next to it makes that a glance rather than a new tab.
 *
 * Not an editor: cropping and focal points are a different job, and one the
 * media library is the right place for.
 */
export default function ImagePreviewModal({
  url,
  storeId,
  productTitle,
  alt,
  onAltChange,
  onClose,
  context,
}: {
  url: string
  storeId: string
  productTitle?: string
  alt: string
  /** Omitted for images whose description is not editable here. */
  onAltChange?: (v: string) => void
  onClose: () => void
  context?: string
}) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const [bytes, setBytes] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // The weight of the file is worth knowing: a 1.5MB hero image is the sort
  // of thing that quietly costs a shop its mobile page speed.
  useEffect(() => {
    let cancelled = false
    fetch(url, { method: 'HEAD' })
      .then(r => {
        const len = r.headers.get('content-length')
        if (!cancelled && len) setBytes(Number(len))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [url])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-(--admin-card) border border-(--admin-border) flex flex-col">
        <div className="flex items-center justify-between gap-3 px-4 h-14 shrink-0 border-b border-(--admin-edge)">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <HiPhotograph className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </span>
            <p className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-50">{fileNameOf(url)}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              title="Open the original in a new tab"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <HiExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <HiX className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto grid md:grid-cols-[1fr_20rem]">
          <div className="flex items-center justify-center p-5 bg-(--admin-page) min-h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={alt || productTitle || ''}
              onLoad={e => setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              className="max-w-full max-h-[60vh] object-contain rounded-xl"
            />
          </div>

          <div className="p-5 space-y-5 md:border-l border-(--admin-edge)">
            <div>
              <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Alt text
              </p>
              {onAltChange ? (
                <AltTextField
                  storeId={storeId}
                  imageUrl={url}
                  title={productTitle}
                  value={alt}
                  onChange={onAltChange}
                  context={context}
                />
              ) : (
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{alt || 'None set.'}</p>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Details
              </p>
              <dl className="space-y-1.5 text-[12px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Dimensions</dt>
                  <dd className="text-zinc-700 dark:text-zinc-200 tabular-nums">
                    {dims ? `${dims.w} × ${dims.h}` : '…'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Size</dt>
                  <dd className="text-zinc-700 dark:text-zinc-200 tabular-nums">
                    {bytes !== null ? prettyBytes(bytes) : 'Unknown'}
                  </dd>
                </div>
              </dl>
              {bytes !== null && bytes > 800 * 1024 && (
                <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
                  Over 800 KB. Large images are the usual reason a shop feels slow on a phone.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
