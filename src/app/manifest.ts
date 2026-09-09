import type { MetadataRoute } from 'next'

/**
 * What a phone needs to keep ShopFlow on its home screen.
 *
 * The dashboard is the app being installed, not the marketing page, so
 * start_url points at it: someone who has bothered to install this wants their
 * shop, and Clerk sends them to sign in first if they are not already.
 *
 * standalone drops the browser chrome, which is the whole point of installing
 * it. portrait-primary because every screen in here is a column, and a
 * landscape dashboard on a phone is a column with nothing beside it.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ShopFlow',
    short_name: 'ShopFlow',
    description: 'Run your shop from your pocket. Orders, products, customers and your storefront.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    // The mark's own ground, so the splash screen and the icon are one colour
    // rather than a logo dropped on white.
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    categories: ['business', 'productivity', 'shopping'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Android crops this to the launcher's own shape, so the mark is drawn
      // small enough to survive a circle.
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
