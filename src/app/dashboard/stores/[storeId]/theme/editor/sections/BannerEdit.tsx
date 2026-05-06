'use client'

import SectionHeader from './SectionHeader'
import { ThemeState, labelCls, inputCls, EDITOR_COLOR } from '../types'

interface BannerEditProps {
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
}

export default function BannerEdit({ theme, updateTheme, onBack }: BannerEditProps) {
  return (
    <div>
      <SectionHeader title="Announcement Banner" description="Top banner shown on every page" onBack={onBack} />
      <div className="p-4 space-y-4">

        {/* Show banner toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Show Banner</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Display the announcement bar</p>
          </div>
          <button
            onClick={() => updateTheme({ showBanner: !theme.showBanner })}
            className="shrink-0 w-10 h-6 rounded-full transition-colors relative"
            style={{ backgroundColor: theme.showBanner ? EDITOR_COLOR : '#d4d4d8' }}
          >
            <span
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
              style={{ left: theme.showBanner ? '1.25rem' : '0.25rem' }}
            />
          </button>
        </div>

        {theme.showBanner && (
          <div data-field="banner-text">
            <label className={labelCls}>Banner Text</label>
            <input
              className={inputCls}
              value={theme.bannerText}
              onChange={e => updateTheme({ bannerText: e.target.value })}
              placeholder="Free shipping on orders over $50"
            />
          </div>
        )}

        {/* Live preview */}
        {theme.showBanner && (
          <div className="rounded-xl py-2 px-4 text-center text-xs font-medium text-white" style={{ backgroundColor: theme.primaryColor }}>
            {theme.bannerText || 'Your banner text'}
          </div>
        )}
      </div>
    </div>
  )
}
