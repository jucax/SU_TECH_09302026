import { formatDayOfWeek, formatHoursEntry, formatPriceCents } from '../format.js'
import type { VerifiedRecord } from '../schemas.js'

// Follows the llmstxt.org convention (H1, blockquote summary, ## sections).
// This is the piece that makes "two front doors, one foundation" concrete:
// it states the verified facts in plain text AND declares the MCP endpoint,
// so an AI system that finds the human website has a documented path to the
// structured, business-approved data behind it.
//
// Deliberately does not claim this file makes any AI assistant discover or
// use it -- see CLAUDE.md "Discovery, Monitoring, Security, and Transactions".
export function renderLlmsTxt(record: VerifiedRecord, origin: string): string {
  const slug = record.profile.slug
  const mcpUrl = `${origin}/site/${slug}/mcp`
  const siteUrl = `${origin}/site/${slug}`

  const productLines = record.products
    .map((p) => {
      const availability = p.available ? 'in stock' : 'unavailable'
      const compat = p.compatibility ? ` (${p.compatibility})` : ''
      return `- ${p.name}${compat}: ${formatPriceCents(p.priceCents, p.currency)}, ${availability}`
    })
    .join('\n')

  const hoursLines = [...record.hours]
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((h) => `- ${formatDayOfWeek(h.dayOfWeek)}: ${formatHoursEntry(h)}`)
    .join('\n')

  const policyLines = record.policies.map((p) => `### ${p.kind}\n${p.body}`).join('\n\n')

  return `# ${record.profile.name}

> Verified business information, kept current by the owner through OneBridge.
> This file and the MCP server below describe the same underlying record.

## Structured access
- [MCP server](${mcpUrl}): live tool access to this business's current products, hours, and policies via the Model Context Protocol. Compatible AI systems may connect to it directly; this file does not itself compel any particular assistant to do so.
- [Website](${siteUrl}): the same information, formatted for people.

## Products
${productLines}

## Hours
${hoursLines}

## Policies

${policyLines}
`
}
