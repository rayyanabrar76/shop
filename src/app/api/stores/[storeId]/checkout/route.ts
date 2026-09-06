import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { sendOrderConfirmation, sendNewOrderAlert } from '@/lib/email'
import { getActivePlan } from '@/lib/plans'
import { guard } from '@/lib/rate-limit'
import { toStripeAmount } from '@/lib/currency'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const limited = guard(req, 'checkout', { windowMs: 60_000, max: 10 })
    if (limited) return limited

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

    // Prices come from the database, never from the request. The client used
    // to send a price per line and the total was built from it, so anyone
    // posting here directly could buy anything for whatever they liked — and
    // the stored order would look entirely legitimate afterwards.
    const requested = (items as { productId?: unknown; quantity?: unknown }[]).map(i => ({
      productId: typeof i.productId === 'string' ? i.productId : '',
      quantity: Math.max(1, Math.min(999, Math.floor(Number(i.quantity) || 0))),
    }))
    if (requested.some(i => !i.productId || i.quantity < 1)) {
      return NextResponse.json({ error: 'Invalid cart' }, { status: 400 })
    }

    // Scoped to this store: an id from another shop must not be purchasable
    // here, at that shop's price.
    const catalogue = await prisma.product.findMany({
      where: { id: { in: requested.map(i => i.productId) }, storeId, status: 'active' },
      select: { id: true, title: true, price: true, imageUrl: true },
    })

    if (catalogue.length !== new Set(requested.map(i => i.productId)).size) {
      return NextResponse.json(
        { error: 'One of those products is no longer available.' },
        { status: 400 },
      )
    }

    // The priced cart. Everything downstream uses this, not the request body.
    const priced = requested.map(i => {
      const product = catalogue.find(p => p.id === i.productId)!
      return { productId: product.id, quantity: i.quantity, price: product.price, product }
    })
    const planDef = getActivePlan(store)

    if (paymentMethod === 'cod') {
      if (!payment?.codEnabled) {
        return NextResponse.json({ error: 'COD not available' }, { status: 400 })
      }
      if (!planDef.limits.codAllowed) {
        return NextResponse.json({ error: 'This store is on a plan that does not allow COD.' }, { status: 400 })
      }
    }
    if (paymentMethod === 'stripe' && (!payment?.stripeEnabled || !payment?.stripeAccountId)) {
      return NextResponse.json({ error: 'Card payment not available for this store' }, { status: 400 })
    }

    const subtotal = priced.reduce((sum, item) => sum + item.price * item.quantity, 0)

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

    // Atomic: verify inventory + decrement + create order in one transaction.
    // Uses an updateMany with a `gte` guard so two concurrent buyers can't oversell.
    let order
    try {
      order = await prisma.$transaction(async (tx) => {
        for (const item of priced) {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, inventory: { gte: item.quantity } },
            data: { inventory: { decrement: item.quantity } },
          })
          if (updated.count === 0) {
            const p = await tx.product.findUnique({
              where: { id: item.productId },
              select: { title: true, inventory: true },
            })
            throw new Error(`Insufficient stock for ${p?.title ?? 'product'} (${p?.inventory ?? 0} left).`)
          }
        }
        return tx.order.create({
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
              create: priced.map(item => ({
                productId: item.productId, quantity: item.quantity, price: item.price,
              })),
            },
          },
          include: { items: { include: { product: true } } },
        })
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Checkout failed'
      return NextResponse.json({ error: msg }, { status: 409 })
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
        currency: store.currency,
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
          currency: store.currency,
        }).catch(() => {})
      }
    }

    // ── Stripe Connect ──────────────────────────────────────────────────────
    if (paymentMethod === 'stripe' && payment?.stripeAccountId) {
      const stripe = getStripe()

      // Charge in the store's own currency rather than assuming USD.
      const storeCurrency = store.currency

      const lineItems: any[] = priced.map(item => {
        const product = item.product
        return {
          price_data: {
            currency: storeCurrency.toLowerCase(),
            product_data: {
              name: product.title,
              ...(product.imageUrl && { images: [product.imageUrl] }),
            },
            unit_amount: toStripeAmount(item.price, storeCurrency),
          },
          quantity: item.quantity,
        }
      })

      if (shippingAmount > 0) {
        lineItems.push({
          price_data: {
            currency: storeCurrency.toLowerCase(),
            product_data: { name: shippingMethod ?? 'Shipping' },
            unit_amount: toStripeAmount(shippingAmount, storeCurrency),
          },
          quantity: 1,
        })
      }

      // Platform fee = take-rate determined by store plan
      const platformFee = Math.max(0, Math.round(total * (planDef.takeRatePercent / 100)))

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        customer_email: customerEmail,
        success_url: `${req.headers.get('origin')}/store/${store.subdomain}/success?orderId=${order.id}&method=stripe`,
        cancel_url: `${req.headers.get('origin')}/store/${store.subdomain}/checkout`,
        metadata: { orderId: order.id, storeId: store.id, planId: store.plan },
        ...(discountAmount > 0 && {
          discounts: [{ coupon: (await stripe.coupons.create({ amount_off: toStripeAmount(discountAmount, storeCurrency), currency: storeCurrency.toLowerCase(), duration: 'once', name: appliedDiscountCode ?? 'Discount' })).id }],
        }),
        payment_intent_data: {
          transfer_data: { destination: payment.stripeAccountId },
          application_fee_amount: toStripeAmount(platformFee, storeCurrency),
          metadata: { orderId: order.id, storeId: store.id },
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
