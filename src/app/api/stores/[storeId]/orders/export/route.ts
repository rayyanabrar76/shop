import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { storeId } = await params

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
