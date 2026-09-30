import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'

import { getServiceClient } from '../lib/db.js'
import { readWriteAuth } from '../lib/http.js'
import { uploadTenantLogo } from '../lib/logo.js'
import { hoursEntrySchema, policySchema, productSchema } from '../lib/schemas.js'
import { applyChangeSet, assertCanWrite, getTenantBySlug, setTenantLogoUrl } from '../lib/tenant.js'

// The verification gate: nothing the owner reviews in the setup step reaches
// the database, the website, or the MCP server until this endpoint is called.
// Safe to call more than once for the same tenant.
const publishSchema = z.object({
  slug: z.string(),
  products: z.array(productSchema.omit({ id: true })),
  hours: z.array(hoursEntrySchema),
  policies: z.array(policySchema),
  // A data URL read client-side from a file input, not a hosted URL. See
  // lib/logo.ts for the accepted image types and size limit.
  logoDataUrl: z.string().nullable().optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const parsed = publishSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid setup data' })
    return
  }
  const { slug, products, hours, policies, logoDataUrl } = parsed.data

  try {
    const tenant = await getTenantBySlug(slug)
    if (!tenant) {
      res.status(404).json({ error: 'Business not found' })
      return
    }

    const auth = readWriteAuth(req)
    if (!auth) {
      res.status(401).json({ error: 'Not authorized to publish this business' })
      return
    }
    try {
      assertCanWrite(tenant, auth)
    } catch {
      res.status(403).json({ error: 'Not authorized to publish this business' })
      return
    }

    if (logoDataUrl) {
      const publicUrl = await uploadTenantLogo(tenant.id, logoDataUrl)
      await setTenantLogoUrl(tenant.id, publicUrl)
    }

    // Products are replaced wholesale, so republishing never duplicates them.
    // Hours and policies upsert on their natural keys inside applyChangeSet.
    const { error: deleteError } = await getServiceClient()
      .from('products')
      .delete()
      .eq('tenant_id', tenant.id)
    if (deleteError) throw deleteError

    const summary = `Initial setup: ${products.length} product${products.length === 1 ? '' : 's'}, ${policies.length} polic${policies.length === 1 ? 'y' : 'ies'}`
    await applyChangeSet(tenant, { productsCreate: products, hours, policies }, summary, 'setup_wizard')

    res.status(200).json({ ok: true })
  } catch (error) {
    console.error('setup-publish failed', error)
    res.status(500).json({ error: 'Failed to publish your business' })
  }
}
