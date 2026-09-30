-- OneBridge PoC schema.
-- Every business-scoped table carries tenant_id. RLS is enabled on every table:
-- the anon key ships in the browser bundle, so without RLS anyone could read or
-- write any tenant's data directly through Supabase's REST API, bypassing our
-- api/*.ts functions entirely. Policy shape:
--   - tenants/products/hours/policies: public SELECT (a business's published
--     info is meant to be public), no INSERT/UPDATE/DELETE policies at all.
--   - updates_log/review_queue/mcp_requests_log/monitor_runs/demo_sessions:
--     no policies at all (internal/dashboard-only data).
-- All writes, and all reads of the internal tables, happen through api/*.ts
-- functions using the service_role key (server-side only, bypasses RLS by
-- default), which is also where tenant ownership (Supabase session vs. demo
-- secret) is checked. RLS here is the database-enforced backstop, not a
-- replacement for that application check. See docs/PLAN.md "Access model".

create extension if not exists "pgcrypto";

-- A business. The prototype creates demo tenants only, where demo_secret gates
-- writes. owner_user_id is reserved for registered owners (not built in the
-- current app; see README "Not built").
create table tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,               -- used in /site/:slug routes
  name text not null,
  owner_user_id uuid references auth.users (id),
  is_canonical boolean not null default false, -- true only for the seeded Jorge's Auto Parts tenant
  demo_secret text,                        -- set for demo tenants; null for the seeded tenant
  logo_url text,                           -- public URL in the tenant-logos storage bucket
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tenants_owner_user_id_idx on tenants (owner_user_id);

create table products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null,
  currency text not null default 'USD',
  available boolean not null default true,
  compatibility text,                      -- e.g. "2015 Honda Civic" for Jorge's auto parts
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_tenant_id_idx on products (tenant_id);

create table hours (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  opens_at time,
  closes_at time,
  closed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (tenant_id, day_of_week)
);

create table policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  kind text not null,                      -- e.g. 'returns', 'pickup', 'warranty'
  body text not null,
  updated_at timestamptz not null default now(),
  unique (tenant_id, kind)
);

-- Every applied change to a tenant's verified record, whether auto-synced or
-- approved out of the review queue. This is the freshness/audit source of truth.
create table updates_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  summary text not null,                   -- human-readable, e.g. "brake rotor price: $49.99 -> $54.99"
  raw_instruction text,                    -- the plain-language input that produced this change, if any
  change_set jsonb not null,               -- structured field-level diff that was applied
  source text not null check (source in ('owner_edit', 'setup_wizard', 'review_approval')),
  approved_by text,                        -- set when source = 'review_approval'
  created_at timestamptz not null default now()
);

create index updates_log_tenant_id_idx on updates_log (tenant_id);

-- Material changes that governance routed to a human instead of auto-syncing.
create table review_queue (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  summary text not null,
  raw_instruction text,
  change_set jsonb not null,
  rule_triggered text not null,            -- which governance rule flagged this, e.g. "price_delta_over_20pct"
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index review_queue_tenant_id_idx on review_queue (tenant_id);
create index review_queue_status_idx on review_queue (status);

-- Every call to a tenant's MCP server. Powers the activity dashboard and proves
-- the "with MCP" side of the monitoring comparison is a real connection, not staged.
create table mcp_requests_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  tool_name text not null,                 -- e.g. 'getBusinessProfile', 'listProducts'
  created_at timestamptz not null default now()
);

create index mcp_requests_log_tenant_id_idx on mcp_requests_log (tenant_id);

-- Results of the monitoring comparison (with-MCP vs without-MCP AI answers).
create table monitor_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  prompt text not null,
  answer_without_mcp text not null,
  answer_with_mcp text not null,
  claims_without_mcp jsonb not null,       -- extracted factual claims, field-level
  claims_with_mcp jsonb not null,
  diff jsonb not null,                     -- field-level diff vs. verified record, with severity
  accuracy_score numeric not null,         -- 0.0 to 1.0, of the with-MCP answer
  created_at timestamptz not null default now()
);

create index monitor_runs_tenant_id_idx on monitor_runs (tenant_id);

-- Tracks which browser session cloned which demo tenant, so the clone route can be
-- idempotent per session and so demo tenants can be swept later if needed.
create table demo_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  cloned_from_tenant_id uuid not null references tenants (id),
  created_at timestamptz not null default now()
);

-- Row Level Security. Enabled everywhere; see the file header for the shape.

alter table tenants enable row level security;
alter table products enable row level security;
alter table hours enable row level security;
alter table policies enable row level security;
alter table updates_log enable row level security;
alter table review_queue enable row level security;
alter table mcp_requests_log enable row level security;
alter table monitor_runs enable row level security;
alter table demo_sessions enable row level security;

-- Public, read-only: this is a business's published information, meant to be
-- readable by anyone (customers, crawlers, AI clients) without authentication.
create policy tenants_public_read on tenants for select to anon, authenticated using (true);
create policy products_public_read on products for select to anon, authenticated using (true);
create policy hours_public_read on hours for select to anon, authenticated using (true);
create policy policies_public_read on policies for select to anon, authenticated using (true);

-- No policies are defined for INSERT/UPDATE/DELETE on the tables above, or for
-- any access at all on updates_log, review_queue, mcp_requests_log,
-- monitor_runs, or demo_sessions. With RLS enabled and no matching policy,
-- Postgres denies the operation by default for anon/authenticated. Only the
-- service_role key (used exclusively in api/*.ts, never sent to the browser)
-- bypasses RLS and can perform these operations.

-- Business logos (lib/logo.ts). Uploaded server-side with the service_role
-- key, so no insert policy is needed; the bucket is public so the website,
-- dashboard, and tab icon can load the image directly.
insert into storage.buckets (id, name, public)
values ('tenant-logos', 'tenant-logos', true)
on conflict (id) do nothing;

create policy "Public read for tenant logos" on storage.objects
  for select using (bucket_id = 'tenant-logos');
