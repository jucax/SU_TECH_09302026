import type { VercelRequest, VercelResponse } from '@vercel/node'

import { changeSetSchema } from '../lib/schemas.js'
import { applyChangeSet, assertCanWrite, getTenantBySlug, type WriteAuth } from '../lib/tenant.js'

// Applies an already-structured change set (from api/structure.ts) to a
// tenant. M7 always auto-syncs; M9 will insert a governance check here that
// routes material changes to the review queue instead of applying them
// immediately.
//
// Auth: the only write-auth path that exists before M11 is the demo secret
// cookie api/demo-start.ts sets. Registered-owner (Supabase session) auth
// arrives in M11 and will be added as a second branch here.
function readDemoAuth(req: VercelRequest): WriteAuth | null {
  const raw = req.cookies.onebridge_demo
  if (!raw) return null
  try {
    const { secret } = JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8'))
    return typeof secret === 'string' ? { kind: 'demo', secret } : null
  } catch {
    return null
  }
}

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

    const auth = readDemoAuth(req)
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

    await applyChangeSet(tenant, parsedChangeSet.data, summary, 'owner_edit', {
      rawInstruction: typeof instruction === 'string' ? instruction : undefined,
    })

    res.status(200).json({ ok: true })
  } catch (error) {
    console.error('apply-change failed', error)
    res.status(500).json({ error: 'Failed to apply that change' })
  }
}
