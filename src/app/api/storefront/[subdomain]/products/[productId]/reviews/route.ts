import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guard } from '@/lib/rate-limit'
import { readReviewToken } from '@/lib/review-token'
import { sendNewReviewAlert } from '@/lib/email'

/**
 * POST /api/storefront/[subdomain]/products/[productId]/reviews
 * { authorName, authorEmail?, rating, title?, body? } -> { ok, status }
 *
 * A shopper rating a product. Public, so it is rate limited and everything
 * arrives PENDING: an open form on the internet collects spam, and a rating
 * cannot be un-published from a crawler that has already read it.
 *
 * The email is never rendered. It is used to check whether this person has
 * actually bought the thing, which is the difference between a review worth
 * showing and a stranger's opinion.
 */

const MAX_BODY = 2000

export async function POST(
  req: Request,
  { params }: { params: Promise<{ subdomain: string; productId: string }> },
) {
  // Generous enough for a person who mistypes their name, tight enough that
  // a script cannot fill the table.
  const limited = guard(req, 'storefront-review', { windowMs: 60_000 * 60, max: 5 })
  if (limited) return limited

  try {
    const { subdomain, productId } = await params

    const store = await prisma.store.findUnique({
      where: { subdomain },
      select: { id: true, name: true, owner: { select: { email: true } } },
    })
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const product = await prisma.product.findFirst({
      where: { storeId: store.id, OR: [{ slug: productId }, { id: productId }] },
      select: { id: true, title: true },
    })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const body = await req.json().catch(() => null)

    const rating = Number(body?.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Choose a rating from 1 to 5 stars.' }, { status: 400 })
    }

    const authorName = typeof body?.authorName === 'string' ? body.authorName.trim().slice(0, 60) : ''
    if (!authorName) {
      return NextResponse.json({ error: 'Please add your name.' }, { status: 400 })
    }

    const authorEmail = typeof body?.authorEmail === 'string'
      ? body.authorEmail.trim().toLowerCase().slice(0, 160) || null
      : null
    const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 120) || null : null
    const text = typeof body?.body === 'string' ? body.body.trim().slice(0, MAX_BODY) || null : null

    // One review per person per product, so a single shopper cannot move the
    // average on their own.
    if (authorEmail) {
      const existing = await prisma.productReview.findFirst({
        where: { productId: product.id, authorEmail },
        select: { id: true },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'You have already reviewed this product.' },
          { status: 409 },
        )
      }
    }

    // Verified means this person really bought this thing, proved one of
    // two ways and never taken on the client's word.
    //
    // A token from a review request email is the stronger of the two: it is
    // signed by us, names one order and one product, and is still checked
    // against the database in case the order has since been refunded or the
    // product moved shops. A plain email address is the weaker fallback for
    // somebody who came back to the page on their own.
    let verified = false
    const claim = readReviewToken(new URL(req.url).searchParams.get('token'))
    if (claim && claim.productId === product.id) {
      const order = await prisma.order.findFirst({
        where: {
          id: claim.orderId,
          storeId: store.id,
          status: 'PAID',
          items: { some: { productId: product.id } },
        },
        select: { id: true },
      })
      verified = Boolean(order)
    }
    if (!verified && authorEmail) {
      const order = await prisma.order.findFirst({
        where: {
          storeId: store.id,
          customerEmail: authorEmail,
          items: { some: { productId: product.id } },
        },
        select: { id: true },
      })
      verified = Boolean(order)
    }

    await prisma.productReview.create({
      data: {
        productId: product.id,
        storeId: store.id,
        authorName,
        authorEmail,
        rating,
        title,
        body: text,
        verified,
      },
    })

    // Nothing here is visible until the shop publishes it, so the shop has
    // to be told it is waiting. Best effort: the review is already saved,
    // and a mail server having a bad day must not read as a failed review.
    if (store.owner?.email) {
      sendNewReviewAlert({
        to: store.owner.email,
        storeName: store.name,
        storeId: store.id,
        productTitle: product.title,
        authorName,
        rating,
        title,
        body: text,
        verified,
      }).catch(err => console.error('[review:alert]', err))
    }

    return NextResponse.json({ ok: true, status: 'PENDING' })
  } catch (err) {
    console.error('[storefront:review]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
