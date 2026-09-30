import type { VercelRequest, VercelResponse } from '@vercel/node'

import { renderLlmsTxt } from '../lib/generate/llmsTxt.js'
import { renderRootRobotsTxt, renderRobotsTxt } from '../lib/generate/robotsTxt.js'
import { getOrigin } from '../lib/http.js'
import { getTenantBySlug, getVerifiedRecord } from '../lib/tenant.js'

// Serves both discovery files from one function, to stay under the Vercel
// Hobby plan's 12-function limit. /site/:tenant/llms.txt and
// /site/:tenant/robots.txt both rewrite here (see vercel.json), distinguished
// by the `kind` query param. Both need the
// tenant for business-specific facts. Origin-root files need no database lookup.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = typeof req.query.tenant === 'string' ? req.query.tenant : undefined
  const kind = req.query.kind === 'robots' ? 'robots' : 'llms'

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    res.status(405).send('Method not allowed.')
    return
  }
  const origin = getOrigin(req)
  if (req.query.kind === 'root-robots') {
    res.status(200).send(renderRootRobotsTxt(origin))
    return
  }
  if (req.query.kind === 'root-llms') {
    res.status(200).send(`# OneBridge

> OneBridge publishes local businesses’ approved information for people and compatible AI systems.

## Business discovery
Published storefronts live under /site/<business-slug>. Follow a storefront’s business facts link to /site/<business-slug>/llms.txt for its catalog, hours, policies, and MCP connection.

## Platform
- [OneBridge](${origin}/): project overview and demo entry points.
- [Crawler policy](${origin}/robots.txt): origin-wide advisory crawl rules.

## Access
Business MCP endpoints use Streamable HTTP POST with JSON-RPC, not ordinary browser navigation. They provide read-only profile, product, availability, and policy tools. There is no ordering or payment tool. Each business’s llms.txt documents its concrete endpoint. Files do not guarantee AI discovery, ranking, or tool use.
`)
    return
  }

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
