import type { VercelRequest } from '@vercel/node'

// Vercel functions sit behind a proxy, so the real scheme comes from
// x-forwarded-proto, not the request itself.
export function getOrigin(req: VercelRequest): string {
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https'
  const host = req.headers.host ?? 'localhost'
  return `${proto}://${host}`
}
