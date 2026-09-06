'use client'
import { useEffect } from 'react'

export default function DarkModeSync() {
  useEffect(() => {
    const inEditor = window.self !== window.top && !new URLSearchParams(window.location.search).has('preview')
    if (inEditor) window.parent.postMessage({ type: 'page:ready' }, '*')

    function handleMessage(e: MessageEvent) {
      if (e.data?.type !== 'theme:update' || !e.data.theme) return
      const t = e.data.theme

      const el = document.documentElement
      if (t.darkMode) {
        el.setAttribute('data-dark', 'true')
        el.style.setProperty('--store-bg', '#09090b')
        el.style.setProperty('--store-text', '#fafafa')
        el.style.setProperty('--store-footer', '#09090b')
        el.style.setProperty('--store-pg-bg', '#09090b')
        el.style.setProperty('--store-divider', 'rgba(255,255,255,0.12)')
        el.style.setProperty('--store-card-border', 'rgba(255,255,255,0.08)')
      } else {
        el.removeAttribute('data-dark')
        el.style.setProperty('--store-bg', t.backgroundColor || '#ffffff')
        el.style.setProperty('--store-text', t.textColor || '#09090b')
        el.style.setProperty('--store-footer', t.footerColor || '#ffffff')
        el.style.setProperty('--store-pg-bg', t.productGridBg || '#ffffff')
        el.style.setProperty('--store-divider', 'rgba(0,0,0,0.08)')
        el.style.setProperty('--store-card-border', '#f1f1f1')
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return null
}
