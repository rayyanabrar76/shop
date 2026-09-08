'use client'

import SectionHeader from './SectionHeader'
import { ThemeState } from '../types'

interface Props {
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
}

export default function CustomCodeEdit({ theme, updateTheme, onBack }: Props) {
  return (
    <div>
      <SectionHeader title="Custom Code" description="Inject CSS and scripts into your store" onBack={onBack} />
      <div className="p-4 space-y-5">

        {/* Custom CSS */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Custom CSS</label>
            <span className="text-[10px] text-zinc-500">Added inside {'<style>'}</span>
          </div>
          <textarea
            value={theme.customCss}
            onChange={e => updateTheme({ customCss: e.target.value })}
            placeholder={`.my-class {\n  color: red;\n}`}
            rows={10}
            spellCheck={false}
            className="w-full rounded-xl border border-(--admin-border) bg-zinc-950 text-green-400 text-[11px] font-mono px-3 py-2.5 outline-none focus:border-(--admin-field-border-focus) resize-none leading-relaxed"
          />
          <p className="text-[10px] text-zinc-500 mt-1">Styles apply to your entire storefront.</p>
        </div>

        {/* Custom Head */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Custom Head Code</label>
            <span className="text-[10px] text-zinc-500">Injected in {'<head>'}</span>
          </div>
          <textarea
            value={theme.customHead}
            onChange={e => updateTheme({ customHead: e.target.value })}
            placeholder={`<script>\n  // Google Analytics, chat widgets, etc.\n</script>`}
            rows={10}
            spellCheck={false}
            className="w-full rounded-xl border border-(--admin-border) bg-zinc-950 text-blue-400 text-[11px] font-mono px-3 py-2.5 outline-none focus:border-(--admin-field-border-focus) resize-none leading-relaxed"
          />
          <p className="text-[10px] text-zinc-500 mt-1">Use for analytics, chat widgets, meta tags, or custom fonts.</p>
        </div>

      </div>
    </div>
  )
}
