// A tenant's site wants to be found, so this allows all crawling. Independent
// of llms.txt (a separate, emerging convention); this file only covers the
// standard robots exclusion protocol. No Sitemap directive: we don't generate
// a sitemap.xml, and a directive pointing at something that isn't one would
// be wrong, not just incomplete.
export function renderRobotsTxt(): string {
  return `User-agent: *
Allow: /
`
}
