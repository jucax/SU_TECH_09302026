import type { VercelRequest, VercelResponse } from '@vercel/node'

import { readOwnerAuth } from '../lib/http.js'
import { getTenantByOwner } from '../lib/tenant.js'

// Used right after login to find which business (if any) this account owns,
// so the client knows where to route the owner.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const auth = await readOwnerAuth(req)
    if (!auth) {
      res.status(401).json({ error: 'Not signed in' })
      return
    }

    const tenant = await getTenantByOwner(auth.userId)
    res.status(200).json({ slug: tenant?.slug ?? null })
  } catch (error) {
    console.error('my-tenant failed', error)
    res.status(500).json({ error: 'Failed to look up your business' })
  }
}
