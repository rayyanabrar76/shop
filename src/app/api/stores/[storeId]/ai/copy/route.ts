import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateText, GeminiError } from '@/lib/ai/gemini'

/**
 * POST /api/stores/[storeId]/ai/copy
 *
 * kind "product"  { prompt, tone?, existingTitle? } -> { title, description, tags[] }
 * kind "category" { prompt, tone? }                 -> { title, description, productIds[] }
 *
 * One endpoint for both because the shape of the work is identical — a seller
 * describes something in their own words and gets listing copy back. Structured
 * output is requested via responseSchema so the reply is parseable rather than
 * prose we have to scrape.
 */

const PRODUCT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'description', 'tags'],
}

const CATEGORY_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    // Indices into the numbered product list in the prompt. Ids are cuids and
    // the model reproduces them unreliably; positions it gets right.
    productNumbers: { type: 'array', items: { type: 'integer' } },
  },
  required: ['title', 'description', 'productNumbers'],
}

const TONES: Record<string, string> = {
  friendly: 'warm and conversational, like a small shop owner talking to a regular',
  premium: 'restrained and premium, short sentences, no hype words',
  playful: 'playful and energetic, but never gimmicky',
  technical: 'factual and specification-led, for a buyer who wants details',
}

const PRODUCT_SYSTEM = `You write product listings for independent online shops.

Rules:
- Title: 3-8 words. The product, not a slogan. No quotes, no brand you invented, no ALL CAPS.
- Description: 2-3 short paragraphs, plain sentences. Say what it is, what it is made of or how it works, and who it suits. No bullet lists, no markdown, no emoji.
- Never invent a price, a discount, a shipping promise, a material certification, or a health or medical claim.
- Tags: 5-8 lowercase search terms a shopper would actually type. Single words or two-word phrases. No hashtags.
- Write in the language the seller used.`

const CATEGORY_SYSTEM = `You name and describe categories for independent online shops. A category groups related products so shoppers can browse them together.

Rules:
- Title: 1-3 words. What a shopper would expect on a nav link or a browse tile, e.g. "Chocolate", "Gift Boxes", "Summer Drinks". Not a sentence, no quotes, no ALL CAPS.
- Description: ONE short sentence, at most about 20 words, saying what is in this group.
- Never invent a price, a discount, or a shipping promise.
- productNumbers: the numbers of the listed products that genuinely belong in this category. Judge only from the titles you are given. Return an empty array if none clearly fit — a wrong guess is worse than no guess, and never include a product just to fill the list.
- Write in the language the seller used.`

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
    const seed = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
    if (!seed) {
      return NextResponse.json({ error: 'Tell the assistant what you want.' }, { status: 400 })
    }
    if (seed.length > 1000) {
      return NextResponse.json({ error: 'That description is too long (max 1000 characters).' }, { status: 400 })
    }

    const tone = TONES[body?.tone] ?? TONES.friendly
    const isCategory = body?.kind === 'category'

    // Categories are picked from real products, so the model needs to see them.
    const catalogue = isCategory
      ? await prisma.product.findMany({
          where: { storeId },
          select: { id: true, title: true },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
      : []

    const prompt = [
      `Shop name: ${store.name}`,
      isCategory
        ? `Category, in the seller's words: ${seed}`
        : `Product, in the seller's words: ${seed}`,
      !isCategory && typeof body?.existingTitle === 'string' && body.existingTitle.trim()
        ? `Current working title: ${body.existingTitle.trim()}`
        : null,
      `Tone: ${tone}`,
      isCategory && catalogue.length > 0
        ? `\nProducts in this shop:\n${catalogue.map((p, i) => `${i + 1}. ${p.title}`).join('\n')}`
        : null,
      '',
      isCategory ? 'Name the category, describe it, and choose which products belong.' : 'Write the listing.',
    ]
      .filter(Boolean)
      .join('\n')

    const { text, keyIndex } = await generateText(prompt, {
      system: isCategory ? CATEGORY_SYSTEM : PRODUCT_SYSTEM,
      schema: isCategory ? CATEGORY_SCHEMA : PRODUCT_SCHEMA,
      temperature: isCategory ? 0.6 : 0.9,
    })

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('[ai:copy] unparseable response', text.slice(0, 200))
      return NextResponse.json({ error: 'The assistant returned an unexpected answer. Try again.' }, { status: 502 })
    }

    console.log(`[ai:copy] store=${storeId} kind=${isCategory ? 'category' : 'product'} key=${keyIndex}`)

    const title = typeof parsed.title === 'string' ? parsed.title.trim() : ''
    const description = typeof parsed.description === 'string' ? parsed.description.trim() : ''

    if (isCategory) {
      // Map positions back to ids, dropping anything out of range rather than
      // trusting the model not to invent a number.
      const productIds = Array.isArray(parsed.productNumbers)
        ? [...new Set(parsed.productNumbers as unknown[])]
            .map(n => catalogue[Number(n) - 1]?.id)
            .filter((id): id is string => Boolean(id))
        : []
      return NextResponse.json({ title, description, productIds })
    }

    return NextResponse.json({
      title,
      description,
      tags: Array.isArray(parsed.tags)
        ? parsed.tags
            .filter((t): t is string => typeof t === 'string')
            .map(t => t.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 8)
        : [],
    })
  } catch (err) {
    if (err instanceof GeminiError) {
      console.error('[ai:copy]', err.message)
      return NextResponse.json(
        { error: 'The writing assistant is busy right now. Try again in a moment.' },
        { status: 502 },
      )
    }
    console.error('[ai:copy]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
