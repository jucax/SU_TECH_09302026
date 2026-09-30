import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'

import { getServiceClient } from '../lib/db.js'
import { readOwnerAuth } from '../lib/http.js'
import { hoursEntrySchema, policySchema, productSchema } from '../lib/schemas.js'
import { assertCanWrite, getTenantBySlug } from '../lib/tenant.js'

// The verification gate: nothing an owner enters in the setup wizard reaches
// the database, the website, or the MCP server until this endpoint is
// called, and the client only calls it after the owner has reviewed a
// preview of the parsed data. Safe to call more than once for the same
// tenant (e.g. the owner edits and republishes before ever seeing the
// dashboard): products are replaced wholesale rather than accumulated.
const publishSchema = z.object({
  slug: z.string(),
  products: z.array(productSchema.omit({ id: true })),
  hours: z.array(hoursEntrySchema),
  policies: z.array(policySchema),
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
  const { slug, products, hours, policies } = parsed.data

  try {
    const tenant = await getTenantBySlug(slug)
    if (!tenant) {
      res.status(404).json({ error: 'Business not found' })
      return
    }

    const auth = await readOwnerAuth(req)
    if (!auth) {
      res.status(401).json({ error: 'Not signed in' })
      return
    }
    try {
      assertCanWrite(tenant, auth)
    } catch {
      res.status(403).json({ error: 'Not authorized to publish this business' })
      return
    }

    const client = getServiceClient()
    const now = new Date().toISOString()

    const { error: deleteError } = await client.from('products').delete().eq('tenant_id', tenant.id)
    if (deleteError) throw deleteError

    if (products.length > 0) {
      const { error } = await client.from('products').insert(
        products.map((p) => ({
          tenant_id: tenant.id,
          name: p.name,
          description: p.description ?? null,
          price_cents: p.priceCents,
          currency: p.currency,
          available: p.available,
          compatibility: p.compatibility ?? null,
        })),
      )
      if (error) throw error
    }

    if (hours.length > 0) {
      const { error } = await client.from('hours').upsert(
        hours.map((h) => ({
          tenant_id: tenant.id,
          day_of_week: h.dayOfWeek,
          opens_at: h.opensAt,
          closes_at: h.closesAt,
          closed: h.closed,
          updated_at: now,
        })),
        { onConflict: 'tenant_id,day_of_week' },
      )
      if (error) throw error
    }

    if (policies.length > 0) {
      const { error } = await client.from('policies').upsert(
        policies.map((p) => ({ tenant_id: tenant.id, kind: p.kind, body: p.body, updated_at: now })),
        { onConflict: 'tenant_id,kind' },
      )
      if (error) throw error
    }

    const { error: logError } = await client.from('updates_log').insert({
      tenant_id: tenant.id,
      summary: `Initial setup: ${products.length} product${products.length === 1 ? '' : 's'}, ${policies.length} polic${policies.length === 1 ? 'y' : 'ies'}`,
      change_set: { productsCreate: products, hours, policies },
      source: 'setup_wizard',
    })
    if (logError) throw logError

    res.status(200).json({ ok: true })
  } catch (error) {
    console.error('setup-publish failed', error)
    res.status(500).json({ error: 'Failed to publish your business' })
  }
}
