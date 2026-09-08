/**
 * Client-safe helpers for media URLs.
 *
 * Deliberately separate from lib/imagekit.ts, which constructs the server SDK
 * with the private key -- importing that into a client component would ship
 * the key to the browser.
 */

const IMAGEKIT_HOST = 'ik.imagekit.io'

/**
 * A resized copy of an ImageKit image, for grids and previews.
 *
 * The media library was rendering originals into 100px tiles: twenty assets at
 * a few hundred KB each is several megabytes to show thumbnails, which is why
 * the picker took so long to become useful. ImageKit resizes on its own CDN
 * from a URL parameter, so this costs nothing to ask for.
 *
 * Anything not on ImageKit is returned untouched -- an unrecognised host has
 * no transformation API, and a mangled URL is worse than a large one.
 */
export function thumbUrl(url: string, size = 240): string {
  if (!url || !url.includes(IMAGEKIT_HOST)) return url
  // fo-auto keeps the subject centred when cropping to a square tile.
  const tr = `tr=w-${size},h-${size},fo-auto`
  return url.includes('?') ? `${url}&${tr}` : `${url}?${tr}`
}

/**
 * A still frame for a video, so a grid of clips does not download the clips.
 * ImageKit exposes one by swapping the extension for its thumbnail endpoint.
 */
export function videoPosterUrl(url: string, size = 240): string {
  if (!url || !url.includes(IMAGEKIT_HOST)) return ''
  const [base, query] = url.split('?')
  const poster = `${base}/ik-thumbnail.jpg`
  const tr = `tr=w-${size},h-${size},fo-auto`
  return query ? `${poster}?${query}&${tr}` : `${poster}?${tr}`
}
