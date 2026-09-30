import type { VercelRequest, VercelResponse } from '@vercel/node'

import { cloneTenantForDemo, getCanonicalTenant } from '../lib/tenant'

// Clones the canonical Jorge's Auto Parts tenant into a fresh, private demo
// tenant for this visitor. See lib/tenant.ts cloneTenantForDemo and
// docs/PLAN.md "M4". The write-auth secret goes in an httpOnly cookie; only
// the tenant id and slug (not the secret) come back in the response body,
// since the dashboard needs the slug to know what to display.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const canonical = await getCanonicalTenant()
    const { tenant, secret } = await cloneTenantForDemo(canonical)

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
