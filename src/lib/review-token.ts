import { createHmac, timingSafeEqual } from 'crypto'

/**
 * The signed handle in a "how did it go?" email link.
 *
 * The email already knows who ordered and what they ordered, so asking them
 * to type their name and address again is friction with no purpose, and the
 * answer would be unverifiable anyway. A signed token carries the order and
 * the product instead: the form fills itself in and the review is marked as
 * a verified purchase because the signature proves the order.
 *
 * Signed rather than random so nothing has to be stored. A random token
 * would need a table, an index and a sweep for expired rows, and it would be
 * one more thing to keep working. This is derived from data the order
 * already holds.
 *
 * It is not a login. It proves one order contained one product, nothing
 * more, and it is only ever used to pre-fill and to set the verified flag.
 */

const MAX_AGE_DAYS = 90

function secret(): string {
  const value = process.env.JWT_SECRET
  if (!value || value.length < 32) {
    throw new Error('JWT_SECRET must be set to a random string of at least 32 characters')
  }
  return value
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

/** Builds the token that goes in the review link. */
export function makeReviewToken(orderId: string, productId: string): string {
  const payload = `${orderId}.${productId}.${Date.now()}`
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`
}

export interface ReviewTokenClaim {
  orderId: string
  productId: string
}

/**
 * Checks a token and returns what it claims, or null.
 *
 * Null for anything wrong: a bad signature, a shape that does not parse, or
 * an age past the window. The caller must still confirm the order exists,
 * belongs to this shop and contains this product. This says the link was
 * issued here and has not been edited; it does not say what is true now.
 */
export function readReviewToken(token: string | null | undefined): ReviewTokenClaim | null {
  if (!token || typeof token !== 'string') return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null

  let payload: string
  try {
    payload = Buffer.from(body, 'base64url').toString('utf8')
  } catch {
    return null
  }

  // Constant time, so a wrong signature cannot be found one character at a
  // time by measuring how long the comparison took.
  const expected = Buffer.from(sign(payload))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null

  const [orderId, productId, issued] = payload.split('.')
  if (!orderId || !productId || !issued) return null

  const age = Date.now() - Number(issued)
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_DAYS * 86_400_000) return null

  return { orderId, productId }
}
