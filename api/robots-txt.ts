import type { VercelRequest, VercelResponse } from '@vercel/node'

import { renderRobotsTxt } from '../lib/generate/robotsTxt.js'

// /site/:tenant/robots.txt (see vercel.json rewrite). Content doesn't depend
// on the tenant, but the route is still tenant-scoped for consistency with
// llms.txt and the generated site.
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.status(200).send(renderRobotsTxt())
}
