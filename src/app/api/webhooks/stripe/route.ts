import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')

    if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    })

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err) {
      console.error('[webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.orderId

      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'PAID' },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook:stripe]', err)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}