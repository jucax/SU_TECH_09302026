import { randomUUID } from 'node:crypto'

import type { ChangeSet, HoursEntry, Policy, Product, VerifiedRecord } from './schemas.js'
import { getServiceClient } from './db.js'

export interface TenantRow {
  id: string
  slug: string
  name: string
  demoSecret: string | null
  logoUrl: string | null
  createdAt: string
}

// Who is asking to write to a tenant, built by lib/http.ts readWriteAuth and
// checked by assertCanWrite. The prototype's only credential is the demo
// secret cookie from api/demo-start.ts. A registered-owner credential would be
// a second variant of this union plus a second branch in assertCanWrite.
export type WriteAuth = { kind: 'demo'; secret: string }

function mapTenantRow(row: {
  id: string
  slug: string
  name: string
  demo_secret: string | null
  logo_url: string | null
  created_at: string
}): TenantRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    demoSecret: row.demo_secret,
    logoUrl: row.logo_url,
    createdAt: row.created_at,
  }
}

const TENANT_COLUMNS = 'id, slug, name, demo_secret, logo_url, created_at'

export async function getTenantBySlug(slug: string): Promise<TenantRow | null> {
  const { data, error } = await getServiceClient()
    .from('tenants')
    .select(TENANT_COLUMNS)
    .eq('slug', slug)
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
    profile: { slug: tenant.slug, name: tenant.name, logoUrl: tenant.logoUrl },
    products,
    hours,
    policies,
  }
}

// Updates only the logo. Separate from applyChangeSet because a logo is
// presentation, not a business fact an MCP tool or the accuracy check reads,
// so it isn't part of ChangeSet or the updates_log audit trail.
export async function setTenantLogoUrl(tenantId: string, logoUrl: string | null): Promise<void> {
  const { error } = await getServiceClient()
    .from('tenants')
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq('id', tenantId)
  if (error) throw error
}

// Writes an already-approved change set to products/hours/policies and records
// it in updates_log (the audit trail). Governance happens before this is
// called: lib/governance.ts routes material changes to the review queue, and
// only routine ones or human-approved ones reach here.
export async function applyChangeSet(
  tenant: TenantRow,
  changeSet: ChangeSet,
  summary: string,
  source: 'owner_edit' | 'setup_wizard' | 'review_approval',
  options: { rawInstruction?: string; approvedBy?: string } = {},
): Promise<void> {
  const client = getServiceClient()
  const now = new Date().toISOString()

  if (changeSet.productsCreate?.length) {
    const { error } = await client.from('products').insert(
      changeSet.productsCreate.map((p) => ({
        tenant_id: tenant.id,
        name: p.name,
        description: p.description ?? null,
        price_cents: p.priceCents,
        currency: p.currency ?? 'USD',
        available: p.available ?? true,
        compatibility: p.compatibility ?? null,
      })),
    )
    if (error) throw error
  }

  if (changeSet.productsUpdate?.length) {
    for (const { id, ...fields } of changeSet.productsUpdate) {
      const patch: Record<string, unknown> = { updated_at: now }
      if (fields.name !== undefined) patch.name = fields.name
      if (fields.description !== undefined) patch.description = fields.description
      if (fields.priceCents !== undefined) patch.price_cents = fields.priceCents
      if (fields.currency !== undefined) patch.currency = fields.currency
      if (fields.available !== undefined) patch.available = fields.available
      if (fields.compatibility !== undefined) patch.compatibility = fields.compatibility

      const { error } = await client
        .from('products')
        .update(patch)
        .eq('id', id)
        .eq('tenant_id', tenant.id) // defense in depth: never touch another tenant's row
      if (error) throw error
    }
  }

  if (changeSet.hours?.length) {
    const { error } = await client.from('hours').upsert(
      changeSet.hours.map((h) => ({
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

  if (changeSet.policies?.length) {
    const { error } = await client.from('policies').upsert(
      changeSet.policies.map((p) => ({
        tenant_id: tenant.id,
        kind: p.kind,
        body: p.body,
        updated_at: now,
      })),
      { onConflict: 'tenant_id,kind' },
    )
    if (error) throw error
  }

  const { error: logError } = await client.from('updates_log').insert({
    tenant_id: tenant.id,
    summary,
    raw_instruction: options.rawInstruction ?? null,
    change_set: changeSet,
    source,
    approved_by: options.approvedBy ?? null,
  })
  if (logError) throw logError
}

// Every MCP tool call for a tenant logs here. Powers the dashboard's activity
// counts and is the evidence that the "with MCP" side of the accuracy check
// is a real tool connection, not staged.
export async function logMcpRequest(tenantId: string, toolName: string): Promise<void> {
  const { error } = await getServiceClient()
    .from('mcp_requests_log')
    .insert({ tenant_id: tenantId, tool_name: toolName })
  if (error) throw error
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'business'
}

// A private sandbox tenant for one run of the guided demo, gated by a random
// secret instead of an account. It starts with an empty catalog, which
// api/setup-publish.ts fills in. Hours are seeded closed for all seven days
// so the site, MCP server, and llms.txt never meet a day with no row.
export async function createTenantForDemo(name: string): Promise<{ tenant: TenantRow; secret: string }> {
  const client = getServiceClient()
  const baseSlug = slugify(name)
  const slug = `${baseSlug}-demo-${randomUUID().slice(0, 6)}`
  const secret = randomUUID()

  const { data, error } = await client
    .from('tenants')
    .insert({ slug, name, demo_secret: secret })
    .select(TENANT_COLUMNS)
    .single()
  if (error) throw error
  const tenant = mapTenantRow(data)

  const { error: hoursError } = await client.from('hours').insert(
    Array.from({ length: 7 }, (_, dayOfWeek) => ({
      tenant_id: tenant.id,
      day_of_week: dayOfWeek,
      opens_at: null,
      closes_at: null,
      closed: true,
    })),
  )
  if (hoursError) throw hoursError

  return { tenant, secret }
}

// Database-enforced RLS (supabase/schema.sql) already blocks anon/authenticated
// writes outright. This is the application-level check on top of that: does
// THIS caller own THIS tenant. Throws rather than returning a bool so a route
// can call it and fall straight through to the write.
export function assertCanWrite(tenant: TenantRow, auth: WriteAuth): void {
  if (tenant.demoSecret === null || tenant.demoSecret !== auth.secret) {
    throw new Error('Not authorized to write to this tenant.')
  }
}
