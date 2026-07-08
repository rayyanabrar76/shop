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
