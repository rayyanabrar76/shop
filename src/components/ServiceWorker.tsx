'use client'

import { useEffect } from 'react'

/**
 * Registers the worker that makes ShopFlow installable.
 *
 * Production only, and not because of some rule about it: in development the
 * dev server rewrites its own chunks constantly, and a worker sitting in front
 * of them serves yesterday's build back with no obvious reason why. There is
 * nothing to test locally anyway, since a phone cannot reach localhost.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    // After load, so registering never competes with the first paint.
    const register = () => navigator.serviceWorker.register('/sw.js').catch(() => {})
    if (document.readyState === 'complete') register()
    else {
      window.addEventListener('load', register)
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
