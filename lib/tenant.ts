import { randomUUID } from 'node:crypto'

import type { HoursEntry, Policy, Product, VerifiedRecord } from './schemas.js'
import { getServiceClient } from './db.js'

export interface TenantRow {
  id: string
  slug: string
  name: string
  ownerUserId: string | null
  isCanonical: boolean
  demoSecret: string | null
}

// Who is asking to write to a tenant. api/*.ts routes build this from the
// request (a Supabase auth JWT for registered owners, or the demo secret
// cookie issued by api/demo-start.ts) and pass it to assertCanWrite.
export type WriteAuth = { kind: 'owner'; userId: string } | { kind: 'demo'; secret: string }

function mapTenantRow(row: {
  id: string
  slug: string
  name: string
  owner_user_id: string | null
  is_canonical: boolean
  demo_secret: string | null
}): TenantRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    ownerUserId: row.owner_user_id,
    isCanonical: row.is_canonical,
    demoSecret: row.demo_secret,
  }
}

export async function getTenantBySlug(slug: string): Promise<TenantRow | null> {
  const { data, error } = await getServiceClient()
    .from('tenants')
    .select('id, slug, name, owner_user_id, is_canonical, demo_secret')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data ? mapTenantRow(data) : null
}

export async function getTenantById(id: string): Promise<TenantRow | null> {
  const { data, error } = await getServiceClient()
    .from('tenants')
    .select('id, slug, name, owner_user_id, is_canonical, demo_secret')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapTenantRow(data) : null
}

// Assembles the full verified record an MCP server, website renderer, or
// llms.txt/robots.txt generator needs for one tenant.
export async function getVerifiedRecord(tenant: TenantRow): Promise<VerifiedRecord> {
  const client = getServiceClient()

  const [productsRes, hoursRes, policiesRes] = await Promise.all([
    client
      .from('products')
      .select('id, name, description, price_cents, currency, available, compatibility')
      .eq('tenant_id', tenant.id),
    client
      .from('hours')
      .select('day_of_week, opens_at, closes_at, closed')
      .eq('tenant_id', tenant.id),
    client.from('policies').select('kind, body').eq('tenant_id', tenant.id),
  ])

  if (productsRes.error) throw productsRes.error
  if (hoursRes.error) throw hoursRes.error
  if (policiesRes.error) throw policiesRes.error

  const products: Product[] = productsRes.data.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    priceCents: p.price_cents,
    currency: p.currency,
    available: p.available,
    compatibility: p.compatibility,
  }))

  const hours: HoursEntry[] = hoursRes.data.map((h) => ({
    dayOfWeek: h.day_of_week,
    opensAt: h.opens_at,
    closesAt: h.closes_at,
    closed: h.closed,
  }))

  const policies: Policy[] = policiesRes.data.map((p) => ({ kind: p.kind, body: p.body }))

  return {
    profile: { slug: tenant.slug, name: tenant.name },
    products,
    hours,
    policies,
  }
}

// Every MCP tool call for a tenant logs here. Powers the M10 activity
// dashboard and is the evidence that the "with MCP" side of the M8
// monitoring comparison is a real tool connection, not staged.
export async function logMcpRequest(tenantId: string, toolName: string): Promise<void> {
  const { error } = await getServiceClient()
    .from('mcp_requests_log')
    .insert({ tenant_id: tenantId, tool_name: toolName })
  if (error) throw error
}

export async function getCanonicalTenant(): Promise<TenantRow> {
  const { data, error } = await getServiceClient()
    .from('tenants')
    .select('id, slug, name, owner_user_id, is_canonical, demo_secret')
    .eq('is_canonical', true)
    .single()

  if (error) throw error
  return mapTenantRow(data)
}

// Clones the canonical tenant's products/hours/policies into a brand new
// tenant, so each demo visitor gets their own private sandbox and the
// canonical tenant (used in the live pitch and the README) never changes.
// See docs/PLAN.md "M4" and the "session-scoped clone" decision.
export async function cloneTenantForDemo(
  canonical: TenantRow,
): Promise<{ tenant: TenantRow; secret: string }> {
  const client = getServiceClient()
  const secret = randomUUID()
  const slug = `${canonical.slug}-demo-${randomUUID().slice(0, 8)}`

  const { data: newTenantRow, error: insertTenantError } = await client
    .from('tenants')
    .insert({ slug, name: canonical.name, is_canonical: false, demo_secret: secret })
    .select('id, slug, name, owner_user_id, is_canonical, demo_secret')
    .single()
  if (insertTenantError) throw insertTenantError
  const tenant = mapTenantRow(newTenantRow)

  const record = await getVerifiedRecord(canonical)

  if (record.products.length > 0) {
    const { error } = await client.from('products').insert(
      record.products.map((p) => ({
        tenant_id: tenant.id,
        name: p.name,
        description: p.description,
        price_cents: p.priceCents,
        currency: p.currency,
        available: p.available,
        compatibility: p.compatibility,
      })),
    )
    if (error) throw error
  }

  if (record.hours.length > 0) {
    const { error } = await client.from('hours').insert(
      record.hours.map((h) => ({
        tenant_id: tenant.id,
        day_of_week: h.dayOfWeek,
        opens_at: h.opensAt,
        closes_at: h.closesAt,
        closed: h.closed,
      })),
    )
    if (error) throw error
  }

  if (record.policies.length > 0) {
    const { error } = await client.from('policies').insert(
      record.policies.map((p) => ({ tenant_id: tenant.id, kind: p.kind, body: p.body })),
    )
    if (error) throw error
  }

  const { error: sessionError } = await client
    .from('demo_sessions')
    .insert({ tenant_id: tenant.id, cloned_from_tenant_id: canonical.id })
  if (sessionError) throw sessionError

  return { tenant, secret }
}

// Database-enforced RLS (supabase/schema.sql) already blocks anon/authenticated
// writes outright. This is the application-level check on top of that: does
// THIS caller own THIS tenant. Throws rather than returning a bool so a route
// can call it and fall straight through to the write.
export function assertCanWrite(tenant: TenantRow, auth: WriteAuth): void {
  if (auth.kind === 'owner') {
    if (tenant.ownerUserId !== auth.userId) {
      throw new Error('Not authorized to write to this tenant.')
    }
    return
  }

  if (tenant.demoSecret === null || tenant.demoSecret !== auth.secret) {
    throw new Error('Not authorized to write to this tenant.')
  }
}
