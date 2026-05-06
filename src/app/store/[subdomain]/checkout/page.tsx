import CheckoutPage from './CheckoutClient'

export default async function Page({
  params,
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  return <CheckoutPage params={{ subdomain }} />
}