// Vercel domain API helpers — used to register/remove custom domains on the
// platform's Vercel project so SSL is auto-provisioned.
// Set VC_API_TOKEN, VC_PROJECT_ID, and (if applicable) VC_TEAM_ID in env.

const API = 'https://api.vercel.com'

function teamQuery(): string {
  const teamId = process.env.VC_TEAM_ID
  return teamId ? `?teamId=${teamId}` : ''
}

function authHeaders() {
  const token = process.env.VC_API_TOKEN
  if (!token) throw new Error('VC_API_TOKEN not set')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

function projectId() {
  const id = process.env.VC_PROJECT_ID
  if (!id) throw new Error('VC_PROJECT_ID not set')
  return id
}

export interface VercelDomainStatus {
  verified: boolean
  configured: boolean
  reason?: string
}

export async function addVercelDomain(domain: string): Promise<VercelDomainStatus> {
  const url = `${API}/v10/projects/${projectId()}/domains${teamQuery()}`
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name: domain }),
  })
  if (!res.ok && res.status !== 409) {
    const err = await res.json().catch(() => ({}))
    return { verified: false, configured: false, reason: err.error?.message ?? 'Failed to add domain' }
  }
  // 409 means already added — fall through to status check
  return await getVercelDomainStatus(domain)
}

export async function removeVercelDomain(domain: string): Promise<boolean> {
  const url = `${API}/v9/projects/${projectId()}/domains/${encodeURIComponent(domain)}${teamQuery()}`
  const res = await fetch(url, { method: 'DELETE', headers: authHeaders() })
  return res.ok || res.status === 404
}

export async function getVercelDomainStatus(domain: string): Promise<VercelDomainStatus> {
  const url = `${API}/v9/projects/${projectId()}/domains/${encodeURIComponent(domain)}${teamQuery()}`
  const res = await fetch(url, { headers: authHeaders() })
  if (!res.ok) {
    return { verified: false, configured: false, reason: 'Domain not registered with Vercel' }
  }
  const data = await res.json()
  // verification[].reason holds the unmet requirement when not verified
  const verified = data.verified === true
  // configuredBy is null until DNS resolves; we treat any non-null as configured
  const configured = !!data.verification && data.verification.length === 0
  return { verified, configured }
}
