import type { VercelRequest, VercelResponse } from '@vercel/node'

import { evaluateChangeSet, queueForReview } from '../lib/governance.js'
import { readWriteAuth } from '../lib/http.js'
import { changeSetSchema } from '../lib/schemas.js'
import { applyChangeSet, assertCanWrite, getTenantBySlug, getVerifiedRecord } from '../lib/tenant.js'

// Applies an already-structured change set (from api/structure.ts) to a
// tenant, after a deterministic governance check: routine changes auto-sync,
// material ones (new product, large price move) go to the review queue
// instead. See lib/governance.ts for the rule engine.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { slug, changeSet, summary, instruction } = req.body ?? {}
  if (typeof slug !== 'string' || typeof summary !== 'string') {
    res.status(400).json({ error: 'Missing slug or summary' })
    return
  }

  const parsedChangeSet = changeSetSchema.safeParse(changeSet)
  if (!parsedChangeSet.success) {
    res.status(400).json({ error: 'Invalid change set' })
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
      res.status(401).json({ error: 'Not authorized to edit this business' })
      return
    }
    try {
      assertCanWrite(tenant, auth)
    } catch {
      res.status(403).json({ error: 'Not authorized to edit this business' })
      return
    }

    const rawInstruction = typeof instruction === 'string' ? instruction : undefined
    const record = await getVerifiedRecord(tenant)
    const decision = evaluateChangeSet(parsedChangeSet.data, record)

    if (decision.routing === 'review') {
      const item = await queueForReview(
        tenant,
        parsedChangeSet.data,
        summary,
        decision.ruleTriggered,
        rawInstruction,
      )
      res.status(200).json({ ok: true, routing: 'review', reviewId: item.id, ruleTriggered: decision.ruleTriggered })
      return
    }

    await applyChangeSet(tenant, parsedChangeSet.data, summary, 'owner_edit', { rawInstruction })
    res.status(200).json({ ok: true, routing: 'auto_sync' })
  } catch (error) {
    console.error('apply-change failed', error)
    res.status(500).json({ error: 'Failed to apply that change' })
  }
}
