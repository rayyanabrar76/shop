import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { validateSubdomain } from '@/lib/subdomain'
import { isSupportedCurrency } from '@/lib/currency'

// GET /api/stores/[storeId]/settings
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await params
    const store = await prisma.store.findFirst({
      where: { id: storeId, owner: { clerkId } },
      select: { name: true, subdomain: true, currency: true },
    })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ name: store.name, subdomain: store.subdomain, currency: store.currency })
  } catch (err) {
    console.error('[settings:get]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PATCH /api/stores/[storeId]/settings
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await params          // ← await params
    const { name, subdomain, currency } = await req.json()

    // Verify ownership
    const store = await prisma.store.findFirst({
      where: { id: storeId, owner: { clerkId } },
    })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Normalize before validating/comparing — the stored value is always
    // lowercase, so checking the raw input could miss a conflict and let the
    // unique constraint blow up during the update instead.
    const nextSubdomain =
      typeof subdomain === 'string' ? subdomain.trim().toLowerCase() : ''

    if (nextSubdomain && nextSubdomain !== store.subdomain) {
      const invalid = validateSubdomain(nextSubdomain)
      if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

      const conflict = await prisma.store.findFirst({
        where: { subdomain: nextSubdomain, NOT: { id: storeId } },
        select: { id: true },
      })
      if (conflict) {
        return NextResponse.json({ error: 'That subdomain is already taken.' }, { status: 409 })
      }
    }

    // Currency is locked once the store has taken an order. Prices are stored
    // as plain integers with no currency attached, so switching afterwards
    // would silently reinterpret every historical order total rather than
    // convert it — a $10 sale would read as ¥10.
    const nextCurrency =
      typeof currency === 'string' ? currency.trim().toUpperCase() : ''

    if (nextCurrency && nextCurrency !== store.currency) {
      if (!isSupportedCurrency(nextCurrency)) {
        return NextResponse.json({ error: 'Unsupported currency.' }, { status: 400 })
      }
      const orderCount = await prisma.order.count({ where: { storeId } })
      if (orderCount > 0) {
        return NextResponse.json(
          { error: 'Currency cannot be changed once the store has orders.' },
          { status: 409 },
        )
      }
    }

    const previousSubdomain = store.subdomain

    const updated = await prisma.store.update({
      where: { id: storeId },
      data: {
        ...(name?.trim()   && { name: name.trim() }),
        ...(nextSubdomain  && { subdomain: nextSubdomain }),
        ...(nextCurrency   && { currency: nextCurrency }),
      },
      select: { name: true, subdomain: true, currency: true },
    })

    if (previousSubdomain !== updated.subdomain) revalidatePath(`/store/${previousSubdomain}`)
    revalidatePath(`/store/${updated.subdomain}`)
    return NextResponse.json({ ok: true, name: updated.name, subdomain: updated.subdomain, currency: updated.currency })
  } catch (err) {
    console.error('[settings:patch]', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

// DELETE /api/stores/[storeId]/settings
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await params          // ← await params

    // Verify ownership before any destructive action
    const store = await prisma.store.findFirst({
      where: { id: storeId, owner: { clerkId } },
    })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Cascade delete in FK-safe order. Every Store relation has to be cleared
    // first — none of them declare onDelete: Cascade, so any leftover child row
    // aborts the whole delete with a foreign-key violation. ProductImage,
    // ProductVariant and ProductVariantOption are the exception: they do
    // cascade, from Product.
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { order: { storeId } } }),
      prisma.order.deleteMany({ where: { storeId } }),
      prisma.product.deleteMany({ where: { storeId } }),
      prisma.category.deleteMany({ where: { storeId } }),
      prisma.customer.deleteMany({ where: { storeId } }),
      prisma.storeCustomerAddress.deleteMany({ where: { customer: { storeId } } }),
      prisma.storeCustomer.deleteMany({ where: { storeId } }),
      prisma.storePasswordReset.deleteMany({ where: { storeId } }),
      prisma.discountCode.deleteMany({ where: { storeId } }),
      prisma.shippingRate.deleteMany({ where: { storeId } }),
      prisma.customSection.deleteMany({ where: { storeId } }),
      prisma.storePage.deleteMany({ where: { storeId } }),
      prisma.mediaAsset.deleteMany({ where: { storeId } }),
      prisma.storeTheme.deleteMany({ where: { storeId } }),
      prisma.storePayment.deleteMany({ where: { storeId } }),
      prisma.store.delete({ where: { id: storeId } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[settings:delete]', err)
    return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 })
  }
}