import type { VercelRequest, VercelResponse } from '@vercel/node'

import { readOwnerAuth } from '../lib/http.js'
import { createTenantForOwner, getTenantByOwner } from '../lib/tenant.js'

// Called right after Supabase sign-up. Idempotent: if this user already has
// a tenant (e.g. a retried request), returns the existing one rather than
// creating a second.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { name } = req.body ?? {}
  if (typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Missing business name' })
    return
  }

  try {
    const auth = await readOwnerAuth(req)
    if (!auth) {
      res.status(401).json({ error: 'Not signed in' })
      return
    }

    const existing = await getTenantByOwner(auth.userId)
    if (existing) {
      res.status(200).json({ slug: existing.slug })
      return
    }

    const tenant = await createTenantForOwner(auth.userId, name.trim())
    res.status(200).json({ slug: tenant.slug })
  } catch (error) {
    console.error('create-tenant failed', error)
    res.status(500).json({ error: 'Failed to create your business' })
  }
}
