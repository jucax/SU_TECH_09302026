import type { VercelRequest } from '@vercel/node'

import { getServiceClient } from './db.js'
import type { OwnerAuth, WriteAuth } from './tenant.js'

// Vercel functions sit behind a proxy, so the real scheme comes from
// x-forwarded-proto, not the request itself.
export function getOrigin(req: VercelRequest): string {
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https'
  const host = req.headers.host ?? 'localhost'
  return `${proto}://${host}`
}

// The only write-auth path that exists before M11 is the demo secret cookie
// api/demo-start.ts sets. Registered-owner (Supabase session) auth arrives in
// M11 as a second branch wherever this is called. Shared here rather than
// duplicated in api/apply-change.ts and api/review-decide.ts.
export function readDemoAuth(req: VercelRequest): WriteAuth | null {
  const raw = req.cookies.onebridge_demo
  if (!raw) return null
  try {
    const { secret } = JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8'))
    return typeof secret === 'string' ? { kind: 'demo', secret } : null
  } catch {
    return null
  }
}

// M11's write-auth path: verifies a Supabase access token sent as
// `Authorization: Bearer <token>` and resolves it to the owner's user id.
// getServiceClient().auth.getUser(token) validates the token against
// Supabase Auth itself (not just decoding it), so a forged or expired token
// is rejected there, not trusted here.
export async function readOwnerAuth(req: VercelRequest): Promise<OwnerAuth | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice('Bearer '.length)

  const { data, error } = await getServiceClient().auth.getUser(token)
  if (error || !data.user) return null
  return { kind: 'owner', userId: data.user.id }
}

// Tries owner auth first (a registered business editing its own record),
// then falls back to the demo secret cookie (a cloned sandbox tenant).
// Either can be absent; only one needs to succeed.
export async function readWriteAuth(req: VercelRequest): Promise<WriteAuth | null> {
  const owner = await readOwnerAuth(req)
  if (owner) return owner
  return readDemoAuth(req)
}
