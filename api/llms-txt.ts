import type { VercelRequest, VercelResponse } from '@vercel/node'

import { renderLlmsTxt } from '../lib/generate/llmsTxt.js'
import { getOrigin } from '../lib/http.js'
import { getTenantBySlug, getVerifiedRecord } from '../lib/tenant.js'

// /site/:tenant/llms.txt (see vercel.json rewrite).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = typeof req.query.tenant === 'string' ? req.query.tenant : undefined
  if (!slug) {
    res.status(400).send('Missing tenant.')
    return
  }

  try {
    const tenant = await getTenantBySlug(slug)
    if (!tenant) {
      res.status(404).send('Business not found.')
      return
    }

    const record = await getVerifiedRecord(tenant)
    const body = renderLlmsTxt(record, getOrigin(req))

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.status(200).send(body)
  } catch (error) {
    console.error('llms.txt render failed', error)
    res.status(500).send('Failed to render llms.txt.')
  }
}
