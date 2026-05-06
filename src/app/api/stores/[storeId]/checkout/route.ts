import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { sendOrderConfirmation, sendNewOrderAlert } from '@/lib/email'

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? 3)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params
    const body = await req.json()

    const {
      items, paymentMethod, customerName, customerEmail,
      customerPhone, customerAddress, customerCity, customerCountry, notes,
      discountCode: discountCodeInput, shippingRateId,
    } = body

    if (!items?.length) return NextResponse.json({ error: 'No items in cart' }, { status: 400 })

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { payment: true, owner: true },
    })
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const payment = store.payment

    if (paymentMethod === 'cod' && !payment?.codEnabled) {
      return NextResponse.json({ error: 'COD not available' }, { status: 400 })
    }
    if (paymentMethod === 'stripe' && (!payment?.stripeEnabled || !payment?.stripeAccountId)) {
      return NextResponse.json({ error: 'Card payment not available for this store' }, { status: 400 })
    }

    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0
    )

    // Validate discount code
    let discountAmount = 0
    let appliedDiscountCode: string | null = null
    if (discountCodeInput) {
      const discount = await prisma.discountCode.findUnique({
        where: { storeId_code: { storeId, code: discountCodeInput.toUpperCase() } },
      })
      if (discount && discount.active && (!discount.expiresAt || discount.expiresAt > new Date()) &&
          (!discount.maxUses || discount.usedCount < discount.maxUses) &&
          subtotal >= discount.minOrder) {
        discountAmount = discount.type === 'percentage'
          ? Math.round(subtotal * discount.value / 100)
          : Math.min(discount.value, subtotal)
        appliedDiscountCode = discount.code
        await prisma.discountCode.update({ where: { id: discount.id }, data: { usedCount: { increment: 1 } } })
      }
    }

    // Shipping
    let shippingAmount = 0
    let shippingMethod: string | null = null
    if (shippingRateId) {
      const rate = await prisma.shippingRate.findFirst({ where: { id: shippingRateId, storeId } })
      if (rate) {
        shippingAmount = subtotal >= rate.minOrder && rate.minOrder > 0 ? 0 : rate.price
        shippingMethod = rate.name
      }
    }

    // Tax
    let taxAmount = 0
    if (payment?.taxEnabled && payment.taxRate > 0) {
      taxAmount = Math.round((subtotal - discountAmount) * payment.taxRate / 100)
    }

    const total = subtotal - discountAmount + shippingAmount + taxAmount

    const order = await prisma.order.create({
      data: {
        storeId, total, status: 'PENDING', paymentMethod,
        customerName, customerEmail, customerPhone,
        customerAddress, customerCity, customerCountry, notes,
        discountCode: appliedDiscountCode,
        discountAmount,
        shippingAmount,
        shippingMethod,
        taxAmount,
        items: {
          create: items.map((item: { productId: string; quantity: number; price: number }) => ({
            productId: item.productId, quantity: item.quantity, price: item.price,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    })

    // Decrement inventory
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { inventory: { decrement: item.quantity } },
      })
    }

    // Upsert customer
    if (customerEmail) {
      await prisma.customer.upsert({
        where: { storeId_email: { storeId, email: customerEmail } },
        create: { storeId, email: customerEmail, name: customerName },
        update: { name: customerName },
      })
    }

    // Send order confirmation to customer
    if (customerEmail) {
      const emailItems = order.items.map(i => ({
        title: i.product?.title ?? 'Product',
        quantity: i.quantity,
        price: i.price,
      }))
      sendOrderConfirmation({
        to: customerEmail,
        storeName: store.name,
        orderId: order.id,
        items: emailItems,
        subtotal,
        discountAmount,
        shippingAmount,
        taxAmount,
        total,
        customerName: customerName ?? 'Customer',
        address: customerAddress ?? '',
        city: customerCity ?? '',
        country: customerCountry,
        paymentMethod,
      }).catch(() => {})

      // Send new order alert to store owner
      if (store.owner?.email) {
        sendNewOrderAlert({
          to: store.owner.email,
          storeName: store.name,
          orderId: order.id,
          customerName: customerName ?? 'Unknown',
          customerEmail,
          total,
          itemCount: items.length,
        }).catch(() => {})
      }
    }

    // ── Stripe Connect ──────────────────────────────────────────────────────
    if (paymentMethod === 'stripe' && payment?.stripeAccountId) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2026-04-22.dahlia',
      })

      const productIds = items.map((i: any) => i.productId)
      const products = await prisma.product.findMany({ where: { id: { in: productIds } } })

      const lineItems: any[] = items.map((item: any) => {
        const product = products.find(p => p.id === item.productId)
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product?.title ?? 'Product',
              ...(product?.imageUrl && { images: [product.imageUrl] }),
            },
            unit_amount: item.price,
          },
          quantity: item.quantity,
        }
      })

      if (shippingAmount > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: { name: shippingMethod ?? 'Shipping' },
            unit_amount: shippingAmount,
          },
          quantity: 1,
        })
      }

      const platformFee = Math.round(total * (PLATFORM_FEE_PERCENT / 100))

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        customer_email: customerEmail,
        success_url: `${req.headers.get('origin')}/store/${store.subdomain}/success?orderId=${order.id}&method=stripe`,
        cancel_url: `${req.headers.get('origin')}/store/${store.subdomain}/checkout`,
        metadata: { orderId: order.id },
        ...(discountAmount > 0 && {
          discounts: [{ coupon: (await stripe.coupons.create({ amount_off: discountAmount, currency: 'usd', duration: 'once', name: appliedDiscountCode ?? 'Discount' })).id }],
        }),
        payment_intent_data: {
          transfer_data: { destination: payment.stripeAccountId },
          application_fee_amount: platformFee,
        },
      })

      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
      })

      return NextResponse.json({ ok: true, orderId: order.id, stripeUrl: session.url })
    }

    return NextResponse.json({ ok: true, orderId: order.id })

  } catch (err) {
    console.error('[checkout:post]', err)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
