/** The page itself is a client component, which cannot carry metadata. */
export const metadata = { title: 'New product' }

export default function NewProductLayout({ children }: { children: React.ReactNode }) {
  return children
}
