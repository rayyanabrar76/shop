import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'shopflow-store-auth-secret-change-in-production'
)

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
    .sign(SECRET)
}

export async function verifyCustomerToken(token: string): Promise<CustomerPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as CustomerPayload
  } catch {
    return null
  }
}
