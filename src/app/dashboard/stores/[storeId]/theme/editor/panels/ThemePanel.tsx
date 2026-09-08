'use client'

import { ThemeState, labelCls, inputCls, sectionLabelCls } from '../types'
import { Palette, Type, Layers, Moon, Sun } from 'lucide-react'

interface ThemePanelProps {
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
}

export const DARK_PRESET = {
  darkMode: true,
  backgroundColor: '#09090b',
  textColor: '#fafafa',
  footerColor: '#09090b',
  accentColor: '#ffffff',
  productGridBg: '#09090b',
}

export const LIGHT_PRESET = {
  darkMode: false,
  backgroundColor: '#ffffff',
  textColor: '#0a0a0a',
  footerColor: '#ffffff',
  accentColor: '#000000',
  productGridBg: '#ffffff',
}

export default function ThemePanel({ theme, updateTheme }: ThemePanelProps) {
  function toggleDarkMode() {
    if (theme.darkMode) {
      updateTheme(LIGHT_PRESET)
    } else {
      updateTheme(DARK_PRESET)
    }
  }

  return (
    <div className="p-4 space-y-6">

      {/* Dark mode */}
      <button
        onClick={toggleDarkMode}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all ${
          theme.darkMode
            ? 'bg-zinc-900 border-zinc-700 text-white'
            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-800 dark:text-zinc-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme.darkMode ? 'bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-700'}`}>
            {theme.darkMode
              ? <Moon className="w-4 h-4 text-zinc-200" />
              : <Sun className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            }
          </div>
          <div className="text-left">
            <p className="text-xs font-bold">{theme.darkMode ? 'Dark Mode' : 'Light Mode'}</p>
            <p className={`text-[10px] mt-0.5 ${theme.darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {theme.darkMode ? 'Store uses dark colors' : 'Store uses light colors'}
            </p>
          </div>
        </div>
        <div
          className="relative w-10 h-5 rounded-full transition-colors shrink-0"
          style={{ backgroundColor: theme.darkMode ? '#6c47ff' : '#e4e4e7' }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
            style={{ transform: theme.darkMode ? 'translateX(20px)' : 'translateX(0)' }}
          />
        </div>
      </button>

      {/* Show toggle on storefront, simple row toggle */}
      <div className="flex items-center justify-between px-1 py-0.5">
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Show toggle on store</span>
        <button
          onClick={() => updateTheme({ showDarkToggle: !theme.showDarkToggle })}
          className="relative w-10 h-5 rounded-full transition-colors shrink-0 focus:outline-none"
          style={{ backgroundColor: theme.showDarkToggle !== false ? '#6c47ff' : '#d4d4d8' }}
          aria-label="Toggle dark mode button visibility"
        >
          <span
            className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
            style={{ transform: theme.showDarkToggle !== false ? 'translateX(20px)' : 'translateX(0)' }}
          />
        </button>
      </div>

      {/* Colors */}
      <div>
        <p className={sectionLabelCls}><Palette className="w-3 h-3" /> Colors</p>
        <div className="space-y-3">
          <ColorRow label="Primary"    value={theme.primaryColor}    onChange={v => updateTheme({ primaryColor: v })} />
          <ColorRow label="Background" value={theme.backgroundColor} onChange={v => updateTheme({ backgroundColor: v })} />
          <ColorRow label="Text"       value={theme.textColor}       onChange={v => updateTheme({ textColor: v })} />
          <ColorRow label="Accent"     value={theme.accentColor}     onChange={v => updateTheme({ accentColor: v })} />
          <ColorRow label="Footer"     value={theme.footerColor}     onChange={v => updateTheme({ footerColor: v })} />
        </div>
      </div>

      {/* Layout */}
      <div>
        <p className={sectionLabelCls}><Layers className="w-3 h-3" /> Layout</p>
        <div>
          <label className={labelCls}>Section Divider</label>
          <div className="space-y-2">
            {[
              { value: 'none',     label: 'None',       preview: null },
              { value: 'solid',    label: 'Line',       preview: 'solid' },
              { value: 'dotted',   label: 'Dotted',     preview: 'dotted' },
              { value: 'animated', label: '✨ Shimmer',  preview: 'animated' },
              { value: 'wave',     label: '〰 Wave',     preview: 'wave' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => updateTheme({ dividerStyle: opt.value })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  theme.dividerStyle === opt.value
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800'
                }`}
              >
                <div className="flex-1 h-0.5 rounded-full overflow-hidden">
                  {opt.preview === 'solid' && <div className="h-full w-full bg-zinc-300" />}
                  {opt.preview === 'dotted' && <div className="h-full w-full border-t-2 border-dashed border-zinc-300" />}
                  {opt.preview === 'animated' && (
                    <div className="h-full w-full" style={{ background: `linear-gradient(90deg, transparent, ${theme.primaryColor}, transparent)` }} />
                  )}
                  {opt.preview === 'wave' && (
                    <div className="h-full w-full" style={{ backgroundImage: `repeating-linear-gradient(90deg, ${theme.primaryColor} 0px, ${theme.primaryColor} 3px, transparent 3px, transparent 6px)` }} />
                  )}
                </div>
                <span className="shrink-0">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Typography */}
      <div>
        <p className={sectionLabelCls}><Type className="w-3 h-3" /> Typography</p>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Body Font</label>
            <select value={theme.font} onChange={e => updateTheme({ font: e.target.value })} className={inputCls}>
              <option value="sans">Inter, Sans</option>
              <option value="serif">Playfair, Serif</option>
              <option value="mono">Roboto Mono</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Heading Font</label>
            <select value={theme.headingFont} onChange={e => updateTheme({ headingFont: e.target.value })} className={inputCls}>
              <option value="sans">Inter, Sans</option>
              <option value="serif">Playfair, Serif</option>
              <option value="mono">Roboto Mono</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 cursor-pointer shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
        <p className="text-[10px] font-mono text-zinc-500">{value}</p>
      </div>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-20 text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50" />
    </div>
  )
}
