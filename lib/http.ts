import type { VercelRequest } from '@vercel/node'

import type { WriteAuth } from './tenant.js'

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
