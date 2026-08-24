import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import VisualEditor from './VisualEditor'

export default async function VisualEditorPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } },
    include: { theme: true },
  })
  if (!store) notFound()

  const savedSlides = Array.isArray((store.theme as any)?.heroSlides) ? (store.theme as any).heroSlides as any[] : null

  return (
    <VisualEditor
      storeId={storeId}
      subdomain={store.subdomain}
      storeName={store.name}
      initialTheme={store.theme}
      initialHeroSlides={savedSlides}
    />
  )
}
