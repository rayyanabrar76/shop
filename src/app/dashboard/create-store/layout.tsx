/**
 * The page itself is a client component, and a client component cannot export
 * metadata: Next.js reads it while building the server graph, where the
 * module does not exist in that form. So the title sits on a layout beside
 * it, which is a server component by default.
 *
 * This is the second page to need this, after products/create. Worth checking
 * for when adding a title: a `use client` at the top and an exported metadata
 * in the same file fails the production build, and only the production build,
 * so `next dev` gives no warning at all.
 */
export const metadata = { title: 'Create a store · Shopflow' }

export default function CreateStoreLayout({ children }: { children: React.ReactNode }) {
  return children
}
