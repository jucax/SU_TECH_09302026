import type { VercelRequest, VercelResponse } from '@vercel/node'

import { renderSiteHtml } from '../lib/generate/site.js'
import { getOrigin } from '../lib/http.js'
import { getTenantBySlug, getVerifiedRecord } from '../lib/tenant.js'

// The front door for people: /site/:tenant (see vercel.json rewrite). Server
// rendered, not the React SPA -- see lib/generate/site.ts for why.
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
    const html = renderSiteHtml(record, getOrigin(req))

    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(html)
  } catch (error) {
    console.error('site render failed', error)
    res.status(500).send('Failed to render business site.')
  }
}
