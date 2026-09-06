'use client'

import { useEffect, useRef } from 'react'

/**
 * Escape closes only the topmost modal.
 *
 * Each modal listens on `document`, so when one opens inside another — the AI
 * image generator inside the new-category form, say — a single Escape reached
 * every listener and closed the whole stack at once. Registration order is
 * enough to know which is on top: a modal can only open after the one behind it.
 */
const stack: symbol[] = []

export function useModalEscape(onEscape: () => void, active = true) {
  // Held in a ref so an inline arrow does not re-register the handler on every
  // render, which would shuffle this modal's position in the stack.
  const handler = useRef(onEscape)
  handler.current = onEscape

  useEffect(() => {
    if (!active) return

    const id = Symbol('modal')
    stack.push(id)

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (stack[stack.length - 1] !== id) return
      handler.current()
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      const i = stack.indexOf(id)
      if (i !== -1) stack.splice(i, 1)
    }
  }, [active])
}
