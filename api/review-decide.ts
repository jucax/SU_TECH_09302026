import type { VercelRequest, VercelResponse } from '@vercel/node'

import { decideReviewItem } from '../lib/governance.js'
import { readWriteAuth } from '../lib/http.js'
import { assertCanWrite, getTenantBySlug } from '../lib/tenant.js'

// Approving or rejecting a queued item requires the same write-auth as any
// other edit (see api/apply-change.ts).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { slug, reviewId, decision } = req.body ?? {}
  if (typeof slug !== 'string' || typeof reviewId !== 'string') {
    res.status(400).json({ error: 'Missing slug or reviewId' })
    return
  }
  if (decision !== 'approve' && decision !== 'reject') {
    res.status(400).json({ error: 'decision must be "approve" or "reject"' })
    return
  }

  try {
    const tenant = await getTenantBySlug(slug)
    if (!tenant) {
      res.status(404).json({ error: 'Business not found' })
      return
    }

    const auth = await readWriteAuth(req)
    if (!auth) {
      res.status(401).json({ error: 'Not authorized to review changes for this business' })
      return
    }
    try {
      assertCanWrite(tenant, auth)
    } catch {
      res.status(403).json({ error: 'Not authorized to review changes for this business' })
      return
    }

    const decidedBy = auth.kind === 'owner' ? 'Business owner' : 'Business owner (demo)'
    await decideReviewItem(tenant, reviewId, decision, decidedBy)
    res.status(200).json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'This item has already been decided.') {
      res.status(409).json({ error: error.message })
      return
    }
    console.error('review-decide failed', error)
    res.status(500).json({ error: 'Failed to record that decision' })
  }
}
