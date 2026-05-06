import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { theme: true },
  })

  if (!store) notFound()

  return <SettingsClient store={store} />
}