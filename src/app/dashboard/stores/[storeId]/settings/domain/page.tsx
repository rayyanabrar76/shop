import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import DomainSettings from './DomainSettings'

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
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Custom Domain</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Connect your own domain to your store</p>
      </div>

      <DomainSettings
        storeId={storeId}
        currentDomain={store.customDomain}
        domainVerified={store.domainVerified}
        subdomain={store.subdomain}
      />
    </div>
  )
}