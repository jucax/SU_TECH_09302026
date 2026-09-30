import type { VercelRequest, VercelResponse } from '@vercel/node'

import { renderLlmsTxt } from '../lib/generate/llmsTxt.js'
import { renderRobotsTxt } from '../lib/generate/robotsTxt.js'
import { getOrigin } from '../lib/http.js'
import { getTenantBySlug, getVerifiedRecord } from '../lib/tenant.js'

// Combines what were api/llms-txt.ts and api/robots-txt.ts -- see
// api/tenant.ts for why (Vercel's Hobby plan function count limit).
// /site/:tenant/llms.txt and /site/:tenant/robots.txt both rewrite here (see
// vercel.json), distinguished by the `kind` query param. Both need the
// tenant now: robots.txt names the business and points at its llms.txt.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = typeof req.query.tenant === 'string' ? req.query.tenant : undefined
  const kind = req.query.kind === 'robots' ? 'robots' : 'llms'

  if (!slug) {
    res.status(400).send('Missing tenant.')
    return
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')

  try {
    const tenant = await getTenantBySlug(slug)
    if (!tenant) {
      res.status(404).send('Business not found.')
      return
    }

    const origin = getOrigin(req)

    if (kind === 'robots') {
      res.status(200).send(renderRobotsTxt(tenant.name, `${origin}/site/${tenant.slug}/llms.txt`))
      return
    }

    const record = await getVerifiedRecord(tenant)
    res.status(200).send(renderLlmsTxt(record, origin))
  } catch (error) {
    console.error('discovery render failed', error)
    res.status(500).send('Failed to render this file.')
  }
}
