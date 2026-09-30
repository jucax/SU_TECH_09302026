import type { HoursEntry, Policy, Product, VerifiedRecord } from './schemas'
import { getServiceClient } from './db'

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
