'use client'

import { useRef, type DragEvent } from 'react'
import SectionHeader from './SectionHeader'
import { labelCls } from '../types'
import { PanelRow } from '../controls'
import { resolveHeroButton } from '@/lib/hero-button'
import MediaPicker from '@/components/MediaPicker'
import { ThemeState, inputCls } from '../types'
import { RichTextField } from '../controls'
import { GripVertical, MousePointerClick, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import UrlPicker from '@/components/UrlPicker'
import AiFieldLabel, { type AiFieldKind } from '@/components/ai/AiFieldLabel'

export interface HeroSlide {
  id: string
  heading: string
  subheading: string
  ctaLabel: string
  ctaUrl: string
  bgColor?: string
  imageUrl?: string
}

interface HeroEditProps {
  storeId: string
  subdomain: string
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
  slides: HeroSlide[]
  onSlidesChange: (slides: HeroSlide[]) => void
  editingIndex: number | null
  onEditingChange: (idx: number | null) => void
  onPageCreated?: (page: any) => void
  /** Opens a panel belonging to the hero. */
  onOpenPanel?: (view: string) => void
}

function newSlide(): HeroSlide {
  return {
    id: `slide-${Date.now()}`,
    heading: 'New Slide',
    subheading: 'Edit this slide.',
    ctaLabel: 'Learn More',
    ctaUrl: '#products',
    bgColor: '#f0f4ff',
  }
}

export default function HeroEdit({ storeId, subdomain, theme, updateTheme, onBack, slides, onSlidesChange, editingIndex, onEditingChange, onPageCreated, onOpenPanel }: HeroEditProps) {
  const heroButton = resolveHeroButton(theme.heroButton)
  const dragIdx = useRef<number | null>(null)
  const overIdx = useRef<number | null>(null)

  function update(id: string, key: keyof HeroSlide, value: string) {
    const next = slides.map(s => s.id === id ? { ...s, [key]: value } : s)
    onSlidesChange(next)
  }

  function add() {
    const next = [...slides, newSlide()]
    onSlidesChange(next)
    onEditingChange(next.length - 1)
  }

  function remove(id: string, i: number) {
    const next = slides.filter(s => s.id !== id)
    onSlidesChange(next)
    if (editingIndex === i) onEditingChange(null)
  }

  function onDragStart(i: number) { dragIdx.current = i }
  function onDragOver(e: DragEvent<HTMLDivElement>, i: number) { e.preventDefault(); overIdx.current = i }
  function onDrop() {
    if (dragIdx.current === null || overIdx.current === null) return
    const next = [...slides]
    const [moved] = next.splice(dragIdx.current, 1)
    next.splice(overIdx.current, 0, moved)
    onSlidesChange(next)
    dragIdx.current = null; overIdx.current = null
  }

  function toggleOpen(i: number) {
    onEditingChange(editingIndex === i ? null : i)
  }

  return (
    <div>
      <SectionHeader title="Hero" description="Carousel slides on top of store" onBack={onBack} />
      <div className="p-4 space-y-3">

        {/* Height, as a share of the window rather than a number of pixels, so
            the same setting means the same thing on a phone and a monitor. The
            top of the track is the whole screen, which is why it is named
            rather than left as another number. */}
        <div data-field="hero-height">
          <div className="flex items-center justify-between mb-2">
            <label className={`${labelCls} mb-0`}>Height</label>
            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 tabular-nums dark:bg-zinc-800 dark:text-zinc-300">
              {(theme.heroHeight ?? 60) >= 100 ? 'Full screen' : `${theme.heroHeight ?? 60}%`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Shows the proportion rather than describing it: the bar fills
                the same fraction of its frame that the hero fills of the
                window. */}
            <div className="relative h-5 w-4 shrink-0 overflow-hidden rounded-[3px] border border-zinc-200 dark:border-zinc-700">
              <div
                className="absolute inset-x-0 top-0 bg-zinc-300 transition-[height] dark:bg-zinc-600"
                style={{ height: `${theme.heroHeight ?? 60}%` }}
              />
            </div>
            <input
              type="range"
              min={40} max={100} step={5}
              value={theme.heroHeight ?? 60}
              onChange={e => updateTheme({ heroHeight: parseInt(e.target.value) })}
              className="flex-1 h-1.5 cursor-pointer rounded-full accent-zinc-900 dark:accent-zinc-100"
              aria-label="Hero height"
            />
            <button
              type="button"
              onClick={() => updateTheme({ heroHeight: 100 })}
              className="shrink-0 rounded-md px-1.5 py-1 text-[10px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              Full
            </button>
          </div>
        </div>

        {/* Content position.

            A grid of nine rather than two dropdowns: the control is the same
            shape as the thing it sets, so picking bottom-centre is one click on
            the bottom-centre square instead of reading two lists and holding
            the combination in your head. */}
        <div data-field="hero-position">
          <label className={labelCls}>Content Position</label>
          <div className="grid w-max grid-cols-3 gap-1 rounded-xl border border-zinc-200 dark:border-zinc-700 p-1">
            {(['top', 'middle', 'bottom'] as const).map(y =>
              (['left', 'center', 'right'] as const).map(x => {
                const value = `${x}-${y}`
                const active = (theme.heroPosition || 'left-middle') === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateTheme({ heroPosition: value })}
                    aria-label={`${y} ${x}`}
                    aria-pressed={active}
                    className={`flex h-7 w-9 items-center justify-center rounded-lg transition-colors ${
                      active
                        ? 'bg-zinc-900 dark:bg-zinc-100'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {/* A short rule, sitting where the text would sit. */}
                    <span
                      className={`block h-0.5 w-3.5 rounded-full ${
                        active ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-300 dark:bg-zinc-600'
                      }`}
                    />
                  </button>
                )
              }),
            )}
          </div>
        </div>

        {/* The button is its own thing: its label and link live on each
            slide, but how it is drawn is one decision for all of them. */}
        {onOpenPanel && (
          <PanelRow
            icon={MousePointerClick}
            label="Button"
            note={heroButton.show ? undefined : 'Hidden'}
            onClick={() => onOpenPanel('hero-button')}
          />
        )}

        <button
          onClick={add}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-700 text-white text-sm font-bold transition-opacity hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add New Slide
        </button>

        <p className="text-[10px] text-zinc-500 italic px-1">
          Click a slide to edit - preview will pause and jump to it.
        </p>

        {slides.map((slide, i) => (
          <SlideCard
            key={slide.id}
            storeId={storeId}
            subdomain={subdomain}
            slide={slide}
            index={i}
            total={slides.length}
            isOpen={editingIndex === i}
            onToggle={() => toggleOpen(i)}
            onUpdate={update}
            onRemove={() => remove(slide.id, i)}
            onDragStart={() => onDragStart(i)}
            onDragOver={e => onDragOver(e, i)}
            onDrop={onDrop}
            onPageCreated={onPageCreated}
          />
        ))}
      </div>
    </div>
  )
}

interface SlideCardProps {
  storeId: string
  subdomain: string
  slide: HeroSlide
  index: number
  total: number
  isOpen: boolean
  onToggle: () => void
  onUpdate: (id: string, key: keyof HeroSlide, value: string) => void
  onRemove: () => void
  onDragStart: () => void
  onDragOver: (e: DragEvent<HTMLDivElement>) => void
  onDrop: () => void
  onPageCreated?: (page: any) => void
}

function SlideCard({ storeId, subdomain, slide, index, total, isOpen, onToggle, onUpdate, onRemove, onDragStart, onDragOver, onDrop, onPageCreated }: SlideCardProps) {
  const textFields: {
    key: keyof HeroSlide
    label: string
    placeholder: string
    fieldId: string
    aiKind: AiFieldKind
    aiHint: string
    /** Formatting toolbar. Only for copy long enough to need one — a toolbar
        over a button label is clutter. */
    rich?: boolean
  }[] = [
    { key: 'heading',    label: 'Heading',      placeholder: 'Big bold headline', fieldId: 'hero-heading',    aiKind: 'heading',    aiHint: 'the big headline on the home page hero slide', rich: true },
    { key: 'subheading', label: 'Subheading',   placeholder: 'Supporting line',   fieldId: 'hero-subheading', aiKind: 'subheading', aiHint: 'the supporting line under the hero headline', rich: true },
    { key: 'ctaLabel',   label: 'Button Label', placeholder: 'Shop Now',          fieldId: 'hero-cta',        aiKind: 'button',     aiHint: 'the call-to-action button on the hero slide' },
  ]

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`rounded-xl border overflow-hidden bg-white dark:bg-zinc-900 transition-all ${isOpen ? 'border-zinc-900 dark:border-zinc-500 ring-2 ring-zinc-900/10 dark:ring-zinc-500/20' : 'border-zinc-200 dark:border-zinc-700'}`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer select-none" onClick={onToggle}>
        <GripVertical className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />
        <div className="w-3.5 h-3.5 rounded-full shrink-0 border-2 border-white shadow" style={{ backgroundColor: slide.bgColor ?? '#f0f4ff' }} />
        <span className="text-sm font-semibold flex-1 truncate text-zinc-800 dark:text-zinc-100">Slide {index + 1}: {slide.heading}</span>
        {total > 1 && (
          <button onClick={e => { e.stopPropagation(); onRemove() }} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-500 hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />}
      </div>
      {isOpen && (
        <div className="px-3 pb-3 space-y-2 border-t border-zinc-100 dark:border-zinc-800">
          {textFields.map(f => (
            <div key={f.key} className="group/ai space-y-1 pt-2" data-field={f.fieldId}>
              <AiFieldLabel
                label={f.label}
                storeId={storeId}
                kind={f.aiKind}
                current={(slide[f.key] as string) ?? ''}
                hint={f.aiHint}
                onWrite={text => onUpdate(slide.id, f.key, text)}
                className="mb-0"
                labelClassName="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider"
              />
              {f.rich ? (
                <RichTextField
                  label=""
                  value={(slide[f.key] as string) ?? ''}
                  onChange={html => onUpdate(slide.id, f.key, html)}
                  rows={3}
                />
              ) : (
                <input
                  className={inputCls}
                  value={(slide[f.key] as string) ?? ''}
                  placeholder={f.placeholder}
                  onChange={e => onUpdate(slide.id, f.key, e.target.value)}
                />
              )}
            </div>
          ))}

          <div className="space-y-1 pt-2">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Button URL</label>
            <UrlPicker
              storeId={storeId}
              subdomain={subdomain}
              value={slide.ctaUrl ?? ''}
              onChange={url => onUpdate(slide.id, 'ctaUrl', url)}
              onPageCreated={onPageCreated}
            />
          </div>

          {/* Background Media (image OR video) */}
          <div className="space-y-1 pt-2">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Background Media (image or video)</label>
            <MediaPicker
              storeId={storeId}
              value={slide.imageUrl ?? ''}
              onChange={(url) => onUpdate(slide.id, 'imageUrl', url)}
              accept="all"
            />
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Background Color</label>
            <div className="flex items-center gap-2">
              <input type="color" className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer" value={slide.bgColor ?? '#f0f4ff'} onChange={e => onUpdate(slide.id, 'bgColor', e.target.value)} />
              <input className={inputCls} value={slide.bgColor ?? '#f0f4ff'} onChange={e => onUpdate(slide.id, 'bgColor', e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
