import { randomUUID } from 'node:crypto'

import type { ChangeSet, HoursEntry, Policy, Product, VerifiedRecord } from './schemas.js'
import { getServiceClient } from './db.js'

export interface TenantRow {
  id: string
  slug: string
  name: string
  ownerUserId: string | null
  isCanonical: boolean
  demoSecret: string | null
  createdAt: string
}

// Who is asking to write to a tenant. api/*.ts routes build this from the
// request (a Supabase auth JWT for registered owners, or the demo secret
// cookie issued by api/demo-start.ts) and pass it to assertCanWrite.
export type OwnerAuth = { kind: 'owner'; userId: string }
export type DemoAuth = { kind: 'demo'; secret: string }
export type WriteAuth = OwnerAuth | DemoAuth

function mapTenantRow(row: {
  id: string
  slug: string
  name: string
  owner_user_id: string | null
  is_canonical: boolean
  demo_secret: string | null
  created_at: string
}): TenantRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    ownerUserId: row.owner_user_id,
    isCanonical: row.is_canonical,
    demoSecret: row.demo_secret,
    createdAt: row.created_at,
  }
}

const TENANT_COLUMNS = 'id, slug, name, owner_user_id, is_canonical, demo_secret, created_at'

export async function getTenantBySlug(slug: string): Promise<TenantRow | null> {
  const { data, error } = await getServiceClient()
    .from('tenants')
    .select(TENANT_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data ? mapTenantRow(data) : null
}

export async function getTenantById(id: string): Promise<TenantRow | null> {
  const { data, error } = await getServiceClient()
    .from('tenants')
    .select(TENANT_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapTenantRow(data) : null
}

export async function getTenantByOwner(ownerUserId: string): Promise<TenantRow | null> {
  const { data, error } = await getServiceClient()
    .from('tenants')
    .select(TENANT_COLUMNS)
    .eq('owner_user_id', ownerUserId)
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

// Writes a resolved change set to products/hours/policies and logs it to
// updates_log. M7 only ever calls this with source 'owner_edit' (auto-sync,
// no governance yet); M9 adds the auto-sync-vs-review-queue branch in front
// of this, and calls it with source 'review_approval' once a human approves.
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
    .select(TENANT_COLUMNS)
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
    .select(TENANT_COLUMNS)
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

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'business'
}

// M11: a registered owner's first tenant. Unlike cloneTenantForDemo, this
// starts with an empty catalog (nothing to clone from) -- the setup wizard
// (api/setup-publish.ts) fills it in, gated behind the owner's explicit
// confirmation. Hours are seeded closed for all seven days rather than left
// empty, so the site/MCP/llms.txt never have to handle a day with no row.
export async function createTenantForOwner(ownerUserId: string, name: string): Promise<TenantRow> {
  const client = getServiceClient()
  const baseSlug = slugify(name)
  const slug = `${baseSlug}-${randomUUID().slice(0, 6)}`

  const { data, error } = await client
    .from('tenants')
    .insert({ slug, name, owner_user_id: ownerUserId, is_canonical: false })
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

  return tenant
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
