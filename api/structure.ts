import type { VercelRequest, VercelResponse } from '@vercel/node'

import { UnrecognizedInstructionError, structureInstruction } from '../lib/ai/structure.js'
import { getTenantBySlug, getVerifiedRecord } from '../lib/tenant.js'

// Turns a plain-language instruction into a change set, but does not apply
// it -- that's api/apply-change.ts. Kept separate so M9 can insert a
// governance decision between "here's the proposed change" and "here's what
// actually happened to the data".
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { slug, instruction } = req.body ?? {}
  if (typeof slug !== 'string' || typeof instruction !== 'string' || !instruction.trim()) {
    res.status(400).json({ error: 'Missing slug or instruction' })
    return
  }

  try {
    const tenant = await getTenantBySlug(slug)
    if (!tenant) {
      res.status(404).json({ error: 'Business not found' })
      return
    }

    const record = await getVerifiedRecord(tenant)
    const { changeSet, summary } = await structureInstruction(record, instruction)

    res.status(200).json({ changeSet, summary })
  } catch (error) {
    if (error instanceof UnrecognizedInstructionError) {
      res.status(422).json({ error: error.message })
      return
    }
    console.error('structure failed', error)
    res.status(500).json({ error: 'Failed to understand that instruction' })
  }
}
