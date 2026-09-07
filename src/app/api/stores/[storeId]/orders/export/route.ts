import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStoreOwner } from '@/lib/owner-auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params

  // Being signed in was the only check here. This CSV carries every customer's
  // name, email, phone and home address, so that let any account on the
  // platform download any shop's customer list by changing the id in the URL.
  const denied = await requireStoreOwner(storeId)
  if (denied) return denied

  const orders = await prisma.order.findMany({
    where: { storeId },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } },
  })

  const rows = [
    ['Order ID', 'Date', 'Status', 'Customer Name', 'Customer Email', 'Phone', 'Address', 'City', 'Country', 'Payment Method', 'Subtotal', 'Discount', 'Shipping', 'Tax', 'Total', 'Items'],
    ...orders.map(o => {
      const subtotal = o.items.reduce((s, i) => s + i.price * i.quantity, 0)
      const itemList = o.items.map(i => `${i.product?.title ?? 'Product'} x${i.quantity}`).join(' | ')
      return [
        o.id,
        o.createdAt.toISOString(),
        o.status,
        o.customerName ?? '',
        o.customerEmail ?? '',
        o.customerPhone ?? '',
        o.customerAddress ?? '',
        o.customerCity ?? '',
        o.customerCountry ?? '',
        o.paymentMethod ?? '',
        (subtotal / 100).toFixed(2),
        ((o.discountAmount ?? 0) / 100).toFixed(2),
        ((o.shippingAmount ?? 0) / 100).toFixed(2),
        ((o.taxAmount ?? 0) / 100).toFixed(2),
        (o.total / 100).toFixed(2),
        itemList,
      ]
    }),
  ]

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
