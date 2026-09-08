import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateText, GeminiError } from '@/lib/ai/gemini'
import { isPolicyKind, POLICY_BY_KIND, policyStarter, type PolicyKind } from '@/lib/policies'
import { formatPrice } from '@/lib/currency'

/**
 * POST /api/stores/[storeId]/policies/draft   { kind } -> { text }
 *
 * A first draft of one policy, written from what the shop actually knows about
 * itself: its name, where it trades, its currency, its shipping rates, the
 * address a customer can write to. It is a draft. Anything the shop has not
 * told us is left as a bracketed blank for the merchant to fill, because a
 * refund window or a data-retention period is a promise to real customers and
 * the model must not invent one.
 */

const SCHEMA = {
  type: 'object',
  properties: { text: { type: 'string' } },
  required: ['text'],
}

const SYSTEM = `You write policy pages for small independent online shops.

Rules:
- Return ONLY the policy text. No preamble, no title line, no markdown, no bullet characters.
- Plain text. Each section is a short heading on its own line, a blank line, then one to three short paragraphs. A blank line between sections.
- Use only the facts you are given about the shop. Where a real policy needs a fact you were not given (a number of days, a retention period, a registered address, a governing law) write it as a bracketed blank like [number] days or [your registered address], so the shop owner sees exactly what to fill in. Never make one up.
- Plain, direct English a customer can read. No legalese for its own sake. Second person for the customer, first person plural for the shop.
- No claims about certifications, insurance, regulators or guarantees unless given.
- Between 250 and 550 words.`

const BRIEFS: Record<PolicyKind, string> = {
  refund:   'A refund and returns policy. Cover: the returns window, the condition items must be in, what cannot be returned, how to start a return, who pays return postage, how long a refund takes and where it goes, and what happens with faulty or wrong items.',
  privacy:  'A privacy policy for the shop\'s website. Cover: what is collected and when, what each thing is used for, who it is shared with (payment provider, delivery company, email tool), cookies, how long records are kept, the customer\'s rights over their data, and who to contact.',
  terms:    'Terms of service for buying from the shop. Cover: who the shop is, when an order becomes binding and when it may be declined, prices, tax and payment methods, delivery, cancellations and returns (pointing to the refund policy), the limits of liability, and governing law.',
  shipping: 'A shipping policy. Cover: where the shop ships, processing time as distinct from transit time, each delivery option with its cost and rough duration, tracking, delays, and what happens on a wrong address or failed delivery.',
  contact:  'A contact information page. Cover: the business name, the email address and roughly how quickly it is answered, a phone number and hours if any, and the business address. Short: this one is under 150 words.',
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await params
    const body = await req.json().catch(() => null)
    if (!isPolicyKind(body?.kind)) return NextResponse.json({ error: 'Unknown policy' }, { status: 400 })
    // The guard above proves it, but body is untyped JSON and TypeScript will
    // not carry a narrowing through a property of `any`.
    const kind: PolicyKind = body.kind

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true, email: true } })
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        ownerId: true, name: true, country: true, currency: true, subdomain: true, customDomain: true,
        shippingRates: { select: { name: true, price: true, minOrder: true, estimatedDays: true } },
        payment: { select: { stripeEnabled: true, codEnabled: true } },
      },
    })
    if (!store || store.ownerId !== dbUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payments: string[] = []
    if (store.payment?.stripeEnabled) payments.push('card payments through Stripe')
    if (store.payment?.codEnabled) payments.push('cash on delivery')

    const rates = store.shippingRates.map(r =>
      `${r.name}: ${r.price === 0 ? 'free' : formatPrice(r.price, store.currency)}` +
      (r.minOrder > 0 ? ` on orders over ${formatPrice(r.minOrder, store.currency)}` : '') +
      (r.estimatedDays ? `, about ${r.estimatedDays}` : ''),
    )

    const facts = [
      `Shop name: ${store.name}`,
      `Website: ${store.customDomain ?? `${store.subdomain} on ShopFlow`}`,
      store.country ? `Trades from: ${store.country}` : null,
      `Currency: ${store.currency}`,
      payments.length ? `Payment methods: ${payments.join(' and ')}` : 'Payment methods: [not yet set up]',
      rates.length ? `Shipping options:\n${rates.map(r => `- ${r}`).join('\n')}` : 'Shipping options: [none set up yet]',
      `Contact email: ${dbUser.email}`,
    ].filter(Boolean).join('\n')

    const prompt = [
      facts,
      '',
      `Write: ${BRIEFS[kind]}`,
      '',
      'Use these section headings, in this order, adapting only if one genuinely does not apply:',
      policyStarter(kind).split('\n').filter((l, i, a) => l.trim() && (i === 0 || a[i - 1].trim() === '')).join(', '),
    ].join('\n')

    const { text } = await generateText(prompt, { system: SYSTEM, schema: SCHEMA, temperature: 0.5 })

    let parsed: { text?: unknown }
    try { parsed = JSON.parse(text) } catch {
      return NextResponse.json({ error: 'The assistant returned an unexpected answer.' }, { status: 502 })
    }
    const out = typeof parsed.text === 'string' ? parsed.text.trim() : ''
    if (!out) return NextResponse.json({ error: 'Nothing came back. Try again.' }, { status: 502 })

    console.log(`[ai:policy] store=${storeId} kind=${kind} title=${POLICY_BY_KIND[kind].title}`)
    return NextResponse.json({ text: out })
  } catch (err) {
    if (err instanceof GeminiError) {
      console.error('[ai:policy]', err.message)
      return NextResponse.json({ error: 'The assistant is busy. Try again in a moment.' }, { status: 502 })
    }
    console.error('[ai:policy]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
