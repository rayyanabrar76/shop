import PageHeader from '@/components/dashboard/PageHeader'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { ShoppingBag } from 'lucide-react'
import OrderDetailClient from './OrderDetailClient'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeId: string; orderId: string }>
}): Promise<Metadata> {
  const { storeId, orderId } = await params
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
    select: { customerName: true },
  })
  // The short id is what the orders list shows, so the tab matches the row
  // that was clicked to open it.
  const who = order?.customerName ? ` · ${order.customerName}` : ''
  return { title: order ? `Order #${orderId.slice(0, 7)}${who}` : 'Order' }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; orderId: string }>
}) {
  const { storeId, orderId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({
    where: { id: storeId, owner: { clerkId } },
    select: { id: true, name: true },
  })
  if (!store) notFound()

  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
    include: { items: { include: { product: { select: { title: true, imageUrl: true } } } } },
  })
  if (!order) notFound()

  return (
    <>
      <PageHeader
        storeId={storeId}
        backHref={`/dashboard/stores/${storeId}/orders`}
        maxWidth="max-w-5xl"
        icon={<ShoppingBag className="w-5 h-5" />}
        title="Order"
      />

    <div className="max-w-5xl px-6 pb-10">

      <OrderDetailClient
        storeId={storeId}
        order={{
          id: order.id,
          createdAt: order.createdAt.toISOString(),
          status: order.status,
          paymentMethod: order.paymentMethod,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          customerAddress: order.customerAddress,
          customerCity: order.customerCity,
          customerCountry: order.customerCountry,
          notes: order.notes,
          discountCode: order.discountCode,
          discountAmount: order.discountAmount,
          shippingAmount: order.shippingAmount,
          shippingMethod: order.shippingMethod,
          taxAmount: order.taxAmount,
          total: order.total,
          items: order.items.map(i => ({
            id: i.id,
            title: i.product?.title ?? 'Product',
            imageUrl: i.product?.imageUrl ?? null,
            quantity: i.quantity,
            price: i.price,
            variantLabel: i.variantLabel,
          })),
        }}
      />
    </div>
    </>
  )
}
