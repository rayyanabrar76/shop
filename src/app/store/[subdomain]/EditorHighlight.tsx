'use client'

import { useSyncExternalStore } from 'react'

const BLUE = '#3b82f6'

/** Wraps a whole section — shows a border + "Edit X" badge on hover. Non-blocking. */
export function EditorSection({
  label,
  section,
  isEditor,
  onEdit,
  children,
  className = '',
  id,
}: {
  label: string
  section: string
  isEditor: boolean
  onEdit: (s: string) => void
  children: React.ReactNode
  className?: string
  id?: string
}) {
  if (!isEditor) return <div id={id} className={className}>{children}</div>
  return (
    <div id={id} data-editor-section={section} className={`relative group/sec cursor-pointer ${className}`} onClick={() => onEdit(section)}>
      {children}
      {/* non-blocking border */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover/sec:opacity-100 transition-opacity z-90"
        style={{ outline: `2px solid ${BLUE}`, outlineOffset: '-2px' }}
      />
      {/* clickable badge */}
      <button
        onClick={() => onEdit(section)}
        className="absolute top-0 left-0 opacity-0 group-hover/sec:opacity-100 transition-opacity z-100 flex items-center gap-1 cursor-pointer"
        style={{
          background: BLUE, color: '#fff',
          fontSize: '10px', fontWeight: 700,
          padding: '3px 8px', letterSpacing: '0.03em',
          border: 'none', borderBottomRightRadius: '6px',
        }}
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        {label}
      </button>
    </div>
  )
}

/** Wraps an individual text/button — shows a dashed ring + tiny badge on hover. */
export function EditorItem({
  section,
  field,
  meta,
  label,
  isEditor,
  onEdit,
  children,
  block = false,
}: {
  section: string
  field?: string
  meta?: Record<string, unknown>
  label: string
  isEditor: boolean
  onEdit: (s: string) => void
  children: React.ReactNode
  block?: boolean
}) {
  if (!isEditor) return <>{children}</>

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (field) {
      window.parent.postMessage({ type: 'field:focus', section, field, ...(meta ?? {}) }, '*')
    } else {
      onEdit(section)
    }
  }

  return (
    <span
      data-editor-item={field ?? section}
      className={`relative group/item cursor-pointer ${block ? 'block' : 'inline-block'}`}
      onClick={handleClick}
    >
      {children}
      {/* dashed ring */}
      <span
        className="absolute inset-0 pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity"
        style={{ outline: `1.5px dashed ${BLUE}`, outlineOffset: '3px', borderRadius: '3px' }}
      />
      {/* label badge */}
      <span
        className="absolute top-0 left-0 pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity z-200 whitespace-nowrap flex items-center gap-1"
        style={{
          background: BLUE, color: '#fff',
          fontSize: '9px', fontWeight: 700,
          padding: '2px 6px', borderRadius: '0 0 4px 0',
        }}
      >
        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        {label}
      </span>
    </span>
  )
}

/**
 * A zero-height hover strip between sections. Hovering reveals a rule and an
 * "Add section" pill; clicking asks the parent editor to open the section
 * picker. Editor-only — it renders nothing on the live storefront.
 */
export function AddSectionSlot({ isEditor }: { isEditor: boolean }) {
  if (!isEditor) return null
  return (
    <div className="relative h-0 group/add z-100">
      <div className="absolute inset-x-0 -top-5 h-10 flex items-center gap-3 px-6 pointer-events-none">
        <span
          className="flex-1 h-px opacity-0 group-hover/add:opacity-100 transition-opacity"
          style={{ backgroundColor: BLUE }}
        />
        <button
          type="button"
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            window.parent.postMessage({ type: 'add-section' }, '*')
          }}
          className="pointer-events-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white opacity-0 group-hover/add:opacity-100 transition-opacity shadow-lg"
          style={{ backgroundColor: BLUE }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add section
        </button>
        <span
          className="flex-1 h-px opacity-0 group-hover/add:opacity-100 transition-opacity"
          style={{ backgroundColor: BLUE }}
        />
      </div>
    </div>
  )
}

/**
 * Is this page being rendered inside the theme editor's preview frame?
 *
 * The editor loads the real storefront in an iframe, so "am I being edited"
 * is the same question as "am I framed, and not by the customer preview".
 * Pages that pass an explicit isEditor prop down from a client shell keep
 * doing that; this is for the chrome that any page can render without one.
 *
 * False on the first paint by design. It is read after mount because the
 * server has no window to ask, and a guess on the server that the client
 * disagrees with is a hydration mismatch.
 */
export function useIsEditor(): boolean {
  return useSyncExternalStore(NEVER_CHANGES, readIsEditor, () => false)
}

/** Whether the page is framed cannot change without a navigation, so there is
 *  nothing to subscribe to. */
const NEVER_CHANGES = () => () => {}
function readIsEditor() {
  return window.self !== window.top && !new URLSearchParams(window.location.search).has('preview')
}

/**
 * Ask the editor to move its preview to another storefront page.
 *
 * The frame cannot navigate itself: the editor owns the iframe's src, holds
 * the unsaved theme, and has a sidebar that has to end up on the same page as
 * the preview. So a link inside the preview reports where it wanted to go and
 * lets the editor take it there.
 */
export function previewNavigate(path: string, meta?: { label?: string; kind?: string }) {
  window.parent.postMessage(
    { type: 'preview:navigate', path, label: meta?.label ?? null, kind: meta?.kind ?? 'page' },
    '*',
  )
}

/**
 * The default onEdit for chrome that was not handed one.
 *
 * EditorItem posts field:focus by itself, but EditorSection and the whole-
 * section fallbacks call onEdit, and a header rendered by a server page has
 * nobody to pass a callback in. Same message the client shells send.
 */
export function notifyEdit(section: string) {
  window.parent.postMessage({ type: 'section:edit', section }, '*')
}
