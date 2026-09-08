import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateText, GeminiError } from '@/lib/ai/gemini'
import { thumbUrl } from '@/lib/media-url'

/**
 * POST /api/stores/[storeId]/ai/alt
 * { imageUrl, title?, context? } -> { text, sawImage }
 *
 * Writes the alt text for one product image.
 *
 * The model is shown the actual photo where it can be fetched, because alt
 * text has to describe what is in the picture, and the product title cannot
 * tell you whether the shot is a single donut on white or a stacked box of
 * six. Where the image cannot be fetched it falls back to writing from the
 * title alone, and says so, so the merchant knows to check it.
 */

const SCHEMA = {
  type: 'object',
  properties: { text: { type: 'string' } },
  required: ['text'],
}

const SYSTEM = `You write alt text for product photographs on a shop's website.

Alt text is read aloud to people who cannot see the image, and read by search
engines. Rules:
- Lead with the product name where you are given one, then describe what is
  visible: "Classic Glazed donut with a glossy sugar coating". Naming the
  product ties the image to the page it sits on, which is most of the value.
- Describe what is actually there, specifically. "Pink glaze and sliced
  strawberries" earns its place; "a tasty treat" does not.
- One sentence. Aim for 8 to 16 words. Never more than 125 characters.
- Never open with "Image of", "Photo of" or "A picture of".
- Skip the studio: "on a white background", "isolated", "product shot" and
  "close-up" describe the photography, not the product, and nobody searches
  for them. Mention the setting only when it is part of the subject, such as
  a donut held in a hand or sat on a plate with coffee.
- Do not repeat the shop name, do not add marketing words like "delicious",
  "premium" or "best", and do not invent a price, a flavour or an ingredient
  you cannot see.
- End with a full stop. Return only the sentence.`

/** Images above this are refetched smaller; base64 inflates by a third. */
const MAX_BYTES = 4 * 1024 * 1024

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await params

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } })
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { ownerId: true, name: true },
    })
    if (!store || store.ownerId !== dbUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const rawUrl = typeof body?.imageUrl === 'string' ? body.imageUrl.trim() : ''
    const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 120) : ''
    const context = typeof body?.context === 'string' ? body.context.trim().slice(0, 200) : ''

    if (!rawUrl && !title) {
      return NextResponse.json({ error: 'Add an image or a title first.' }, { status: 400 })
    }

    // ── Fetch the image, small ──────────────────────────────────────────
    // 512px is plenty for describing a subject and keeps the request quick.
    // A site-relative upload is resolved against this request's own origin.
    let image: { data: string; mimeType: string } | undefined
    if (rawUrl) {
      try {
        const absolute = rawUrl.startsWith('http')
          ? thumbUrl(rawUrl, 512)
          : new URL(rawUrl, req.url).toString()
        const res = await fetch(absolute, { signal: AbortSignal.timeout(15_000) })
        const type = res.headers.get('content-type') ?? ''
        if (res.ok && type.startsWith('image/')) {
          const buf = Buffer.from(await res.arrayBuffer())
          if (buf.byteLength <= MAX_BYTES) {
            image = { data: buf.toString('base64'), mimeType: type.split(';')[0] }
          }
        }
      } catch {
        // Falls through to writing from the title. An unreachable image is
        // not a reason to refuse the merchant any help at all.
      }
    }

    const prompt = [
      image
        ? 'Write the alt text for the product photograph above.'
        : 'Write plausible alt text for a product photograph. You cannot see the image, so describe only what the title makes certain.',
      title ? `The product is called: "${title}".` : null,
      context ? `Context: ${context}` : null,
      `The shop is called ${store.name}, for your context only. Do not name it in the alt text.`,
    ]
      .filter(v => v !== null)
      .join('\n')

    const { text, keyIndex } = await generateText(prompt, {
      system: SYSTEM,
      schema: SCHEMA,
      // Low: this is a description of a fact, not a piece of copywriting.
      temperature: 0.4,
      image,
    })

    let parsed: { text?: unknown }
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('[ai:alt] unparseable response', text.slice(0, 200))
      return NextResponse.json({ error: 'The assistant returned an unexpected answer.' }, { status: 502 })
    }

    console.log(`[ai:alt] store=${storeId} sawImage=${Boolean(image)} key=${keyIndex}`)

    const out = typeof parsed.text === 'string'
      ? parsed.text.trim().replace(/^["“”']+|["“”']+$/g, '').trim().slice(0, 160)
      : ''

    if (!out) return NextResponse.json({ error: 'Nothing came back. Try again.' }, { status: 502 })

    return NextResponse.json({ text: out, sawImage: Boolean(image) })
  } catch (err) {
    if (err instanceof GeminiError) {
      console.error('[ai:alt]', err.message)
      return NextResponse.json({ error: 'The assistant is busy. Try again in a moment.' }, { status: 502 })
    }
    console.error('[ai:alt]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
