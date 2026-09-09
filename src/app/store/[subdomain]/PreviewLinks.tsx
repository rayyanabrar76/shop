'use client'

import { useEffect } from 'react'
import { useIsEditor, previewNavigate } from './EditorHighlight'
import { useStoreBase } from '@/components/StoreBaseProvider'

/**
 * Makes the preview walkable while the theme is being edited.
 *
 * The editor loads the storefront in an iframe and owns its src. A link that
 * navigated the frame by itself would leave the editor behind: the sidebar
 * would still be describing the page you just left, and the unsaved theme is
 * held in the parent, not in the frame. So every in-shop link is caught here
 * and reported upward, and the editor moves the preview.
 *
 * Caught in the capture phase, because React's own handlers run later and the
 * point is to decide before any of them do. Two things are deliberately left
 * alone:
 *
 *   - anything inside an EditorItem, which is a thing you click to edit, not
 *     a thing you click to go somewhere. Those already stop the click.
 *   - anything outside the shop. The dashboard is not a page of the theme,
 *     and loading it into this frame would end the editing session.
 */
export default function PreviewLinks() {
  const isEditor = useIsEditor()
  const storeBase = useStoreBase()

  useEffect(() => {
    if (!isEditor) return

    function onClick(e: MouseEvent) {
      // A modified click means "open this somewhere else", which is a request
      // to leave the editor, not to move inside it.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return
      if (anchor.closest('[data-editor-item]')) return

      const href = anchor.getAttribute('href') || ''
      if (!href || href.startsWith('#')) return
      // mailto:, tel: and the like are not pages of the shop.
      if (/^[a-z]+:/i.test(href) && !/^https?:/i.test(href)) return

      let url: URL
      try { url = new URL(anchor.href, window.location.href) } catch { return }
      // Somewhere else entirely. Loading it into this frame would replace the
      // preview with a site the editor cannot drive, so it opens in a tab.
      if (url.origin !== window.location.origin) {
        e.preventDefault()
        window.open(url.href, '_blank', 'noopener,noreferrer')
        return
      }

      // Everything the editor can show lives under the shop's own base. On a
      // custom domain that base is empty and every path qualifies; on the
      // platform domain it is /store/<subdomain>.
      const base = storeBase || ''
      if (base && !(url.pathname === base || url.pathname.startsWith(base + '/'))) {
        e.preventDefault()
        return
      }

      const path = url.pathname.slice(base.length) + url.search
      e.preventDefault()
      e.stopPropagation()
      previewNavigate(path || '/', { label: anchor.textContent?.trim().slice(0, 60) || undefined })
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [isEditor, storeBase])

  return null
}
