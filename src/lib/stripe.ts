import Stripe from 'stripe'

// Pinned API version. Update deliberately when upgrading the SDK.
// Using the version already in use across this codebase to avoid behavioral drift.
type StripeApiVersion = ConstructorParameters<typeof Stripe>[1] extends infer T
  ? T extends { apiVersion?: infer V } ? V : never
  : never
export const STRIPE_API_VERSION = '2026-04-22.dahlia' as StripeApiVersion

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  _stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION })
  return _stripe
}
