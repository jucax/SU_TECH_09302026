import type { VercelRequest, VercelResponse } from '@vercel/node'

import { listReviewQueue } from '../lib/governance.js'
import { getTenantBySlug } from '../lib/tenant.js'

// Public read, same as tenant-record: the review queue's existence and
// status is not sensitive, only approving/rejecting is (see
// api/review-decide.ts for that auth check).
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

    const items = await listReviewQueue(tenant)
    res.status(200).json({ items })
  } catch (error) {
    console.error('review-queue list failed', error)
    res.status(500).json({ error: 'Failed to load the review queue' })
  }
}
