import type { VercelRequest, VercelResponse } from '@vercel/node'

import { readOwnerAuth } from '../lib/http.js'
import { createTenantForOwner, getTenantByOwner } from '../lib/tenant.js'

// Combines what were api/create-tenant.ts and api/my-tenant.ts into one
// function -- Vercel's Hobby plan caps a deployment at 12 serverless
// functions, and M11 pushed this project past that. Same two behaviors,
// split by method instead of by file: POST creates (idempotent: a user who
// already has a tenant gets it back, not a second one), GET looks up the
// caller's tenant, used right after login.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await readOwnerAuth(req)
  if (!auth) {
    res.status(401).json({ error: 'Not signed in' })
    return
  }

  try {
    if (req.method === 'GET') {
      const tenant = await getTenantByOwner(auth.userId)
      res.status(200).json({ slug: tenant?.slug ?? null })
      return
    }

    if (req.method === 'POST') {
      const { name } = req.body ?? {}
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'Missing business name' })
        return
      }

      const existing = await getTenantByOwner(auth.userId)
      if (existing) {
        res.status(200).json({ slug: existing.slug })
        return
      }

      const tenant = await createTenantForOwner(auth.userId, name.trim())
      res.status(200).json({ slug: tenant.slug })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('tenant handler failed', error)
    res.status(500).json({ error: 'Failed to process your business' })
  }
}
