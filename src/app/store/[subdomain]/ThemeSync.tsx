'use client'

import { useEffect } from 'react'
import { isDark } from '@/lib/contrast'

/**
 * Keeps the live preview in step with the editor.
 *
 * The storefront runs inside an iframe while it is being edited, so a colour
 * changed in the panel has to reach the page without a reload. The panel posts
 * the whole theme on every keystroke and this writes the parts that are
 * colours into CSS variables, which is where every storefront component reads
 * them from.
 *
 * It also announces itself on mount. The editor cannot know when a sub-page
 * has finished loading inside the frame, so the frame says so and the editor
 * replies with the current theme.
 *
 * This was DarkModeSync until 2026-09-08, when the storefront's dark mode was
 * removed. The variable syncing was always the useful half; the dark half was
 * a second theme fighting the merchant's own colours.
 */
export default function ThemeSync() {
  useEffect(() => {
    const inEditor = window.self !== window.top && !new URLSearchParams(window.location.search).has('preview')
    if (inEditor) window.parent.postMessage({ type: 'page:ready' }, '*')

    function handleMessage(e: MessageEvent) {
      if (e.data?.type !== 'theme:update' || !e.data.theme) return
      const t = e.data.theme
      const el = document.documentElement
      el.style.setProperty('--store-bg', t.backgroundColor || '#ffffff')
      el.style.setProperty('--store-text', t.textColor || '#09090b')
      el.style.setProperty('--store-footer', t.footerColor || '#ffffff')
      el.style.setProperty('--store-pg-bg', t.productGridBg || '#ffffff')
      el.style.setProperty('--store-divider', 'rgba(0,0,0,0.08)')
      el.style.setProperty('--store-card-border', '#f1f1f1')

      // The browser's own chrome follows too. Without this, painting a shop
      // dark in the editor left a white scrollbar gutter down the preview and
      // a thumb you could not see against it.
      const dark = isDark(t.backgroundColor || '#ffffff')
      el.style.colorScheme = dark ? 'dark' : 'light'
      el.style.setProperty('--scrollbar-thumb', dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.16)')
      el.style.setProperty('--scrollbar-thumb-hover', dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.30)')
      el.style.setProperty('--scrollbar-thumb-active', dark ? 'rgba(255,255,255,0.44)' : 'rgba(0,0,0,0.42)')
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return null
}
