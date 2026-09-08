import { prisma } from '@/lib/prisma'
import PageHeader from '@/components/dashboard/PageHeader'
import { Globe } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import DomainSettings from './DomainSettings'

export const metadata = { title: 'Domain' }

export default async function DomainSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } },
  })
  if (!store) notFound()

  return (
    <>
      <PageHeader
        storeId={storeId}
        backHref={`/dashboard/stores/${storeId}/settings`}
        maxWidth="max-w-3xl"
        icon={<Globe className="w-5 h-5" />}
        title="Custom domain"
      />

    <div className="max-w-3xl mx-auto px-6 pb-10">

      <DomainSettings
        storeId={storeId}
        currentDomain={store.customDomain}
        domainVerified={store.domainVerified}
        subdomain={store.subdomain}
      />
    </div>
    </>
  )
}