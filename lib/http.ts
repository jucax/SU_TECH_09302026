import type { VercelRequest } from '@vercel/node'

import type { WriteAuth } from './tenant.js'

// Vercel functions sit behind a proxy, so the real scheme comes from
// x-forwarded-proto, not the request itself.
export function getOrigin(req: VercelRequest): string {
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https'
  const host = req.headers.host ?? 'localhost'
  return `${proto}://${host}`
}

// Reads the caller's write credential: the demo secret cookie set by
// api/demo-start.ts. Returns null when it's missing or malformed; every write
// route then checks it against the tenant with assertCanWrite.
export function readWriteAuth(req: VercelRequest): WriteAuth | null {
  const raw = req.cookies.onebridge_demo
  if (!raw) return null
  try {
    const { secret } = JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8'))
    return typeof secret === 'string' ? { kind: 'demo', secret } : null
  } catch {
    return null
  }
}
