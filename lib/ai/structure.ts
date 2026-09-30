import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

import type { ChangeSet, VerifiedRecord } from '../schemas.js'

// Turns a plain-language instruction ("change the brake rotor to $54.99 and
// mark it low stock") into the ChangeSet shape apply-change.ts can write to
// Supabase. Used by both the M7 dashboard edit box and (reused, not
// reimplemented) the M11 setup wizard's structuring step.
//
// Two-step by design: Claude identifies products/hours/policies BY NAME
// (it has no reason to know internal UUIDs, and forcing it to invent one
// would be asking it to hallucinate), then this function resolves those
// names against the tenant's current record before returning. Everything
// downstream of this function deals in real ids only.

const proposedChangeSchema = z.object({
  productUpdates: z
    .array(
      z.object({
        productName: z
          .string()
          .describe('Name of an existing product this update applies to, matched as closely as possible'),
        priceCents: z.number().int().nonnegative().optional(),
        available: z.boolean().optional(),
        description: z.string().optional(),
        compatibility: z.string().optional(),
      }),
    )
    .optional(),
  hoursUpdates: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        opensAt: z.string().nullable().optional(),
        closesAt: z.string().nullable().optional(),
        closed: z.boolean().optional(),
      }),
    )
    .optional(),
  policyUpdates: z.array(z.object({ kind: z.string(), body: z.string() })).optional(),
  unrecognized: z
    .string()
    .optional()
    .describe(
      'Set this instead of the fields above if the instruction cannot be mapped to a supported ' +
        'change (only product price/availability/description/compatibility, hours, and policies ' +
        'are supported), explaining what was not understood or not supported.',
    ),
  summary: z
    .string()
    .describe('One short human-readable sentence describing the change, for an audit log entry.'),
})

const PROPOSE_CHANGE_TOOL = {
  name: 'propose_change',
  description: "Propose a structured change to this business's verified record.",
  input_schema: {
    type: 'object' as const,
    properties: {
      productUpdates: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            productName: { type: 'string' },
            priceCents: { type: 'integer', minimum: 0 },
            available: { type: 'boolean' },
            description: { type: 'string' },
            compatibility: { type: 'string' },
          },
          required: ['productName'],
        },
      },
      hoursUpdates: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            dayOfWeek: { type: 'integer', minimum: 0, maximum: 6 },
            opensAt: { type: ['string', 'null'] },
            closesAt: { type: ['string', 'null'] },
            closed: { type: 'boolean' },
          },
          required: ['dayOfWeek'],
        },
      },
      policyUpdates: {
        type: 'array',
        items: {
          type: 'object',
          properties: { kind: { type: 'string' }, body: { type: 'string' } },
          required: ['kind', 'body'],
        },
      },
      unrecognized: { type: 'string' },
      summary: { type: 'string' },
    },
    required: ['summary'],
  },
}

export class UnrecognizedInstructionError extends Error {}

export interface StructureResult {
  changeSet: ChangeSet
  summary: string
}

export async function structureInstruction(
  record: VerifiedRecord,
  instruction: string,
): Promise<StructureResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY must be set (Vercel project env var, not committed).')
  }

  const anthropic = new Anthropic({ apiKey })

  const recordContext = JSON.stringify({
    products: record.products.map((p) => ({
      name: p.name,
      priceCents: p.priceCents,
      available: p.available,
      compatibility: p.compatibility,
    })),
    hours: record.hours,
    policies: record.policies,
  })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    system:
      'You turn a small business owner\'s plain-language instruction into a structured change ' +
      "to their business record. Only propose changes the instruction actually supports: product " +
      'price, availability, description, or compatibility; hours; or policies. Match product names ' +
      "against the current record as closely as possible; don't invent products that aren't listed. " +
      "If the instruction can't be mapped to a supported change, use the unrecognized field instead " +
      'of guessing.',
    messages: [
      {
        role: 'user',
        content: `Current business record:\n${recordContext}\n\nOwner instruction: "${instruction}"`,
      },
    ],
    tools: [PROPOSE_CHANGE_TOOL],
    tool_choice: { type: 'tool', name: 'propose_change' },
  })

  const toolUse = response.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return a structured proposal.')
  }

  const proposed = proposedChangeSchema.parse(toolUse.input)

  if (proposed.unrecognized) {
    throw new UnrecognizedInstructionError(proposed.unrecognized)
  }

  const changeSet: ChangeSet = {}

  if (proposed.productUpdates?.length) {
    changeSet.productsUpdate = []
    for (const update of proposed.productUpdates) {
      const match = record.products.find(
        (p) => p.name.toLowerCase() === update.productName.toLowerCase(),
      )
      if (!match?.id) {
        throw new UnrecognizedInstructionError(
          `Could not find a product matching "${update.productName}".`,
        )
      }
      changeSet.productsUpdate.push({
        id: match.id,
        ...(update.priceCents !== undefined && { priceCents: update.priceCents }),
        ...(update.available !== undefined && { available: update.available }),
        ...(update.description !== undefined && { description: update.description }),
        ...(update.compatibility !== undefined && { compatibility: update.compatibility }),
      })
    }
  }

  if (proposed.hoursUpdates?.length) {
    changeSet.hours = proposed.hoursUpdates.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      opensAt: h.opensAt ?? null,
      closesAt: h.closesAt ?? null,
      closed: h.closed ?? false,
    }))
  }

  if (proposed.policyUpdates?.length) {
    changeSet.policies = proposed.policyUpdates
  }

  return { changeSet, summary: proposed.summary }
}
