import 'server-only'

/**
 * Product image generation via Cloudflare Workers AI.
 *
 * flux-2-klein-9b is the current model and takes width/height, which matters
 * here — product tiles are square. It expects multipart/form-data and returns
 * base64 JPEG. flux-1-schnell is kept as a fallback: it is faster and takes
 * JSON, so it also covers the case where the newer model is unavailable.
 */

const CF_BASE = 'https://api.cloudflare.com/client/v4/accounts'
const PRIMARY = '@cf/black-forest-labs/flux-2-klein-9b'
const FALLBACK = '@cf/black-forest-labs/flux-1-schnell'

export class ImageGenError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    /** The account is out of quota — retrying or rewording will not help. */
    readonly quota = false,
    /** The prompt that would have been sent, so it is not simply lost. */
    readonly prompt?: string,
  ) {
    super(message)
    this.name = 'ImageGenError'
  }
}

export interface GeneratedImage {
  /** Raw JPEG bytes. */
  bytes: Buffer
  model: string
}

/**
 * Nudges a plain description toward usable product photography. Sellers write
 * "matte black water bottle on linen"; they expect a catalogue shot, not art.
 */
function toProductPrompt(description: string): string {
  return [
    description.trim(),
    'professional product photography',
    'sharp focus on the product, centred composition',
    'soft even studio lighting, subtle natural shadow',
    'clean uncluttered background, high detail, photorealistic',
    'no text, no watermark, no logos',
  ].join(', ')
}

/**
 * Favicons are read at 16 pixels. Photographic detail turns to mush at that
 * size, so this asks for a flat mark with one subject and heavy contrast.
 */
function toIconPrompt(description: string): string {
  return [
    `simple flat vector icon of ${description.trim()}`,
    'single centred subject, bold simple shapes, thick forms',
    'high contrast, limited colour palette, solid background',
    'app icon style, readable at very small size',
    'no text, no letters, no watermark, no fine detail',
  ].join(', ')
}

export async function generateProductImage(
  description: string,
  { size = 1024, style = 'product' }: { size?: number; style?: 'product' | 'icon' } = {},
): Promise<GeneratedImage> {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_API_TOKEN
  if (!account || !token) {
    throw new ImageGenError('Cloudflare credentials are not configured')
  }

  const prompt = style === 'icon' ? toIconPrompt(description) : toProductPrompt(description)
  let lastError: ImageGenError | null = null

  for (const model of [PRIMARY, FALLBACK]) {
    try {
      const isPrimary = model === PRIMARY
      let body: BodyInit
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` }

      if (isPrimary) {
        // flux-2 requires multipart and accepts dimensions.
        const form = new FormData()
        form.append('prompt', prompt)
        form.append('width', String(size))
        form.append('height', String(size))
        form.append('steps', '20')
        body = form
      } else {
        headers['Content-Type'] = 'application/json'
        body = JSON.stringify({ prompt, steps: 4 })
      }

      const res = await fetch(`${CF_BASE}/${account}/ai/run/${model}`, {
        method: 'POST',
        headers,
        body,
        // Diffusion is slow; cap it rather than hanging the request.
        signal: AbortSignal.timeout(90_000),
      })

      if (!res.ok) {
        const detail = await res.text().catch(() => '')

        // Quota is per account, not per model, so falling through to the
        // fallback would just burn another round trip on the same answer.
        if (res.status === 429 || /allocation|quota|neurons/i.test(detail)) {
          throw new ImageGenError(
            `Workers AI quota reached: ${detail.slice(0, 200)}`,
            res.status,
            true,
            prompt,
          )
        }

        lastError = new ImageGenError(
          `Image generation failed (${res.status}) ${detail.slice(0, 200)}`,
          res.status,
        )
        continue
      }

      const data = await res.json()
      const b64: string | undefined = data?.result?.image
      if (!b64) {
        lastError = new ImageGenError('Image generation returned no image')
        continue
      }

      return { bytes: Buffer.from(b64, 'base64'), model }
    } catch (err) {
      // A quota error is final; anything else is worth trying the next model.
      if (err instanceof ImageGenError && err.quota) throw err
      lastError = new ImageGenError(
        err instanceof Error ? err.message : 'Image generation failed',
      )
    }
  }

  throw lastError ?? new ImageGenError('Image generation failed')
}
