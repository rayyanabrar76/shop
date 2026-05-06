import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params

    const payment = await prisma.storePayment.findUnique({ where: { storeId } })

    if (!payment?.stripeAccountId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stores/${storeId}/settings/payments?stripe=error`
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    })

    const account = await stripe.accounts.retrieve(payment.stripeAccountId)
    const isEnabled = account.charges_enabled && account.details_submitted

    await prisma.storePayment.update({
      where: { storeId },
      data: { stripeEnabled: isEnabled },
    })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stores/${storeId}/settings/payments?stripe=${isEnabled ? 'success' : 'pending'}`
    )
  } catch (err) {
    console.error('[stripe-connect:callback]', err)
    const { storeId } = await params
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stores/${storeId}/settings/payments?stripe=error`
    )
  }
}