import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getTenantBySlug, getVerifiedRecord } from '../lib/tenant.js'

// Public, read-only: returns a tenant's verified record by slug. No auth
// required -- this is the same data the website, llms.txt, and MCP server
// expose (see supabase/schema.sql's public-read RLS policies). Used by the
// dashboard to render what a demo/registered tenant's record currently is.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const slug = typeof req.query.slug === 'string' ? req.query.slug : undefined
  if (!slug) {
    res.status(400).json({ error: 'Missing slug query param' })
    return
  }

  try {
    const tenant = await getTenantBySlug(slug)
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' })
      return
    }

    const record = await getVerifiedRecord(tenant)
    res.status(200).json(record)
  } catch (error) {
    console.error('tenant-record failed', error)
    res.status(500).json({ error: 'Failed to load tenant record' })
  }
}
