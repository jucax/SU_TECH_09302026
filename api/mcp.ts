import type { VercelRequest, VercelResponse } from '@vercel/node'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { z } from 'zod'

import { formatDayOfWeek, formatHoursEntry, formatPriceCents } from '../lib/format.js'
import type { VerifiedRecord } from '../lib/schemas.js'
import { getTenantBySlug, getVerifiedRecord, logMcpRequest, type TenantRow } from '../lib/tenant.js'

// This business's MCP server: the front door for AI. One server per tenant,
// built fresh per request (stateless mode, sessionIdGenerator: undefined --
// see docs/PLAN.md "M6"), which fits serverless naturally: there is no
// process to keep alive between calls anyway. Pattern follows the SDK's own
// simpleStatelessStreamableHttp example, adapted from Express to a plain
// Vercel Node function.

function buildServer(tenant: TenantRow, record: VerifiedRecord): McpServer {
  const server = new McpServer({ name: `onebridge-${tenant.slug}`, version: '1.0.0' })

  server.registerTool(
    'getBusinessProfile',
    {
      description: "Get this business's name and hours of operation.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      await logMcpRequest(tenant.id, 'getBusinessProfile')
      const hours = [...record.hours]
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        .map((h) => ({ day: formatDayOfWeek(h.dayOfWeek), hours: formatHoursEntry(h) }))
      return {
        content: [{ type: 'text', text: JSON.stringify({ name: record.profile.name, slug: record.profile.slug, hours }) }],
      }
    },
  )

  server.registerTool(
    'listProducts',
    {
      description:
        "List this business's products. Optionally filter by a search term matched " +
        'against product name, description, or vehicle/use compatibility. Prices and stock reflect the approved record, not a live point-of-sale check.',
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        query: z.string().trim().min(1).optional().describe('Optional search term, e.g. a product name or vehicle'),
      },
    },
    async ({ query }) => {
      await logMcpRequest(tenant.id, 'listProducts')
      const needle = query?.trim().toLowerCase()
      const products = record.products
        .filter(
          (p) =>
            !needle ||
            p.name.toLowerCase().includes(needle) ||
            (p.description?.toLowerCase().includes(needle) ?? false) ||
            (p.compatibility?.toLowerCase().includes(needle) ?? false),
        )
        .map((p) => ({
          name: p.name,
          description: p.description ?? null,
          priceCents: p.priceCents,
          currency: p.currency,
          price: formatPriceCents(p.priceCents, p.currency),
          available: p.available,
          compatibility: p.compatibility ?? null,
        }))
      return { content: [{ type: 'text', text: JSON.stringify(products) }] }
    },
  )

  server.registerTool(
    'checkAvailability',
    {
      description: 'Check approved availability and price for an exact or unique product match. Ambiguous names require clarification; stock is not a reservation.',
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: { productName: z.string().trim().min(1).describe('The product name to check') },
    },
    async ({ productName }) => {
      await logMcpRequest(tenant.id, 'checkAvailability')
      const needle = productName.trim().toLowerCase()
      const exact = record.products.filter(p => p.name.toLowerCase() === needle)
      const matches = exact.length ? exact : record.products.filter(p => p.name.toLowerCase().includes(needle))
      if (matches.length > 1) {
        return { content: [{ type: 'text', text: JSON.stringify({ found: false, ambiguous: true, candidates: matches.map(p => p.name), message: 'Multiple products match. Ask for a specific product name.' }) }] }
      }
      const match = matches[0]

      if (!match) {
        return { content: [{ type: 'text', text: JSON.stringify({ found: false }) }] }
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              found: true,
              name: match.name,
              description: match.description ?? null,
              priceCents: match.priceCents,
              currency: match.currency,
              available: match.available,
              price: formatPriceCents(match.priceCents, match.currency),
              compatibility: match.compatibility ?? null,
            }),
          },
        ],
      }
    },
  )

  server.registerTool(
    'getPolicies',
    {
      description:
        "Get this business's policies (returns, pickup, warranty, etc). Optionally filter by kind.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: { kind: z.string().trim().min(1).optional().describe('Optional policy kind, e.g. "returns"') },
    },
    async ({ kind }) => {
      await logMcpRequest(tenant.id, 'getPolicies')
      const policies = kind
        ? record.policies.filter((p) => p.kind.toLowerCase() === kind.toLowerCase())
        : record.policies
      return { content: [{ type: 'text', text: JSON.stringify(policies) }] }
    },
  )

  return server
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  const slug = typeof req.query.tenant === 'string' ? req.query.tenant : undefined
  if (!slug) {
    res.status(400).send('Missing tenant.')
    return
  }

  let tenant: TenantRow | null
  try {
    tenant = await getTenantBySlug(slug)
  } catch (error) {
    console.error('mcp tenant lookup failed', error)
    res.status(500).send('Failed to look up business.')
    return
  }
  if (!tenant) {
    res.status(404).send('Business not found.')
    return
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null,
    })
    return
  }

  try {
    const record = await getVerifiedRecord(tenant)
    const server = buildServer(tenant, record)
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })

    res.on('close', () => {
      transport.close()
      server.close()
    })

    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
  } catch (error) {
    console.error('mcp request failed', error)
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      })
    }
  }
}
