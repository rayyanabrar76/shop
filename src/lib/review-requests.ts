import { prisma } from '@/lib/prisma'
import { sendReviewRequest } from '@/lib/email'
import { makeReviewToken } from '@/lib/review-token'
import { storeUrl } from '@/lib/config'

/**
 * Asks recent buyers what they thought.
 *
 * Finds paid orders old enough that the parcel has arrived, that have not
 * been asked before, and sends one email per order listing what was in it.
 * Every order it touches is stamped, so an order is asked once however often
 * this runs, which is what makes it safe to call from a schedule and from a
 * button on the same day.
 *
 * Deliberately not sent at checkout. A review written before the thing turns
 * up is a review of the shopping, not of the product.
 */

/** Long enough for delivery, short enough that they still remember it. */
export const WAIT_DAYS = 5

/** A cap per run, so a shop with a backlog does not empty its sending quota. */
const MAX_PER_RUN = 50

export interface ReviewRequestResult {
  sent: number
  skipped: number
  failed: number
  /** Why the first failure failed, so a caller can say more than 'failed'. */
  error?: string
}

export async function sendPendingReviewRequests(opts: {
  /** One shop, or every shop when a schedule calls this. */
  storeId?: string
  /** Overrides the wait, so the admin button can ask about today's orders. */
  waitDays?: number
  limit?: number
}): Promise<ReviewRequestResult> {
  const waitDays = opts.waitDays ?? WAIT_DAYS
  const cutoff = new Date(Date.now() - waitDays * 86_400_000)

  const orders = await prisma.order.findMany({
    where: {
      ...(opts.storeId ? { storeId: opts.storeId } : {}),
      // Paid only. Asking about an order that was never paid for, or was
      // refunded, is asking about something that did not happen.
      status: 'PAID',
      reviewRequestedAt: null,
      createdAt: { lte: cutoff },
      customerEmail: { not: null },
    },
    orderBy: { createdAt: 'asc' },
    take: opts.limit ?? MAX_PER_RUN,
    select: {
      id: true,
      customerEmail: true,
      customerName: true,
      store: { select: { id: true, name: true, subdomain: true } },
      items: {
        select: { product: { select: { id: true, title: true, imageUrl: true, slug: true } } },
      },
    },
  })

  const result: ReviewRequestResult = { sent: 0, skipped: 0, failed: 0 }

  for (const order of orders) {
    // The same product twice in one order is still one thing to review.
    const seen = new Set<string>()
    const products = order.items
      .map(i => i.product)
      .filter(p => p && !seen.has(p.id) && seen.add(p.id))

    // Somebody they have already reviewed does not need asking again.
    const already = await prisma.productReview.findMany({
      where: {
        productId: { in: products.map(p => p.id) },
        authorEmail: order.customerEmail!.toLowerCase(),
      },
      select: { productId: true },
    })
    const done = new Set(already.map(r => r.productId))
    const items = products
      .filter(p => !done.has(p.id))
      .map(p => ({
        title: p.title,
        imageUrl: p.imageUrl,
        url: storeUrl(
          order.store.subdomain,
          `/products/${p.slug || p.id}?review=${makeReviewToken(order.id, p.id)}#reviews`,
        ),
      }))

    if (items.length === 0) {
      // Nothing left to ask about, but stamp it so this order stops being
      // considered on every future run.
      await prisma.order.update({ where: { id: order.id }, data: { reviewRequestedAt: new Date() } })
      result.skipped++
      continue
    }

    try {
      await sendReviewRequest({
        to: order.customerEmail!,
        storeName: order.store.name,
        customerName: order.customerName,
        items,
      })
      // Stamped only after the send returns, so a failure is retried on the
      // next run rather than silently dropped.
      await prisma.order.update({ where: { id: order.id }, data: { reviewRequestedAt: new Date() } })
      result.sent++
    } catch (err) {
      console.error('[review-request]', order.id, err)
      result.failed++
      // Kept so the admin can be told what went wrong rather than being
      // shown a count and left to go reading server logs.
      result.error ??= err instanceof Error ? err.message : String(err)
    }
  }

  return result
}
