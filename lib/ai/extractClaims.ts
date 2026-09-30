import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

// Pulls factual claims (price, availability, compatibility, hours, policy)
// out of an AI-generated answer, so lib/diff.ts can compare them against the
// tenant's actual verified record. Used on both sides of the M8 comparison
// (with and without MCP) -- same extraction logic either way, so any
// difference in the result reflects the answer's content, not the grader.

const claimSchema = z.object({
  subject: z.string().describe('What this claim is about, e.g. a product name'),
  field: z.enum(['price', 'availability', 'compatibility', 'hours', 'policy', 'other']),
  claimedValue: z.string().describe('The value claimed, in plain text, e.g. "$49.99" or "in stock"'),
})
export type ExtractedClaim = z.infer<typeof claimSchema>

const extractionSchema = z.object({
  claims: z.array(claimSchema),
  abstained: z
    .boolean()
    .describe('True if the answer said it does not have this information, rather than asserting one'),
})
export interface ClaimExtraction {
  claims: ExtractedClaim[]
  abstained: boolean
}

const EXTRACT_CLAIMS_TOOL = {
  name: 'extract_claims',
  description:
    "Extract factual claims about a business's products, hours, or policies from an AI-generated answer.",
  input_schema: {
    type: 'object' as const,
    properties: {
      claims: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            field: {
              type: 'string',
              enum: ['price', 'availability', 'compatibility', 'hours', 'policy', 'other'],
            },
            claimedValue: { type: 'string' },
          },
          required: ['subject', 'field', 'claimedValue'],
        },
      },
      abstained: { type: 'boolean' },
    },
    required: ['claims', 'abstained'],
  },
}

export async function extractClaims(answer: string): Promise<ClaimExtraction> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY must be set (Vercel project env var, not committed).')
  }

  const anthropic = new Anthropic({ apiKey })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    system:
      'Extract every factual claim about prices, availability, compatibility, hours, or policies ' +
      'from the given answer. If the answer says it does not know or has no information, set ' +
      'abstained to true and return no claims. Do not infer claims the answer does not actually make.',
    messages: [{ role: 'user', content: answer }],
    tools: [EXTRACT_CLAIMS_TOOL],
    tool_choice: { type: 'tool', name: 'extract_claims' },
  })

  const toolUse = response.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return structured claims.')
  }

  return extractionSchema.parse(toolUse.input)
}
