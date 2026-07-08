import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import type { PlanId } from '@/lib/plans'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.error('[webhook] Invalid signature', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      // ── Customer storefront orders (Stripe Checkout via Connect) ──
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // Subscription checkouts are handled by `customer.subscription.created`
        if (session.mode === 'subscription') break
        const orderId = session.metadata?.orderId
        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'PAID' },
          })
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent
        const orderId = intent.metadata?.orderId
        if (orderId) {
          // Restore inventory and cancel
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
          })
          if (order && order.status === 'PENDING') {
            await prisma.$transaction(async (tx) => {
              await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } })
              for (const item of order.items) {
                await tx.product.update({
                  where: { id: item.productId },
                  data: { inventory: { increment: item.quantity } },
                })
              }
            })
          }
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const orderId = charge.metadata?.orderId ?? (charge.payment_intent ? null : null)
        if (orderId) {
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
          })
          if (order && order.status !== 'REFUNDED') {
            await prisma.$transaction(async (tx) => {
              await tx.order.update({ where: { id: orderId }, data: { status: 'REFUNDED' } })
              for (const item of order.items) {
                await tx.product.update({
                  where: { id: item.productId },
                  data: { inventory: { increment: item.quantity } },
                })
              }
            })
          }
        }
        break
      }

      // ── Stripe Connect onboarding ──
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        const ready =
          account.details_submitted &&
          account.charges_enabled &&
          account.payouts_enabled
        await prisma.storePayment.updateMany({
          where: { stripeAccountId: account.id },
          data: { stripeEnabled: !!ready },
        })
        break
      }

      // ── ShopFlow platform subscriptions ──
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const storeId = (sub.metadata?.storeId as string | undefined) ?? null
        const planId = (sub.metadata?.planId as PlanId | undefined) ?? null

        const store = storeId
          ? await prisma.store.findUnique({ where: { id: storeId } })
          : await prisma.store.findFirst({ where: { stripeCustomerId: sub.customer as string } })

        if (!store) break

        const status = sub.status
        const isCanceled = status === 'canceled' || event.type === 'customer.subscription.deleted'

        // periodEnd: Stripe v22 places these on items in some objects, but root has it on Subscription
        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
        const trialEnd = sub.trial_end

        await prisma.store.update({
          where: { id: store.id },
          data: {
            plan: isCanceled ? 'FREE' : (planId ?? store.plan),
            stripeSubscriptionId: isCanceled ? null : sub.id,
            subscriptionStatus: status,
            cancelAtPeriodEnd: !!sub.cancel_at_period_end,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
            trialEndsAt: trialEnd ? new Date(trialEnd * 1000) : null,
          },
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as unknown as { subscription?: string }).subscription
        if (subscriptionId) {
          await prisma.store.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: { subscriptionStatus: 'past_due' },
          })
        }
        break
      }

      default:
        // Unhandled events are fine — Stripe expects 2xx
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook:stripe]', event?.type, err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }
}
