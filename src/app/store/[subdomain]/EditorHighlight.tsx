'use client'

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
    <div id={id} className={`relative group/sec cursor-pointer ${className}`} onClick={() => onEdit(section)}>
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
