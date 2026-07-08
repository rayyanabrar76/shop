import { SignJWT, jwtVerify } from 'jose'

function getSecret(): Uint8Array {
  const value = process.env.JWT_SECRET
  if (!value || value.length < 32) {
    throw new Error(
      'JWT_SECRET must be set to a random string of at least 32 characters. ' +
      'Generate one with: openssl rand -base64 48',
    )
  }
  return new TextEncoder().encode(value)
}

export const COOKIE_NAME = 'sf_customer'
const EXPIRES = '30d'

export interface CustomerPayload {
  customerId: string
  storeId: string
  subdomain: string
  email: string
  name?: string | null
}

export async function signCustomerToken(payload: CustomerPayload): Promise<string> {
  return new SignJWT({ ...payload } as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES)
    .sign(getSecret())
}

export async function verifyCustomerToken(token: string): Promise<CustomerPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as CustomerPayload
  } catch {
    return null
  }
}

export const CUSTOMER_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30 days
}
