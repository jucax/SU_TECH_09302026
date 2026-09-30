import type { VercelRequest, VercelResponse } from '@vercel/node'

import { createTenantForDemo } from '../lib/tenant.js'

// Starts one run of the guided demo (src/pages/Demo.tsx): creates an empty
// sandbox tenant under the given name, which the walkthrough then fills in
// through api/setup-publish.ts. The write secret goes in an httpOnly cookie;
// only the tenant id and slug come back in the response body.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { name } = req.body ?? {}

  try {
    const { tenant, secret } = await createTenantForDemo(
      typeof name === 'string' && name.trim() ? name.trim() : 'Demo Business',
    )

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
