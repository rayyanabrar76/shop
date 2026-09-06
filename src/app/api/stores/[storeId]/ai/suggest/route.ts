import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateText, GeminiError } from '@/lib/ai/gemini'

/**
 * POST /api/stores/[storeId]/ai/suggest
 *
 * kind "category" -> { title, description, productIds[], imagePrompt, reason }
 * kind "product"  -> { title, description, tags[], imagePrompt, reason }
 *
 * Unlike /ai/copy this takes no prompt from the seller. It reads the shop and
 * proposes the next thing worth adding: a category for products currently
 * filed under nothing, or a product the catalogue is missing.
 *
 * The answer is cached against a fingerprint of the catalogue. Re-reading the
 * whole shop takes seconds, and a form that opens twice in a row should not pay
 * that twice — while the shop is unchanged the stored answer still holds. Pass
 * `force` to ignore the cache, which is what the "suggest something else"
 * button does.
 */

const CATEGORY_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    // Positions in the numbered list of UNCATEGORISED products in the prompt.
    // Ids are cuids and the model reproduces them unreliably.
    productNumbers: { type: 'array', items: { type: 'integer' } },
    imagePrompt: { type: 'string' },
    reason: { type: 'string' },
  },
  required: ['title', 'description', 'productNumbers', 'imagePrompt', 'reason'],
}

const PRODUCT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    imagePrompt: { type: 'string' },
    reason: { type: 'string' },
  },
  required: ['title', 'description', 'tags', 'imagePrompt', 'reason'],
}

const CATEGORY_SYSTEM = `You help shopkeepers tidy their catalogue. You are given a shop's products and the categories it already has, and you propose ONE new category.

Rules:
- Only group products from the UNCATEGORISED list. Products already in a category are shown for context only — never put one in your suggestion.
- Never propose a category whose name means the same as one that already exists. If the existing categories already cover everything sensible, say so in "reason" and return an empty productNumbers with an empty title.
- Title: 1-3 words, the label a shopper would click. No quotes, no ALL CAPS.
- Description: ONE short sentence, at most about 20 words.
- productNumbers: the numbers of the uncategorised products that genuinely belong together. At least 2 unless only one obviously stands alone. A wrong grouping is worse than a smaller one.
- imagePrompt: a short description of a photo for the category tile. Describe an arrangement or assortment that represents the group, not one single item. No text or logos in the image.
- reason: one sentence to the shopkeeper explaining why this grouping, mentioning how many products are currently unfiled.
- Write in the language the shop's product titles use.`

const PRODUCT_SYSTEM = `You help shopkeepers decide what to sell next. You are given a shop's existing products and you propose ONE new product that fits the shop but is missing from it.

Rules:
- It must be a genuine gap. Never propose something the shop already sells under a different name.
- Stay in the shop's line of business. A donut shop gets another donut or a drink that goes with one, not furniture.
- Title: 3-8 words, the product, not a slogan. No quotes, no ALL CAPS.
- Description: 2-3 short paragraphs, plain sentences. No bullet lists, no markdown, no emoji.
- Never invent a price, a discount, a shipping promise, a certification, or a health claim.
- Tags: 5-8 lowercase search terms. Single words or two-word phrases. No hashtags.
- imagePrompt: a short description of a product photo for it. One item, clean background. No text or logos.
- reason: one sentence to the shopkeeper on why this gap is worth filling, referring to what they already sell.
- Write in the language the shop's product titles use.`

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
    const isCategory = body?.kind === 'category'
    const kind = isCategory ? 'category' : 'product'
    const force = Boolean(body?.force)

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { storeId },
        select: { id: true, title: true, category: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.category.findMany({
        where: { storeId },
        select: { name: true, slug: true },
      }),
    ])

    // A cheap summary of the catalogue. Anything that would change the advice —
    // a product added, renamed, refiled, or a category created — changes this.
    const fingerprint = [
      products.length,
      categories.length,
      products.map(p => `${p.id}:${p.category ?? ''}`).join(','),
      categories.map(c => c.slug).join(','),
    ].join('|')

    if (!force) {
      const cached = await prisma.aiSuggestion.findUnique({
        where: { storeId_kind: { storeId, kind } },
        select: { fingerprint: true, payload: true },
      })
      if (cached && cached.fingerprint === fingerprint) {
        return NextResponse.json({ ...(cached.payload as object), cached: true })
      }
    }

    /** Stores the answer so the next open is instant. */
    async function remember(payload: Record<string, unknown>) {
      await prisma.aiSuggestion.upsert({
        where: { storeId_kind: { storeId, kind } },
        create: { storeId, kind, fingerprint, payload: payload as any },
        update: { fingerprint, payload: payload as any },
      }).catch(err => console.error('[ai:suggest] cache write failed', err))
      return payload
    }

    if (products.length === 0) {
      return NextResponse.json({
        empty: true,
        reason: 'Add a product or two first — there is nothing to go on yet.',
      })
    }

    // Membership is a plain string that may hold the slug or the name.
    const slugs = new Set(categories.flatMap(c => [c.slug, c.name]))
    const uncategorised = products.filter(p => !p.category || !slugs.has(p.category))
    const filed = products.filter(p => p.category && slugs.has(p.category))

    if (isCategory && uncategorised.length === 0) {
      return NextResponse.json(await remember({
        empty: true,
        reason: 'Every product is already in a category — nothing left to group.',
      }))
    }

    const prompt = isCategory
      ? [
          `Shop name: ${store.name}`,
          '',
          categories.length > 0
            ? `Categories that already exist (do not duplicate these):\n${categories.map(c => `- ${c.name}`).join('\n')}`
            : 'This shop has no categories yet.',
          '',
          `UNCATEGORISED products — group only from this list:\n${uncategorised.map((p, i) => `${i + 1}. ${p.title}`).join('\n')}`,
          '',
          filed.length > 0
            ? `Already filed elsewhere, for context only — never include these:\n${filed.map(p => `- ${p.title}`).join('\n')}`
            : null,
          '',
          'Propose one new category.',
        ].filter(v => v !== null).join('\n')
      : [
          `Shop name: ${store.name}`,
          '',
          `Everything this shop currently sells:\n${products.map(p => `- ${p.title}`).join('\n')}`,
          '',
          'Propose one product this shop is missing.',
        ].join('\n')

    const { text, keyIndex } = await generateText(prompt, {
      system: isCategory ? CATEGORY_SYSTEM : PRODUCT_SYSTEM,
      schema: isCategory ? CATEGORY_SCHEMA : PRODUCT_SCHEMA,
      temperature: 0.7,
    })

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('[ai:suggest] unparseable response', text.slice(0, 200))
      return NextResponse.json({ error: 'The assistant returned an unexpected answer. Try again.' }, { status: 502 })
    }

    console.log(`[ai:suggest] store=${storeId} kind=${isCategory ? 'category' : 'product'} key=${keyIndex}`)

    const title = typeof parsed.title === 'string' ? parsed.title.trim() : ''
    const description = typeof parsed.description === 'string' ? parsed.description.trim() : ''
    const imagePrompt = typeof parsed.imagePrompt === 'string' ? parsed.imagePrompt.trim() : ''
    const reason = typeof parsed.reason === 'string' ? parsed.reason.trim() : ''

    if (isCategory) {
      // Positions back to ids, dropping anything out of range rather than
      // trusting the model not to invent a number.
      const productIds = Array.isArray(parsed.productNumbers)
        ? [...new Set(parsed.productNumbers as unknown[])]
            .map(n => uncategorised[Number(n) - 1]?.id)
            .filter((id): id is string => Boolean(id))
        : []

      // The model was told to return an empty title when nothing is worth
      // adding; treat that as "no suggestion" rather than a blank form.
      if (!title) {
        return NextResponse.json(await remember({ empty: true, reason: reason || 'Nothing new worth grouping right now.' }))
      }
      return NextResponse.json(await remember({ title, description, productIds, imagePrompt, reason }))
    }

    return NextResponse.json(await remember({
      title,
      description,
      imagePrompt,
      reason,
      tags: Array.isArray(parsed.tags)
        ? parsed.tags
            .filter((t): t is string => typeof t === 'string')
            .map(t => t.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 8)
        : [],
    }))
  } catch (err) {
    if (err instanceof GeminiError) {
      console.error('[ai:suggest]', err.message)
      return NextResponse.json(
        { error: 'The assistant is busy right now. Try again in a moment.' },
        { status: 502 },
      )
    }
    console.error('[ai:suggest]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
