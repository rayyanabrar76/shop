'use client'

import SectionHeader from './SectionHeader'
import { ThemeState, labelCls } from '../types'
import MediaPicker from '@/components/MediaPicker'

interface HeaderEditProps {
  storeId: string
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
}

export default function HeaderEdit({ storeId, theme, updateTheme, onBack }: HeaderEditProps) {
  return (
    <div>
      <SectionHeader title="Header" description="Logo and navigation" onBack={onBack} />
      <div className="p-4 space-y-4">

        <div data-field="header-logo">
          <label className={labelCls}>Logo Image</label>
          <MediaPicker
            storeId={storeId}
            value={theme.logoUrl}
            onChange={url => updateTheme({ logoUrl: url })}
            accept="image"
            placeholder="https://yoursite.com/logo.png"
          />
          <p className="text-[10px] text-zinc-400 mt-1">Leave empty to show your store name as text</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls}>Logo Width</label>
            <span className="text-[10px] font-mono text-zinc-400">{theme.logoWidth}px</span>
          </div>
          <input
            type="range"
            min={60} max={300} step={10}
            value={theme.logoWidth}
            onChange={e => updateTheme({ logoWidth: parseInt(e.target.value) })}
            className="w-full accent-zinc-900 h-1.5 rounded-full cursor-pointer"
          />
        </div>

      </div>
    </div>
  )
}
