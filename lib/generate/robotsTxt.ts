// Crawlers only apply robots.txt at the origin root. Tenant copies are
// informational; they cannot define independent policy on a shared domain.
export function renderRootRobotsTxt(origin: string): string {
  return `# OneBridge: public storefronts, business-approved facts.
# Crawl policy is advisory; authentication protects private operations.
# LLMs.txt is a discovery hint, not a standard crawler directive.
LLMs.txt: ${origin}/llms.txt

# AI / LLM crawlers & fetchers

User-agent: *
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /
Disallow: /api/
Disallow: /dashboard

# Public businesses: /site/<business-slug>
# Business facts: /site/<business-slug>/llms.txt
# Read-only MCP: /site/<business-slug>/mcp (POST, Streamable HTTP)
# No sitemap is advertised because this deployment does not generate one.
`
}

export function renderRobotsTxt(businessName: string, llmsTxtUrl: string): string {
  const root = new URL(llmsTxtUrl).origin
  const safeName = businessName.replace(/[\r\n]+/g, ' ')
  return `# Discovery notes for ${safeName}, published through OneBridge.
# This subpath file is informational. The operative crawl policy is:
# ${root}/robots.txt
# Business-approved facts: ${llmsTxtUrl}
LLMs.txt: ${llmsTxtUrl}

# Rules are inherited from the origin root; no tenant-wide permissions
# or AI-training consent are declared by this informational file.
`
}
