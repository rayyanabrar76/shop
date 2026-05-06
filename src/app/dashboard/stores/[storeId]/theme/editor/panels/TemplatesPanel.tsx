'use client'

import { templates, type Template } from '../templates'
import { ThemeState } from '../types'

interface TemplatesPanelProps {
  theme: ThemeState
  applyTemplate: (templateId: string) => void
}

export default function TemplatesPanel({ theme, applyTemplate }: TemplatesPanelProps) {
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Choose a Template</p>
      {templates.map((t: Template) => (
        <button key={t.id} onClick={() => applyTemplate(t.id)} className="w-full text-left group">
          <div className="rounded-2xl border border-zinc-200 overflow-hidden hover:border-zinc-400 transition-all hover:shadow-md">
            <div className="h-28 relative overflow-hidden" style={{ backgroundColor: t.theme.backgroundColor }}>
              {t.theme.showBanner && (
                <div className="py-1 text-center text-[8px] font-bold text-white" style={{ backgroundColor: t.theme.primaryColor }}>
                  {t.theme.bannerText}
                </div>
              )}
              <div className="px-3 py-1.5 flex justify-between items-center border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', color: t.theme.accentColor }}>
                <span className="text-[9px] font-bold" style={{ fontFamily: t.theme.headingFont === 'serif' ? 'serif' : 'sans-serif' }}>STORE</span>
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
              </div>
              <div className="p-2 grid grid-cols-3 gap-1.5">
                {[1,2,3].map(i => (
                  <div key={i} style={{ borderRadius: t.theme.borderRadius, backgroundColor: 'rgba(0,0,0,0.04)' }} className="aspect-square" />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: `${t.theme.primaryColor}cc` }}>
                <span className="text-white text-xs font-bold">Apply Template</span>
              </div>
            </div>
            <div className="px-3 py-2 bg-white flex items-center gap-2">
              <span>{t.emoji}</span>
              <div>
                <p className="text-xs font-bold text-zinc-800">{t.name}</p>
                <p className="text-[10px] text-zinc-400">{t.description}</p>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}