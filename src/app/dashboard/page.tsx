import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

/**
 * /dashboard is a landing spot, not a page.
 *
 * It used to render a store picker, but the sidebar already shows the active
 * store at the top and switches between them, so the picker only added a step
 * between signing in and doing something. Sign-in, the landing page and the
 * storefront preview bar all point here, so the route stays and forwards.
 */
export default async function DashboardPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  // Newest first — the same order the sidebar uses, so the store named at the
  // top of the sidebar is the one you land in.
  const store = await prisma.store.findFirst({
    where: { owner: { clerkId } },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  redirect(store ? `/dashboard/stores/${store.id}` : '/dashboard/create-store')
}
