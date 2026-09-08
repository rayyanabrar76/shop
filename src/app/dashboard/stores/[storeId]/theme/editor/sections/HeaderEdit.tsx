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
          />
          <p className="text-[10px] text-zinc-400 mt-1">Leave empty to show your store name as text</p>
        </div>

        {/* Centred suits stacked or square logos, which look lost in a corner;
            left suits wide horizontal wordmarks. */}
        <div data-field="header-layout">
          <label className={labelCls}>Header Layout</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'left',     label: 'Logo Left',    bars: 'justify-start' },
              { value: 'centered', label: 'Logo Centred', bars: 'justify-center' },
            ].map(opt => {
              const active = (theme.headerLayout ?? 'left') === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => updateTheme({ headerLayout: opt.value })}
                  className={`flex flex-col items-center gap-2 py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                    active
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border-(--admin-border) hover:border-(--admin-field-border-hover) text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800'
                  }`}
                >
                  <span className={`flex items-center gap-1 w-14 ${opt.bars}`}>
                    <span className="h-2 w-5 rounded-sm bg-current opacity-80" />
                    <span className="h-1 w-2 rounded-sm bg-current opacity-40" />
                    <span className="h-1 w-2 rounded-sm bg-current opacity-40" />
                  </span>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls}>Logo Max Width</label>
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

        {/* Both are caps, not sizes: the logo keeps its shape and shrinks to fit
            whichever it reaches first. Spelling that out here because a square
            logo makes the width slider look like it controls header height. */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls}>Logo Max Height</label>
            <span className="text-[10px] font-mono text-zinc-400">{theme.logoHeight ?? 48}px</span>
          </div>
          <input
            type="range"
            min={24} max={120} step={4}
            value={theme.logoHeight ?? 48}
            onChange={e => updateTheme({ logoHeight: parseInt(e.target.value) })}
            className="w-full accent-zinc-900 h-1.5 rounded-full cursor-pointer"
          />
          <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
            Both sliders are limits, not sizes, your logo keeps its shape and
            shrinks to fit whichever it hits first. The header grows to whatever
            height the logo ends up, so this is usually the one that sets it.
            Use <strong>Height</strong> below to change the bar without resizing
            the logo.
          </p>
        </div>

        {/* ── Layout ── */}
        <Seg
          label="Menu Position"
          value={theme.menuPosition ?? 'auto'}
          onChange={v => updateTheme({ menuPosition: v })}
          options={[
            { value: 'auto',   label: 'Auto' },
            { value: 'left',   label: 'Left' },
            { value: 'center', label: 'Centre' },
            { value: 'right',  label: 'Right' },
          ]}
          hint="Auto follows the logo position."
        />

        {/* ── Appearance ── */}
        <div className="pt-1 border-t border-(--admin-edge)" />

        <Seg
          label="Width"
          value={theme.headerWidth ?? 'page'}
          onChange={v => updateTheme({ headerWidth: v })}
          options={[{ value: 'page', label: 'Page' }, { value: 'full', label: 'Full' }]}
          hint="Page keeps content aligned with the rest of the store."
        />

        <Seg
          label="Height"
          value={theme.headerHeight ?? 'standard'}
          onChange={v => updateTheme({ headerHeight: v })}
          options={[
            { value: 'compact',  label: 'Compact' },
            { value: 'standard', label: 'Standard' },
            { value: 'tall',     label: 'Tall' },
          ]}
        />

        <div>
          <label className={labelCls}>Sticky Header</label>
          <button
            onClick={() => updateTheme({ headerSticky: !(theme.headerSticky ?? true) })}
            className="flex items-center gap-3 w-full"
          >
            <span
              className="relative w-9 h-5 rounded-full transition-colors shrink-0"
              style={{ backgroundColor: (theme.headerSticky ?? true) ? '#0a0a0a' : '#d4d4d8' }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: (theme.headerSticky ?? true) ? 18 : 2 }}
              />
            </span>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {(theme.headerSticky ?? true) ? 'Stays visible when scrolling' : 'Scrolls away with the page'}
            </span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls}>Border Thickness</label>
            <span className="text-[10px] font-mono text-zinc-400">{theme.headerBorderWidth ?? 1}px</span>
          </div>
          <input
            type="range"
            min={0} max={6} step={1}
            value={theme.headerBorderWidth ?? 1}
            onChange={e => updateTheme({ headerBorderWidth: parseInt(e.target.value) })}
            className="w-full accent-zinc-900 h-1.5 rounded-full cursor-pointer"
          />
        </div>

        <Seg
          label="Utilities"
          value={theme.utilityStyle ?? 'icons'}
          onChange={v => updateTheme({ utilityStyle: v })}
          options={[{ value: 'icons', label: 'Icons' }, { value: 'text', label: 'Text' }]}
          hint="Icons are always used on mobile."
        />

        {/* ── Home page ── */}
        <div className="pt-1 border-t border-(--admin-edge)" />

        <div>
          <label className={labelCls}>Transparent On Home Page</label>
          <button
            onClick={() => updateTheme({ headerTransparent: !(theme.headerTransparent ?? false) })}
            className="flex items-center gap-3 w-full"
          >
            <span
              className="relative w-9 h-5 rounded-full transition-colors shrink-0"
              style={{ backgroundColor: (theme.headerTransparent ?? false) ? '#0a0a0a' : '#d4d4d8' }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: (theme.headerTransparent ?? false) ? 18 : 2 }}
              />
            </span>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {(theme.headerTransparent ?? false) ? 'Sits over the hero image' : 'Solid bar above the hero'}
            </span>
          </button>
          <p className="text-[10px] text-zinc-400 mt-1">
            Home page only. Turns solid once the visitor scrolls.
          </p>
        </div>

        {(theme.headerTransparent ?? false) && (
          <>
            <div data-field="header-inverse-logo">
              <label className={labelCls}>Inverse Logo</label>
              <MediaPicker
                storeId={storeId}
                value={theme.headerInverseLogoUrl ?? ''}
                onChange={url => updateTheme({ headerInverseLogoUrl: url })}
                accept="image"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                A light version of your logo, used while the header is over the image. Falls back to your normal logo.
              </p>
            </div>

            <ColorField
              label="Text Over Image"
              value={theme.headerTransparentText ?? '#ffffff'}
              onChange={v => updateTheme({ headerTransparentText: v })}
              placeholder="#ffffff"
              onReset={() => updateTheme({ headerTransparentText: '#ffffff' })}
            />
          </>
        )}

        {/* ── Colors ── */}
        <div className="pt-1 border-t border-(--admin-edge)" />

        <ColorField
          label="Background"
          value={theme.headerBgColor ?? ''}
          onChange={v => updateTheme({ headerBgColor: v })}
          placeholder="translucent white"
          onReset={() => updateTheme({ headerBgColor: '' })}
        />

        <ColorField
          label="Text Color"
          value={theme.headerTextColor ?? ''}
          onChange={v => updateTheme({ headerTextColor: v })}
          placeholder="inherit"
          onReset={() => updateTheme({ headerTextColor: '' })}
        />

      </div>
    </div>
  )
}

function Seg({ label, value, onChange, options, hint }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  hint?: string
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`py-2 rounded-xl border text-[11px] font-bold transition-all ${
              value === opt.value
                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                : 'border-(--admin-border) hover:border-(--admin-field-border-hover) text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {hint && <p className="text-[10px] text-zinc-400 mt-1">{hint}</p>}
    </div>
  )
}

function ColorField({ label, value, onChange, placeholder, onReset }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  onReset: () => void
}) {
  return (
    <div>
      <label className={labelCls}>
        {label} <span className="normal-case font-normal opacity-60">blank uses the default</span>
      </label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value || '#ffffff'}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg border border-(--admin-border) p-0.5 cursor-pointer shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono text-zinc-500">{value || `(${placeholder})`}</p>
        </div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-24 text-[10px] font-mono border border-(--admin-border) rounded-lg px-2 py-1 focus:outline-none focus:border-(--admin-field-border-focus) bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
        />
      </div>
      {value && (
        <button onClick={onReset} className="mt-1.5 text-[10px] text-zinc-400 hover:text-zinc-600 underline">
          Reset to default
        </button>
      )}
    </div>
  )
}
