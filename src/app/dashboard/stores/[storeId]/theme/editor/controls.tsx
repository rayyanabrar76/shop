'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bold, Check, ChevronDown, Italic, Link2, List, ListOrdered } from 'lucide-react'
import { labelCls } from './types'

/**
 * Shared panel controls.
 *
 * Every panel had been assembling its own colour row out of a raw
 * <input type="color">, a label, a mono hex box and sometimes a reset link —
 * three or four times per panel, each slightly different. Beyond the
 * duplication, the browser's native colour input draws its own chrome, which no
 * amount of surrounding styling can bring into line with the rest of the panel.
 */

function Label({ text, hint }: { text: string; hint?: string }) {
  return (
    <label className={labelCls}>
      {text}
      {hint && <span className="normal-case font-normal tracking-normal opacity-60">, {hint}</span>}
    </label>
  )
}

export function ColorField({
  label,
  hint,
  value,
  fallback,
  onChange,
  onReset,
}: {
  label: string
  hint?: string
  value: string
  /** Shown when the field is blank, i.e. the value it inherits. */
  fallback?: string
  onChange: (v: string) => void
  onReset?: () => void
}) {
  const shown = value || fallback || '#000000'

  return (
    <div>
      <Label text={label} hint={hint} />
      <div className="flex items-center gap-2 rounded-lg border border-(--admin-edge) bg-white p-1.5 transition-[border-color,box-shadow] focus-within:border-(--admin-field-border-focus) focus-within:ring-2 focus-within:ring-zinc-900/5 dark:bg-zinc-800 dark:focus-within:ring-white/10">
        {/* The real input is invisible on top of a plain swatch: it keeps the
            native colour picker and its keyboard behaviour while showing none
            of the browser's own bevelled chrome. */}
        <label
          className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-md ring-1 ring-inset ring-zinc-900/15"
          style={{ backgroundColor: shown }}
        >
          <input
            type="color"
            value={shown}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={label}
          />
        </label>

        <input
          type="text"
          value={value}
          placeholder={fallback}
          onChange={e => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent font-mono text-[11px] uppercase text-zinc-900 outline-none placeholder:normal-case placeholder:text-zinc-300 dark:text-zinc-50 dark:placeholder:text-zinc-600"
        />

        {onReset && value && (
          <button
            onClick={onReset}
            className="shrink-0 rounded px-1.5 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

export function SelectField({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string
  hint?: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  /**
   * The menu is portalled to <body> and positioned by hand.
   *
   * The settings panel scrolls and clips its overflow, so a menu rendered in
   * place is cut off at the panel's edge — a control near the bottom of a long
   * panel opened into nothing. Escaping to <body> means no ancestor can clip
   * it, and being free of the panel it can also flip above the trigger when
   * there is more room up there than down.
   */
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null)

  function place() {
    const r = triggerRef.current?.getBoundingClientRect()
    if (!r) return
    const below = window.innerHeight - r.bottom
    const wanted = Math.min(options.length * 36 + 8, 256)
    const flip = below < wanted && r.top > below
    setPos({
      left: r.left,
      width: r.width,
      ...(flip ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
    })
  }

  useEffect(() => {
    if (!open) return
    place()
    // Reposition rather than trail behind the trigger. Capture is needed to
    // catch scrolling inside the panel, which does not bubble to window.
    const onMove = () => place()
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // A dropdown that stays open when you click elsewhere is worse than a native
  // select, so this is not optional.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      // The menu sits outside this subtree now, so it needs its own check or
      // picking an option would close the menu before the click landed.
      if (!ref.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = options.find(o => o.value === value) ?? options[0]

  return (
    <div ref={ref}>
      <Label text={label} hint={hint} />
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-[13px] text-zinc-900 transition-[border-color,box-shadow] dark:bg-zinc-800 dark:text-zinc-50 ${
            open
              ? 'border-(--admin-field-border-focus) ring-2 ring-zinc-900/5 dark:ring-white/10'
              : 'border-(--admin-field-border) hover:border-(--admin-field-border-hover)'
          }`}
        >
          <span className="truncate">{current?.label ?? value}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && pos && createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
            className="z-[200] max-h-64 overflow-auto rounded-lg border border-(--admin-edge) bg-white py-1 shadow-[0_8px_24px_-8px_rgba(9,9,11,0.25)] dark:bg-zinc-800"
          >
            {options.map(o => {
              const selected = o.value === value
              return (
                <button
                  key={o.value}
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700/60 ${
                    selected
                      ? 'font-medium text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
      </div>
    </div>
  )
}

/**
 * A setting that is simply on or off, as one row: label left, switch right.
 * Matches the height and rhythm of the section rows in the sidebar list.
 */
export function ToggleRow({
  label,
  hint,
  on,
  onChange,
}: {
  label: string
  hint?: string
  on: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[13px] text-zinc-700 dark:text-zinc-300">{label}</p>
        {hint && <p className="text-[10px] text-zinc-500">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          on ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform dark:bg-zinc-900 ${
            on ? 'translate-x-4' : ''
          }`}
        />
      </button>
    </div>
  )
}

const BLOCKS = [
  { value: 'p',  label: 'Paragraph', cls: 'text-[13px]' },
  { value: 'h1', label: 'Heading 1', cls: 'text-2xl font-bold tracking-tight' },
  { value: 'h2', label: 'Heading 2', cls: 'text-xl font-bold tracking-tight' },
  { value: 'h3', label: 'Heading 3', cls: 'text-lg font-semibold' },
  { value: 'h4', label: 'Heading 4', cls: 'text-base font-semibold' },
  { value: 'h5', label: 'Heading 5', cls: 'text-[13px] font-semibold' },
  { value: 'h6', label: 'Heading 6', cls: 'text-[12px] font-medium text-zinc-500 dark:text-zinc-400' },
]

/**
 * Block-level picker for the text toolbar.
 *
 * Each option is drawn at the size it applies, so the menu is a specimen sheet
 * rather than a list of names — you pick the one that looks right instead of
 * translating "Heading 4" into a size in your head.
 *
 * Portalled for the same reason as SelectField: the settings panel clips its
 * overflow, and a menu this tall opened from a field near the bottom would be
 * cut in half.
 */
function BlockMenu({ onPick }: { onPick: (tag: string) => void }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('p')
  const btn = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const r = btn.current?.getBoundingClientRect()
    if (r) {
      const wanted = 300
      const below = window.innerHeight - r.bottom
      const flip = below < wanted && r.top > below
      setPos({
        left: r.left,
        width: 196,
        ...(flip ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
      })
    }
    // Reflects where the caret actually is, so the tick is not a guess.
    try {
      const v = document.queryCommandValue('formatBlock')
      if (v) setCurrent(String(v).toLowerCase().replace(/[<>]/g, '') || 'p')
    } catch {}

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!btn.current?.contains(t) && !menu.current?.contains(t)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        ref={btn}
        type="button"
        title="Text style"
        aria-label="Text style"
        // Mouse-down would blur the editor and lose the selection before the
        // menu could act on it.
        onMouseDown={e => { e.preventDefault(); setOpen(v => !v) }}
        className={`mr-1 flex h-7 items-center gap-1 rounded px-1.5 text-[12px] font-semibold transition-colors ${
          open
            ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50'
            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700'
        }`}
      >
        Aa
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && pos && createPortal(
        <div
          ref={menu}
          style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
          className="z-[200] overflow-hidden rounded-lg border border-(--admin-edge) bg-white py-1 shadow-[0_8px_24px_-8px_rgba(9,9,11,0.25)] dark:bg-zinc-800"
        >
          {BLOCKS.map(b => (
            <button
              key={b.value}
              type="button"
              onMouseDown={e => { e.preventDefault(); onPick(b.value); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-zinc-900 transition-colors hover:bg-zinc-50 dark:text-zinc-50 dark:hover:bg-zinc-700/60"
            >
              <Check className={`h-3 w-3 shrink-0 ${current === b.value ? 'opacity-100' : 'opacity-0'}`} />
              <span className={b.cls}>{b.label}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}

/**
 * Body copy with a small formatting toolbar: block level, bold, italic, link
 * and the two list kinds.
 *
 * The editable area is a contentEditable holding HTML rather than a textarea
 * holding text — that is what lets the merchant see the heading as a heading
 * while they write it. The value handed back is raw HTML and MUST go through
 * sanitizeRichText before it is stored or rendered; the toolbar can only
 * produce safe markup, but a paste from Word or a browser extension can put
 * anything in here.
 */
export function RichTextField({
  label,
  hint,
  value,
  onChange,
  rows = 6,
}: {
  label: string
  hint?: string
  value: string
  onChange: (html: string) => void
  rows?: number
}) {
  const editor = useRef<HTMLDivElement>(null)

  // Only seed the DOM when the value differs from what is already in it.
  // Writing on every render would move the caret to the start on each keypress.
  useEffect(() => {
    const el = editor.current
    if (el && el.innerHTML !== value) el.innerHTML = value || ''
  }, [value])

  // execCommand is deprecated and still the only thing every browser
  // implements for this. The alternative is a selection-model editor, which is
  // a library, not a control.
  const run = (cmd: string, arg?: string) => {
    editor.current?.focus()
    document.execCommand(cmd, false, arg)
    onChange(editor.current?.innerHTML ?? '')
  }

  const Btn = ({ on, title, children }: { on: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      // Mouse-down, not click: clicking would blur the editor first and the
      // command would apply to no selection.
      onMouseDown={e => { e.preventDefault(); on() }}
      className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
    >
      {children}
    </button>
  )

  return (
    <div>
      <Label text={label} hint={hint} />
      <div className="overflow-hidden rounded-lg border border-(--admin-edge) bg-white transition-[border-color,box-shadow] focus-within:border-(--admin-field-border-focus) focus-within:ring-2 focus-within:ring-zinc-900/5 dark:bg-zinc-800 dark:focus-within:ring-white/10">
        <div className="flex items-center gap-0.5 border-b border-(--admin-edge) px-1.5 py-1">
          <BlockMenu onPick={tag => run('formatBlock', `<${tag}>`)} />
          <span className="mx-0.5 h-4 w-px bg-(--admin-edge)" />
          <Btn title="Bold" on={() => run('bold')}><Bold className="h-3.5 w-3.5" /></Btn>
          <Btn title="Italic" on={() => run('italic')}><Italic className="h-3.5 w-3.5" /></Btn>
          <Btn
            title="Link"
            on={() => {
              const url = window.prompt('Link to')
              if (url) run('createLink', url)
            }}
          >
            <Link2 className="h-3.5 w-3.5" />
          </Btn>
          <span className="mx-0.5 h-4 w-px bg-(--admin-edge)" />
          <Btn title="Bulleted list" on={() => run('insertUnorderedList')}><List className="h-3.5 w-3.5" /></Btn>
          <Btn title="Numbered list" on={() => run('insertOrderedList')}><ListOrdered className="h-3.5 w-3.5" /></Btn>
        </div>

        <div
          ref={editor}
          contentEditable
          suppressContentEditableWarning
          onInput={e => onChange((e.target as HTMLDivElement).innerHTML)}
          style={{ minHeight: rows * 22 }}
          className="prose-sm max-w-none px-3 py-2 text-[13px] leading-relaxed text-zinc-900 outline-none dark:text-zinc-50 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:text-lg [&_h4]:font-semibold [&_h5]:text-base [&_h5]:font-semibold [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:uppercase [&_h6]:tracking-widest [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
        />
      </div>
    </div>
  )
}
