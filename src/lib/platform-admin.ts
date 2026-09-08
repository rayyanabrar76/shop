import { auth, currentUser } from '@clerk/nextjs/server'

/**
 * Who may see the platform admin.
 *
 * This is ShopFlow's own back office, not a merchant's: it reads across every
 * account on the instance, so the gate is an allow-list of email addresses
 * rather than a role on a row. A role column would mean a bug in the admin UI
 * could grant it; an address in the environment cannot be changed from inside
 * the app at all.
 *
 * PLATFORM_ADMIN_EMAILS overrides the default, comma separated, so a
 * deployment can hand it to someone else without a code change.
 */
const DEFAULT_ADMINS = ['rayyanabrar76@gmail.com']

function allowed(): string[] {
  const raw = process.env.PLATFORM_ADMIN_EMAILS
  const list = raw ? raw.split(',') : DEFAULT_ADMINS
  return list.map(e => e.trim().toLowerCase()).filter(Boolean)
}

export interface PlatformAdmin {
  email: string
  firstName: string
  imageUrl: string
}

/**
 * The signed-in platform admin, or null.
 *
 * Every address on the Clerk account is checked, not just the primary: someone
 * who added their work address later should not lose access because it sorted
 * second.
 */
export async function platformAdmin(): Promise<PlatformAdmin | null> {
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  if (!user) return null

  const list = allowed()
  const match = user.emailAddresses.find(e => list.includes(e.emailAddress.toLowerCase()))
  if (!match) return null

  return {
    email: match.emailAddress,
    firstName: user.firstName ?? '',
    imageUrl: user.imageUrl ?? '',
  }
}
