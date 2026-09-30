import { z } from 'zod'

// Shared schemas and API contracts. Safe to import from both api/*.ts (server)
// and src/ (browser): no secrets and no server-only imports, just shapes. Keep
// it that way, because the browser type-checks everything this file imports.

const dayOfWeekSchema = z.number().int().min(0).max(6) // 0 = Sunday, matches Postgres

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().default('USD'),
  available: z.boolean().default(true),
  compatibility: z.string().nullable().optional(),
})
export type Product = z.infer<typeof productSchema>

export const hoursEntrySchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  opensAt: z.string().nullable(), // "HH:MM", null when closed
  closesAt: z.string().nullable(),
  closed: z.boolean(),
})
export type HoursEntry = z.infer<typeof hoursEntrySchema>

// policies.kind is free text in the database, e.g. returns, pickup, warranty.
export const policySchema = z.object({
  kind: z.string().min(1),
  body: z.string().min(1),
})
export type Policy = z.infer<typeof policySchema>

const businessProfileSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers, and hyphens'),
  name: z.string().min(1),
  logoUrl: z.string().url().nullable().optional(),
})

// A verified record: everything needed to render the website, generate
// llms.txt/robots.txt, and answer MCP tool calls for one tenant.
export const verifiedRecordSchema = z.object({
  profile: businessProfileSchema,
  products: z.array(productSchema),
  hours: z.array(hoursEntrySchema),
  policies: z.array(policySchema),
})
export type VerifiedRecord = z.infer<typeof verifiedRecordSchema>

// A patch to one existing product: only the fields actually being changed.
// Deliberately NOT productSchema.partial() -- Zod fires a field's .default()
// whenever that key is missing, even under .partial(), so a price-only patch
// built from productSchema.partial() would silently inject currency: 'USD'
// and available: true into the change set, and applying it would overwrite
// availability the caller never mentioned. Every field here is plain
// optional with no default, so "not provided" reliably stays undefined.
const productPatchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  available: z.boolean().optional(),
  compatibility: z.string().nullable().optional(),
})

// A proposed change to a tenant's record, whatever produced it (setup wizard
// upload, plain-language edit box, or review queue approval). lib/governance.ts
// decides whether a given change set auto-syncs or needs human review;
// lib/diff.ts compares a change set (or an AI claim) against the current record.
export const changeSetSchema = z.object({
  productsCreate: z.array(productSchema.omit({ id: true })).optional(),
  productsUpdate: z.array(productPatchSchema).optional(),
  hours: z.array(hoursEntrySchema).optional(),
  policies: z.array(policySchema).optional(),
})
export type ChangeSet = z.infer<typeof changeSetSchema>

// GET /api/activity response. Built by lib/activity.ts.
export interface ActivitySummary {
  mcpRequestCount: number
  mcpRequestsByTool: Record<string, number>
  lastUpdatedAt: string
  updatesApplied: number
  updatesBySource: Record<string, number>
  reviewCounts: { pending: number; approved: number; rejected: number }
  monitorRunCount: number
  latestAccuracyScore: number | null
  latestMismatches: number | null
  accuracyTrend: Array<{ createdAt: string; accuracyScore: number }>
}

// One entry of GET /api/review. Built by lib/governance.ts.
export interface ReviewQueueItem {
  id: string
  tenantId: string
  summary: string
  rawInstruction: string | null
  changeSet: ChangeSet
  ruleTriggered: string
  status: 'pending' | 'approved' | 'rejected'
  decidedBy: string | null
  decidedAt: string | null
  createdAt: string
}
