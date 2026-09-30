import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

import { extractClaims } from '../lib/ai/extractClaims.js'
import { getServiceClient } from '../lib/db.js'
import { diffClaims } from '../lib/diff.js'
import { getOrigin } from '../lib/http.js'
import { getTenantBySlug, getVerifiedRecord } from '../lib/tenant.js'

const MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 1024
const MCP_BETA = 'mcp-client-2026-09-15'

// The M8 comparison: the same model, prompt, and max_tokens, asked twice --
// once with no tools at all, once with this tenant's real MCP server attached
// via Anthropic's MCP connector (so "with MCP" is an actual live tool call
// against our own deployed endpoint, not a simulation; every call it makes
// lands in mcp_requests_log same as any other MCP client). The ONLY variable
// between the two branches is mcp_servers. See docs/PLAN.md
// "Comparison fairness" -- this must stay true here, not just be claimed on
// the results page.

interface McpToolUseBlock {
  type: 'mcp_tool_use'
  id: string
  name: string
  server_name: string
  input: unknown
}
interface McpToolResultBlock {
  type: 'mcp_tool_result'
  tool_use_id: string
  is_error: boolean
  content: string | Array<{ type: 'text'; text: string }>
}
function isMcpToolUse(block: { type: string }): block is McpToolUseBlock {
  return block.type === 'mcp_tool_use'
}
function isMcpToolResult(block: { type: string }): block is McpToolResultBlock {
  return block.type === 'mcp_tool_result'
}
function extractText(content: ReadonlyArray<{ type: string }>): string {
  return content
    .filter((b) => b.type === 'text')
    .map((b) => (b as unknown as { text: string }).text)
    .join('\n')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { slug, prompt } = req.body ?? {}
  if (typeof slug !== 'string' || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'Missing slug or prompt' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY must be set (Vercel project env var).' })
    return
  }

  try {
    const tenant = await getTenantBySlug(slug)
    if (!tenant) {
      res.status(404).json({ error: 'Business not found' })
      return
    }

    const record = await getVerifiedRecord(tenant)
    const anthropic = new Anthropic({ apiKey })
    const mcpUrl = `${getOrigin(req)}/site/${tenant.slug}/mcp`

    const [withoutMcpResponse, withMcpResponse] = await Promise.all([
      anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      }),
      anthropic.beta.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        betas: [MCP_BETA],
        mcp_servers: [{ type: 'url', url: mcpUrl, name: tenant.slug }],
        messages: [{ role: 'user', content: prompt }],
      }),
    ])

    const answerWithoutMcp = extractText(withoutMcpResponse.content)

    const withMcpContent = withMcpResponse.content as unknown as Array<{ type: string }>
    const answerWithMcp = extractText(withMcpContent)

    const toolEvidence = withMcpContent.filter(isMcpToolUse).map((useBlock) => {
      const result = withMcpContent
        .filter(isMcpToolResult)
        .find((r) => r.tool_use_id === useBlock.id)
      return {
        tool: useBlock.name,
        input: useBlock.input,
        result: result?.content ?? null,
        isError: result?.is_error ?? false,
      }
    })

    const [claimsWithoutMcp, claimsWithMcp] = await Promise.all([
      extractClaims(answerWithoutMcp),
      extractClaims(answerWithMcp),
    ])

    const diffWithoutMcp = diffClaims(claimsWithoutMcp.claims, record)
    const diffWithMcp = diffClaims(claimsWithMcp.claims, record)

    const { error: insertError } = await getServiceClient()
      .from('monitor_runs')
      .insert({
        tenant_id: tenant.id,
        prompt,
        answer_without_mcp: answerWithoutMcp,
        answer_with_mcp: answerWithMcp,
        claims_without_mcp: claimsWithoutMcp.claims,
        claims_with_mcp: claimsWithMcp.claims,
        diff: { withoutMcp: diffWithoutMcp, withMcp: diffWithMcp },
        accuracy_score: diffWithMcp.accuracyScore,
      })
    if (insertError) throw insertError

    res.status(200).json({
      prompt,
      withoutMcp: { answer: answerWithoutMcp, abstained: claimsWithoutMcp.abstained, diff: diffWithoutMcp },
      withMcp: {
        answer: answerWithMcp,
        abstained: claimsWithMcp.abstained,
        diff: diffWithMcp,
        toolEvidence,
      },
    })
  } catch (error) {
    console.error('monitor failed', error)
    res.status(500).json({ error: 'Failed to run the comparison' })
  }
}
