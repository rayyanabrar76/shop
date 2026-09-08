/**
 * Turns a picked file's name into one worth having in a URL.
 *
 * "ChatGPT Image Sep 6, 2026, 12_45_59 PM.png" becomes
 * "chatgpt-image-sep-6-2026-12-45-59-pm-a1b2c3.png".
 *
 * The name survives into the public image URL, and Google reads it as a
 * signal about what the picture shows, so spaces, commas and capitals are
 * worth losing. The random suffix is not decoration: two people uploading
 * "donut.jpg" must not collide in the same folder.
 *
 * Client-safe: no Node APIs, so the media library can use it before handing
 * a file to ImageKit.
 */
export function slugifyFileName(original: string, fallbackExt?: string): string {
  const name = original || 'image'
  const dot = name.lastIndexOf('.')
  const rawExt = dot > 0 ? name.slice(dot + 1) : ''
  const ext = (rawExt || fallbackExt || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5)

  const stub =
    (dot > 0 ? name.slice(0, dot) : name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'image'

  return `${stub}-${randomSuffix()}.${ext}`
}

/** Six hex characters. Web Crypto where it exists, Math.random otherwise. */
function randomSuffix(): string {
  const g = globalThis.crypto
  if (g?.getRandomValues) {
    const bytes = new Uint8Array(3)
    g.getRandomValues(bytes)
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  }
  return Math.random().toString(16).slice(2, 8).padEnd(6, '0')
}
