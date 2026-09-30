import type { VercelRequest, VercelResponse } from '@vercel/node'

import { cloneTenantForDemo, createTenantForDemo, getCanonicalTenant } from '../lib/tenant.js'

// Two modes, one function (Vercel's Hobby plan function-count limit is why
// this isn't two files -- see the m11 consolidation commit):
//
// - mode 'clone' (default): clones the canonical Jorge's Auto Parts tenant
//   into a fresh sandbox. The quick "See it work" path.
// - mode 'fresh': an empty tenant under the given name, demo-secret-based.
//   Used by the guided demo walkthrough (src/pages/Demo.tsx), which fills it
//   in itself via api/setup-publish.ts so a judge can watch the setup
//   narrative without signing up.
//
// Either way the write-auth secret goes in an httpOnly cookie; only the
// tenant id and slug (not the secret) come back in the response body.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { mode, name } = req.body ?? {}

  try {
    const { tenant, secret } =
      mode === 'fresh'
        ? await createTenantForDemo(typeof name === 'string' && name.trim() ? name.trim() : 'Demo Business')
        : await cloneTenantForDemo(await getCanonicalTenant())

    const cookiePayload = Buffer.from(JSON.stringify({ tenantId: tenant.id, secret })).toString(
      'base64url',
    )
    const isLocalhost = req.headers.host?.includes('localhost') ?? false
    const secureAttr = isLocalhost ? '' : '; Secure'
    res.setHeader(
      'Set-Cookie',
      `onebridge_demo=${cookiePayload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${secureAttr}`,
    )

    res.status(200).json({ tenantId: tenant.id, slug: tenant.slug })
  } catch (error) {
    console.error('demo-start failed', error)
    res.status(500).json({ error: 'Failed to start demo' })
  }
}
