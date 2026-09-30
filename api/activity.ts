import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getActivitySummary } from '../lib/activity.js'
import { getTenantBySlug } from '../lib/tenant.js'

// Public read, same as tenant-record and review-queue: activity counts are
// not sensitive, only writes are auth-gated elsewhere.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const slug = typeof req.query.slug === 'string' ? req.query.slug : undefined
  if (!slug) {
    res.status(400).json({ error: 'Missing slug' })
    return
  }

  try {
    const tenant = await getTenantBySlug(slug)
    if (!tenant) {
      res.status(404).json({ error: 'Business not found' })
      return
    }

    const summary = await getActivitySummary(tenant)
    res.status(200).json(summary)
  } catch (error) {
    console.error('activity failed', error)
    res.status(500).json({ error: 'Failed to load activity' })
  }
}
