// Lightweight XSS sanitizers for owner-supplied custom CSS/HTML.
// These run server-side on save AND client-side on render (defense in depth).

const SCRIPT_TAG = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
const STYLE_CLOSE = /<\/style\b[^>]*>/gi
const ON_ATTR = /\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi
const JAVASCRIPT_URL = /javascript:/gi
const DATA_HTML_URL = /data:\s*text\/html/gi
const IFRAME_TAG = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
const OBJECT_TAG = /<(object|embed|applet)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi
const META_REFRESH = /<meta\s+http-equiv\s*=\s*["']?refresh/gi
const CSS_EXPRESSION = /expression\s*\(/gi
const CSS_IMPORT_HTTP = /@import\s+url\s*\(\s*["']?\s*http:/gi

export function sanitizeCustomCss(input: string | null | undefined): string {
  if (!input) return ''
  return String(input)
    // CSS sits inside <style> — neutralize attempts to break out of it
    .replace(STYLE_CLOSE, '')
    .replace(CSS_EXPRESSION, 'x(')
    .replace(JAVASCRIPT_URL, '')
    .replace(CSS_IMPORT_HTTP, '@import url("https:') // upgrade-insecure
    .slice(0, 50_000)
}

export function sanitizeCustomHead(input: string | null | undefined): string {
  if (!input) return ''
  return String(input)
    .replace(SCRIPT_TAG, '')
    .replace(IFRAME_TAG, '')
    .replace(OBJECT_TAG, '')
    .replace(META_REFRESH, '<meta data-blocked')
    .replace(ON_ATTR, '')
    .replace(JAVASCRIPT_URL, '')
    .replace(DATA_HTML_URL, '')
    .slice(0, 20_000)
}

/**
 * Rich text written by a merchant in the visual editor.
 *
 * Distinct from sanitizeCustomHead, which guards a paid "custom code" feature
 * where the owner is deliberately writing markup. This runs on ordinary body
 * copy, so it works the other way round: an allow-list of the tags a text
 * toolbar can produce, and everything else is dropped.
 *
 * A deny-list would be the wrong shape here. New dangerous markup gets invented;
 * <b> does not change.
 */
const RICH_TEXT_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's',
  'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
])

export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return ''

  return String(input)
    .replace(SCRIPT_TAG, '')
    .replace(IFRAME_TAG, '')
    .replace(OBJECT_TAG, '')
    .replace(META_REFRESH, '')
    // Every event handler, wherever it landed.
    .replace(ON_ATTR, '')
    .replace(JAVASCRIPT_URL, '')
    .replace(DATA_HTML_URL, '')
    // Any tag outside the list loses its angle brackets but keeps its text, so
    // stripping a wrapper never silently deletes the sentence inside it.
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (tag, name: string) => {
      const lower = name.toLowerCase()
      if (!RICH_TEXT_TAGS.has(lower)) return ''
      // Links keep only href, and only to somewhere safe to send a shopper.
      if (lower === 'a') {
        const href = /\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag)
        const url = (href?.[2] ?? href?.[3] ?? href?.[4] ?? '').trim()
        const ok = /^(https?:\/\/|\/|mailto:|tel:)/i.test(url)
        if (tag.startsWith('</')) return '</a>'
        return ok ? `<a href="${url.replace(/"/g, '&quot;')}" rel="noopener nofollow">` : '<a>'
      }
      // Everything else keeps the tag and loses every attribute, which is where
      // style="" and onerror="" would otherwise ride in.
      return tag.startsWith('</') ? `</${lower}>` : `<${lower}>`
    })
}
