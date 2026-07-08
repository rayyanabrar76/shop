import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import VisualEditor from './VisualEditor'

export default async function VisualEditorPage({
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
