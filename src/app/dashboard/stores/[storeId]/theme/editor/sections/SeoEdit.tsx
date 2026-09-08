'use client'

import { useState } from 'react'
import { HiPhoto } from 'react-icons/hi2'
import SectionHeader from './SectionHeader'
import MediaPicker from '@/components/MediaPicker'
import AiFieldLabel from '@/components/ai/AiFieldLabel'
import AiImageModal from '@/components/ai/AiImageModal'
import { ThemeState, labelCls, inputCls } from '../types'

/**
 * Home page title, meta description and favicon.
 *
 * These are the two lines Google shows for the shop, so the panel previews
 * them at roughly the width a result gets and flags the lengths where they
 * start being truncated.
 */
export default function SeoEdit({
  theme,
  updateTheme,
  onBack,
  storeId,
  storeName,
  storeUrl,
}: {
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
  storeId: string
  storeName: string
  storeUrl: string
}) {
  const [faviconAiOpen, setFaviconAiOpen] = useState(false)

  const title = theme.seoTitle.trim() || storeName
  const description =
    theme.seoDescription.trim() ||
    theme.footerText?.trim() ||
    `Shop ${storeName} online. Discover products and place orders securely.`

  const titleLen = title.length
  const descLen = description.length
  // Google truncates around these; they are guides, not hard limits.
  const titleOver = titleLen > 60
  const descOver = descLen > 160

  return (
    <div>
      <SectionHeader title="SEO & Favicon" description="How the shop appears in Google and the browser tab" onBack={onBack} />
      <div className="p-4 space-y-5">

        {/* Search result preview */}
        <div>
          <label className={labelCls}>Google preview</label>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-4 h-4 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                {(theme.faviconUrl || theme.logoUrl) ? (
                  <img src={theme.faviconUrl || theme.logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[7px] font-bold text-zinc-400">{storeName[0]?.toUpperCase()}</span>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{storeUrl}</span>
            </div>
            <p className="text-[13px] text-[#1a0dab] dark:text-[#8ab4f8] leading-snug line-clamp-2">{title}</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2 mt-0.5">{description}</p>
          </div>
        </div>

        {/* Browser tab preview */}
        <div>
          <label className={labelCls}>Browser tab</label>
          <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 max-w-56">
            <div className="w-3.5 h-3.5 rounded-sm overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
              {(theme.faviconUrl || theme.logoUrl) ? (
                <img src={theme.faviconUrl || theme.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[6px] font-bold text-zinc-400">{storeName[0]?.toUpperCase()}</span>
              )}
            </div>
            <span className="text-[11px] text-zinc-700 dark:text-zinc-200 truncate">{title}</span>
          </div>
        </div>

        {/* Title */}
        <div className="group/ai">
          <AiFieldLabel
            label="Page title"
            storeId={storeId}
            kind="seo-title"
            current={theme.seoTitle}
            hint="the blue headline of the shop's Google result and the browser tab"
            onWrite={text => updateTheme({ seoTitle: text })}
            labelClassName={labelCls + ' mb-0'}
          />
          <input
            value={theme.seoTitle}
            onChange={e => updateTheme({ seoTitle: e.target.value })}
            placeholder={storeName}
            className={inputCls}
          />
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[10px] text-zinc-500">
              Blank uses the shop name. Put what people search for first.
            </p>
            <span className={`text-[10px] tabular-nums ${titleOver ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-zinc-500'}`}>
              {titleLen}/60
            </span>
          </div>
          {titleOver && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
              Google will cut this off. Keep the important words at the start.
            </p>
          )}
        </div>

        {/* Description */}
        <div className="group/ai">
          <AiFieldLabel
            label="Meta description"
            storeId={storeId}
            kind="seo-description"
            current={theme.seoDescription}
            hint="the grey summary under the shop's Google result"
            onWrite={text => updateTheme({ seoDescription: text })}
            labelClassName={labelCls + ' mb-0'}
          />
          <textarea
            value={theme.seoDescription}
            onChange={e => updateTheme({ seoDescription: e.target.value })}
            rows={3}
            placeholder="One or two sentences on what you sell and who it is for."
            className={`${inputCls} resize-none leading-relaxed`}
          />
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[10px] text-zinc-500">
              Not a ranking factor on its own, but it decides who clicks.
            </p>
            <span className={`text-[10px] tabular-nums ${descOver ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-zinc-500'}`}>
              {descLen}/160
            </span>
          </div>
          {descOver && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
              Over 160 characters usually gets truncated in results.
            </p>
          )}
        </div>

        {/* Favicon */}
        <div data-field="favicon">
          <div className="flex items-center justify-between mb-2">
            <label className={labelCls + ' mb-0'}>Favicon</label>
            <button
              type="button"
              onClick={() => setFaviconAiOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              <HiPhoto className="w-3.5 h-3.5" /> Generate with AI
            </button>
          </div>
          {theme.faviconUrl && (
            <div className="flex items-center gap-3 mb-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
              <img src={theme.faviconUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-zinc-100 dark:border-zinc-800" />
              <img src={theme.faviconUrl} alt="" className="w-4 h-4 rounded-sm object-cover" />
              <span className="text-[10px] text-zinc-500 flex-1">Shown at 16px in the tab</span>
              <button
                onClick={() => updateTheme({ faviconUrl: '' })}
                className="text-[10px] font-bold text-zinc-400 hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </div>
          )}
          <MediaPicker
            storeId={storeId}
            value={theme.faviconUrl}
            onChange={url => updateTheme({ faviconUrl: url })}
            accept="image"
            hidePreview
          />
          <p className="text-[10px] text-zinc-500 mt-1.5">
            Use a square image. Without one the header logo is used, which is
            usually too wide to read at this size.
          </p>
        </div>
      </div>

      {/* Asks the image model for a flat mark rather than a photograph, a
          photo is unreadable once it is 16 pixels wide. */}
      <AiImageModal
        open={faviconAiOpen}
        onClose={() => setFaviconAiOpen(false)}
        storeId={storeId}
        style="icon"
        seed={storeName}
        context={`Shop name: ${storeName}`}
        onApply={url => updateTheme({ faviconUrl: url })}
      />
    </div>
  )
}
