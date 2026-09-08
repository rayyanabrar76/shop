/**
 * The policy pages every new store starts with.
 *
 * They exist from day one so a merchant can see what a shop is expected to
 * publish, rather than discovering it when a customer asks. What they do NOT
 * contain is policy wording: a refund window or a data-handling claim is a
 * commitment to real customers, and inventing one on the merchant's behalf
 * would be worse than leaving it blank. Each page ships with the headings a
 * policy needs and a prompt under each saying what belongs there.
 *
 * Until someone writes them they stay out of the storefront footer — a shopper
 * clicking "Refund Policy" and finding prompts reads worse than no link.
 */

export interface DefaultPage {
  type: string
  name: string
  slug: string
  heading: string
  body: string
}

export const DEFAULT_PAGES: DefaultPage[] = [
  {
    type: 'privacy',
    name: 'Privacy Policy',
    slug: 'privacy-policy',
    heading: 'Privacy Policy',
    body: `What we collect
Which details you ask people for (name, email, delivery address, payment details) and at what point.

How we use it
What each piece of information is actually for. Fulfilling an order, sending updates, anything else.

Who we share it with
Any service that handles your customers' data: your payment provider, your delivery company, your email tool.

Cookies
What your site stores in a visitor's browser and why.

How long we keep it
How long order and account records are kept before deletion.

Your rights
How someone asks for a copy of their data, corrects it, or asks you to delete it.

Contact
The email address someone should write to about any of this.`,
  },
  {
    type: 'terms',
    name: 'Terms of Service',
    slug: 'terms',
    heading: 'Terms of Service',
    body: `Who we are
Your trading name, and where you are based.

Placing an order
When an order becomes binding, and when you may decline one.

Prices and payment
Which currency you charge in, what tax is included, and which payment methods you accept.

Delivery
Where you ship to, and what happens if something arrives damaged or not at all.

Cancellations and returns
Point people to your refund policy, and note anything that cannot be returned.

Our liability
The limits of what you are responsible for.

Governing law
Which country's law applies to a dispute.`,
  },
  {
    type: 'refund',
    name: 'Refund Policy',
    slug: 'refund-policy',
    heading: 'Refund Policy',
    body: `Returns window
How many days a customer has to ask for a refund, counted from when.

Condition of returned items
What state something must be in to be accepted. Note anything you cannot take back. Perishable goods and made-to-order items are the usual ones.

How to start a return
The exact steps: who to email, what to include, whether you send a label.

Who pays return postage
You or the customer, and whether that changes if the item was faulty.

Refund timing
How long a refund takes once you have the item back, and where the money goes.

Faulty or wrong items
What you do when the mistake was yours.

Contact
Where to write about a return.`,
  },
  {
    type: 'shipping',
    name: 'Shipping Policy',
    slug: 'shipping-policy',
    heading: 'Shipping Policy',
    body: `Where we ship
The countries or areas you deliver to.

Processing time
How long you take to get an order out of the door, separately from how long it then travels.

Delivery times and cost
What each option costs and roughly how long it takes.

Tracking
Whether customers get a tracking number, and when.

Delays
What you do when something is held up, and how you tell people.

Wrong address or failed delivery
What happens when a parcel cannot be delivered.

Contact
Where to write about a delivery.`,
  },
]

/**
 * Whether a page is still the untouched starter.
 *
 * Compared against the shipped text rather than tracked with a flag, so it
 * needs no column and stays correct however the page was edited.
 */
export function isStarterPage(slug: string, content: unknown): boolean {
  const starter = DEFAULT_PAGES.find(p => p.slug === slug)
  if (!starter) return false

  const body = (content as { content?: unknown } | null)?.content
  if (typeof body !== 'string' || body.trim() === '') return true
  return body.trim() === starter.body.trim()
}

/** The shape StorePage.content uses for a policy page. */
export function starterContent(page: DefaultPage) {
  return { heading: page.heading, content: page.body }
}
