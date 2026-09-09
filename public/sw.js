/*
 * The smallest service worker that earns the install prompt.
 *
 * Chrome will not offer to install a site unless a worker is registered and
 * handles fetch, so this exists to answer that and to say something useful
 * when the phone is offline. It deliberately does almost nothing else.
 *
 * Nothing authenticated is ever cached. Every screen in this app is somebody's
 * shop behind a Clerk session, and a cached page is a page that can be served
 * to the next person to open the app on a shared device, or served stale after
 * an order comes in. So only the offline page and the icons live in the cache,
 * and every other request goes to the network untouched.
 */
const VERSION = 'shopflow-v1'
const SHELL = ['/offline', '/icon-192.png']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', event => {
  const { request } = event

  // Only whole-page loads. Everything else, including every API call and every
  // asset, is left to the browser exactly as if this worker were not here.
  if (request.method !== 'GET' || request.mode !== 'navigate') return

  event.respondWith(
    fetch(request).catch(() => caches.match('/offline').then(r => r ?? Response.error())),
  )
})
