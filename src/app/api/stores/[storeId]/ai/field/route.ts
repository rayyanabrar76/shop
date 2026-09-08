import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateText, GeminiError } from '@/lib/ai/gemini'

/**
 * POST /api/stores/[storeId]/ai/field
 * { kind, label, current? } -> { text }
 *
 * Writes one short piece of storefront copy — a hero heading, a button label,
 * a banner line. Separate from /ai/copy because the answer is a bare string of
 * a controlled length, not a listing, and because it needs the shop's own
 * products in front of it to say anything specific.
 */

const SCHEMA = {
  type: 'object',
  properties: { text: { type: 'string' } },
  required: ['text'],
}

/** How long the answer should be, per kind of field. */
const KINDS: Record<string, string> = {
  heading: 'A heading of 2 to 6 words. Title case. No full stop, no quotes.',
  subheading: 'One sentence, at most about 15 words. Plain and warm, no hype.',
  button: 'A button label of 1 to 3 words, e.g. "Shop Now" or "See the Range". Title case, no full stop.',
  banner: 'One short line for a bar across the top of the site, at most about 10 words. No emoji.',
  paragraph: 'Two or three short sentences. Plain sentences, no bullet lists, no markdown, no emoji.',
  tagline: 'A short tagline of 3 to 10 words describing the shop. No quotes.',
  keywords: [
    'Between 6 and 10 search keywords for ONE product, comma separated on a single line.',
    'Lowercase. No hash signs, no quotes, no numbering, no repetition of the same word.',
    'Take them from the product title and description given above, not from the rest of the shop.',
    'Cover the different ways a shopper searches: the plain name of the thing (a "throw" is also a "blanket"),',
    'what it is made of, what it is for or where it is used, who it suits or would be given to,',
    'and the style or look if the description names one.',
    'Include at least one phrase of two or three words, since that is how people actually search.',
    'Do not use the shop name, and do not invent a material, a size or a claim the description does not make.',
  ].join(' '),
  // Fragments, not sentences: each one is appended to whatever the seller
  // has already written in the box, so it has to read as a continuation.
  'shot-ideas': [
    'FOUR ways to photograph the item described above, separated by a vertical bar |.',
    'Each is a fragment of 3 to 7 words that continues a sentence beginning "photograph it".',
    'Name a surface, a backdrop, a light or a setting that genuinely suits THIS item and this shop.',
    'Vary them: one plain and studio-like, one in the place the thing is actually used, and two others.',
    'No camera jargon, no brand names, no adjectives about quality, and never repeat the product name.',
    'Output the four fragments and nothing else. No numbering, no quotes.',
  ].join(' '),
  'icon-ideas': [
    'FOUR ideas for a favicon for this shop, separated by a vertical bar |.',
    'Each is a fragment of 3 to 7 words describing ONE bold shape and its colours.',
    'It has to read at 16 pixels, so nothing with scenery, detail, text or more than two colours.',
    'Draw on what this shop actually sells for the subject.',
    'Output the four fragments and nothing else. No numbering, no quotes.',
  ].join(' '),
  'seo-title': 'A page title for Google, at most 60 characters. Lead with what people search for, then the shop name after a dash. No quotes.',
  'seo-description': 'A meta description for Google, between 120 and 155 characters. Say what the shop sells and who it suits, and give a reason to click. One or two sentences.',
}

const SYSTEM = `You write short pieces of copy for an independent shop's own website.

Rules:
- Return ONLY the piece of text asked for. No preamble, no options, no quotes around it, no markdown.
- Be specific to this shop and what it sells. "Quality you can trust" is worthless; name the thing.
- Never invent a price, a discount, a delivery time, a founding date, an award, or a health claim.
- Never invent a place or a person.
- Match the language the shop's product titles are written in.`

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
    const kind = typeof body?.kind === 'string' && KINDS[body.kind] ? body.kind : 'heading'
    const label = typeof body?.label === 'string' ? body.label.trim().slice(0, 80) : 'text'
    const current = typeof body?.current === 'string' ? body.current.trim().slice(0, 300) : ''
    const hint = typeof body?.hint === 'string' ? body.hint.trim().slice(0, 200) : ''
    // The thing being described, when the field is about one item rather than
    // about the shop. Long enough to hold a real product description.
    const context = typeof body?.context === 'string' ? body.context.trim().slice(0, 1500) : ''

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { storeId },
        select: { title: true },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
      prisma.category.findMany({ where: { storeId }, select: { name: true }, take: 20 }),
    ])

    const prompt = [
      `Shop name: ${store.name}`,
      products.length > 0
        ? `What the shop sells:\n${products.map(p => `- ${p.title}`).join('\n')}`
        : 'The shop has not added any products yet.',
      categories.length > 0 ? `Categories: ${categories.map(c => c.name).join(', ')}` : null,
      '',
      context ? `\nThe item this is for:\n${context}` : null,
      '',
      `Write the "${label}" for this shop's storefront.`,
      hint ? `Where it appears: ${hint}` : null,
      KINDS[kind],
      // Tags are added to what is there rather than replacing it, so the
      // ones already on the product are a "do not repeat" list, not a draft
      // to improve on.
      current
        ? kind === 'keywords'
          ? `Already tagged: ${current}. Suggest different keywords, do not repeat any of those.`
          : `It currently says: "${current}". Write a better one, do not repeat it.`
        : null,
    ]
      .filter(v => v !== null)
      .join('\n')

    const { text, keyIndex } = await generateText(prompt, {
      system: SYSTEM,
      schema: SCHEMA,
      // Copy wants a bit of surprise. Keywords do not: the right answer is
      // the obvious word a shopper types, and inventing around it is a loss.
      temperature: kind === 'keywords' ? 0.45 : kind.endsWith('-ideas') ? 0.8 : 0.95,
    })

    let parsed: { text?: unknown }
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('[ai:field] unparseable response', text.slice(0, 200))
      return NextResponse.json({ error: 'The assistant returned an unexpected answer.' }, { status: 502 })
    }

    console.log(`[ai:field] store=${storeId} kind=${kind} key=${keyIndex}`)

    // Models like wrapping a bare string in quotes despite being told not to.
    const out = typeof parsed.text === 'string'
      ? parsed.text.trim().replace(/^["“”']+|["“”']+$/g, '').trim()
      : ''

    if (!out) return NextResponse.json({ error: 'Nothing came back. Try again.' }, { status: 502 })

    return NextResponse.json({ text: out })
  } catch (err) {
    if (err instanceof GeminiError) {
      console.error('[ai:field]', err.message)
      return NextResponse.json({ error: 'The assistant is busy. Try again in a moment.' }, { status: 502 })
    }
    console.error('[ai:field]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
