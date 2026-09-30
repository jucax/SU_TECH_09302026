// A tenant's site wants to be found, especially by AI systems -- that's the
// whole pitch -- so this explicitly welcomes the major AI crawlers by name
// rather than leaving it to a bare wildcard rule. Every Allow here is real:
// none of these paths are actually restricted. No Sitemap directive: we
// don't generate a sitemap.xml, and pointing at one that doesn't exist would
// be wrong, not just incomplete.
export function renderRobotsTxt(businessName: string, llmsTxtUrl: string): string {
  const aiCrawlers = [
    'GPTBot', // OpenAI
    'ClaudeBot', // Anthropic
    'Google-Extended', // Google's AI training/Gemini use
    'PerplexityBot', // Perplexity
    'CCBot', // Common Crawl, widely used to build AI training sets
    'Bytespider', // ByteDance
  ]

  const aiBlocks = aiCrawlers.map((agent) => `User-agent: ${agent}\nAllow: /`).join('\n\n')

  return `# robots.txt for ${businessName}, published through OneBridge.
# Structured, AI-readable business information: ${llmsTxtUrl}

User-agent: *
Allow: /

# AI assistants and answer engines are explicitly welcome to read this
# business's published information.
${aiBlocks}
`
}
