import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { ArrowLeft } from 'lucide-react'
import OrderDetailClient from './OrderDetailClient'

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
    <div className="p-10 max-w-5xl">
      <Link
        href={`/dashboard/stores/${storeId}/orders`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> All orders
      </Link>

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
  )
}
