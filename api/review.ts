import type { VercelRequest, VercelResponse } from '@vercel/node'

import { decideReviewItem, listReviewQueue } from '../lib/governance.js'
import { readWriteAuth } from '../lib/http.js'
import { assertCanWrite, getTenantBySlug } from '../lib/tenant.js'

// List (GET) and approve/reject (POST) share one function, to stay under the
// Vercel Hobby plan's 12-function limit. GET is public read, same openness as
// tenant-record: the queue's existence and status isn't sensitive, only
// deciding is. POST requires the same write-auth as any other edit.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
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
      console.error('review list failed', error)
      res.status(500).json({ error: 'Failed to load the review queue' })
    }
    return
  }

  if (req.method === 'POST') {
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

      const auth = readWriteAuth(req)
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

      await decideReviewItem(tenant, reviewId, decision, 'Business owner (demo)')
      res.status(200).json({ ok: true })
    } catch (error) {
      if (error instanceof Error && error.message === 'This item has already been decided.') {
        res.status(409).json({ error: error.message })
        return
      }
      console.error('review decide failed', error)
      res.status(500).json({ error: 'Failed to record that decision' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
