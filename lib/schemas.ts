import { z } from 'zod'

// Shared Zod schemas for a tenant's verified record. Safe to import from both
// api/*.ts (server) and src/ (browser) — no secrets, just shape validation.
// Used by ingestion (setup wizard), the plain-language edit box, claim
// extraction, and the diff engine, so those stay structurally in sync.

export const dayOfWeekSchema = z.number().int().min(0).max(6) // 0 = Sunday, matches Postgres

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

// Not a closed enum in the database (policies.kind is free text), but these are
// the kinds the setup wizard and dashboard UI know how to render distinctly.
export const knownPolicyKinds = ['returns', 'pickup', 'warranty'] as const

export const policySchema = z.object({
  kind: z.string().min(1),
  body: z.string().min(1),
})
export type Policy = z.infer<typeof policySchema>

export const businessProfileSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers, and hyphens'),
  name: z.string().min(1),
})
export type BusinessProfile = z.infer<typeof businessProfileSchema>

// A verified record: everything needed to render the website, generate
// llms.txt/robots.txt, and answer MCP tool calls for one tenant.
export const verifiedRecordSchema = z.object({
  profile: businessProfileSchema,
  products: z.array(productSchema),
  hours: z.array(hoursEntrySchema),
  policies: z.array(policySchema),
})
export type VerifiedRecord = z.infer<typeof verifiedRecordSchema>

// A proposed change to a tenant's record, whatever produced it (setup wizard
// upload, plain-language edit box, or review queue approval). lib/governance.ts
// decides whether a given change set auto-syncs or needs human review;
// lib/diff.ts compares a change set (or an AI claim) against the current record.
export const changeSetSchema = z.object({
  productsCreate: z.array(productSchema.omit({ id: true })).optional(),
  productsUpdate: z.array(productSchema.partial().required({ id: true })).optional(),
  hours: z.array(hoursEntrySchema).optional(),
  policies: z.array(policySchema).optional(),
})
export type ChangeSet = z.infer<typeof changeSetSchema>
