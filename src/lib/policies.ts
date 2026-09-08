import { DEFAULT_PAGES } from './default-pages'

/**
 * The policies a shop is expected to publish. A fixed set, which is the whole
 * reason they are not pages: the checkout and the footer look them up by kind.
 *
 * Safe to import from the browser; nothing here touches the database.
 */

export type PolicyKind = 'refund' | 'privacy' | 'terms' | 'shipping' | 'contact'

export interface PolicyDef {
  kind: PolicyKind
  title: string
  /** The public address on the storefront. Kept from the old pages, so any
   *  link a shop already shared keeps working. */
  slug: string
  /** One line for the settings list, saying what the policy is for. */
  blurb: string
}

export const POLICY_KINDS: PolicyDef[] = [
  { kind: 'refund',   title: 'Refund Policy',       slug: 'refund-policy',       blurb: 'Returns, exchanges and how long a customer has to ask.' },
  { kind: 'privacy',  title: 'Privacy Policy',      slug: 'privacy-policy',      blurb: 'What you collect about customers and what you do with it.' },
  { kind: 'terms',    title: 'Terms of Service',    slug: 'terms',               blurb: 'The agreement every order is placed under.' },
  { kind: 'shipping', title: 'Shipping Policy',     slug: 'shipping-policy',     blurb: 'Where you deliver, how long it takes and what it costs.' },
  { kind: 'contact',  title: 'Contact Information', slug: 'contact-information', blurb: 'How a customer reaches a person, and where the business is.' },
]

export const POLICY_BY_KIND: Record<PolicyKind, PolicyDef> =
  Object.fromEntries(POLICY_KINDS.map(p => [p.kind, p])) as Record<PolicyKind, PolicyDef>

export const POLICY_BY_SLUG: Record<string, PolicyDef> =
  Object.fromEntries(POLICY_KINDS.map(p => [p.slug, p]))

export function isPolicyKind(v: unknown): v is PolicyKind {
  return typeof v === 'string' && v in POLICY_BY_KIND
}

/** The prompts the contact policy ships with; the others come from the pages
 *  they used to be. */
const CONTACT_STARTER = `Business name
The name customers will see on their statement and their parcel.

Email
The address a customer should write to, and roughly how quickly you reply.

Phone
If you take calls, the number and the hours.

Address
Where the business is based. Some countries require this to be published.`

/**
 * The headings and prompts a policy starts with. Not wording: a refund window
 * is a commitment to real customers, and nobody should ship one the merchant
 * did not write. The prompts say what belongs under each heading.
 */
export function policyStarter(kind: PolicyKind): string {
  if (kind === 'contact') return CONTACT_STARTER
  return DEFAULT_PAGES.find(p => p.type === kind)?.body ?? ''
}

/**
 * Whether a policy has actually been written, as opposed to still holding the
 * starter prompts, or nothing. Compared against the text rather than tracked
 * with a flag, so it stays right however the policy was edited.
 */
export function isPolicyWritten(kind: PolicyKind, content: string | null | undefined): boolean {
  const text = (content ?? '').trim()
  if (!text) return false
  return text !== policyStarter(kind).trim()
}

/**
 * Whether the storefront should show it: written, and not hidden. A shopper
 * clicking "Refund Policy" and finding writing prompts is worse than no link.
 */
export function isPolicyPublished(p: { kind: PolicyKind; content: string; visible: boolean }): boolean {
  return p.visible && isPolicyWritten(p.kind, p.content)
}

/** The storefront path for a policy, on whatever base the shop is served from. */
export function policyHref(storeBase: string, kind: PolicyKind): string {
  return `${storeBase}/${POLICY_BY_KIND[kind].slug}`
}
