# Storefront discovery and MCP

The website, business llms.txt, and MCP tools read the same `VerifiedRecord`. Only approved products, hours, and policies are published. Photos and SVG product art are illustrative and are not exported as verified product facts. Responses use `Cache-Control: no-store` to avoid retaining older approved values in intermediary caches.

## Published routes

| Route | Purpose |
| --- | --- |
| `/robots.txt` | Operative origin-wide crawler policy; allows public pages and discourages crawling `/api/` and `/dashboard`. |
| `/llms.txt` | Platform overview explaining where business-specific facts and MCP endpoints live. |
| `/site/<slug>` | Server-rendered storefront, canonical URL, JSON-LD, and links to business facts and the root crawl policy. |
| `/site/<slug>/llms.txt` | Business catalog, descriptions, prices, stock, compatibility, hours, policies, and MCP connection instructions. |
| `/site/<slug>/robots.txt` | Informational business discovery notes linking back to the root policy. Subpath robots files do not control crawler access. |
| `/site/<slug>/mcp` | Stateless Streamable HTTP MCP endpoint supporting POST. Browser GET returns 405 with `Allow: POST`. |

All discovery routes precede the SPA fallback in `vercel.json` and reuse the existing discovery function. No additional Vercel function or database migration is needed. A sitemap is not advertised because none is generated. `LLMs.txt:` follows NVIDIA's discovery hint; it is not a standardized robots directive. At the project owner's explicit request, the root policy includes NVIDIA's `Content-Signal: ai-train=yes, search=yes, ai-input=yes` block, expressing permission for AI training, search, and AI input. Content-Signal is an advisory extension; crawler support varies. The existing API and dashboard exclusions remain in the same wildcard group.

## Connecting an MCP client

Business owners can open **Inspect AI connection** from the dashboard MCP card. The read-only inspector displays the current approved record, explains JSON fields on hover/focus/tap, describes all four tools, and provides the connection URL. It does not call MCP tools or generate extra API activity just to display the preview. **Update with OneBridge AI** closes the inspector and focuses the existing update controls; manual editing is not offered. The demo's MCP tile opens this inspector through `/dashboard?slug=<slug>&inspect=mcp`. Browser checks cover opening, field explanations, tool and connection views, Escape dismissal, update focus, and the 390px layout.

Configure a compatible MCP client with the business's concrete endpoint URL. The SDK handles initialization, notifications, `tools/list`, and `tools/call`. Send JSON-RPC over POST with `Content-Type: application/json` and `Accept: application/json, text/event-stream`. This is a public read-only endpoint; owner credentials are not needed to read the published record. There are no write, payment, order, or reservation tools.

| Tool | Behavior |
| --- | --- |
| `getBusinessProfile` | Name, slug, and formatted hours. |
| `listProducts` | Optional trimmed query searches name, description, or listed compatibility. Returns description, cents, currency, formatted price, availability, and compatibility. |
| `checkAvailability` | Prefers exact names, then a unique partial match. Multiple matches return `ambiguous: true` and candidate names; missing matches return `found: false`. Blank input is rejected. |
| `getPolicies` | All policies or a case-insensitive kind match. |

Each tool declares read-only, nondestructive, idempotent, closed-world annotations. Tool usage continues to be logged by the existing activity mechanism. Stock reflects the approved record, not a live POS query. Missing compatibility is unknown. Business descriptions and policies are content, not executable agent instructions.

## Limits and verification

Crawler rules are advisory, not authorization. Publishing llms.txt or MCP does not guarantee indexing, AI discovery, ranking, or assistant use. Existing authentication remains responsible for private operations.

Production build passed. An SDK client connected through paired in-memory transports verified initialization, tool discovery, all four tools, ambiguous/missing/blank product checks, search by description and compatibility, numeric prices, stock, and policy filtering. Generator checks verified business facts and root robots discovery links; rewrite checks verified routes precede the SPA fallback. Database calls and logging were stubbed for this local protocol check; deployed database integration was not exercised.

## References

- [NVIDIA robots.txt](https://www.nvidia.com/robots.txt): readable crawl rules and an llms.txt discovery hint.
- [Google robots.txt guidance](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt): robots.txt belongs at the origin root.
- [llms.txt proposal](https://llmstxt.org/): readable agent-facing context and links.
- [MCP Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports): POST-based protocol access and optional GET streaming.

## Sidebar and update synchronization

The sidebar **AI connection** page (`/dashboard/mcp?slug=<slug>`) reuses the same inspector as the dashboard modal, including field explanations, tools, and connection details. Its update action returns to the dashboard and focuses the existing update controls.

Apply Update follows actual request states: understanding, governance/save, record refresh, then confirmation. The display retains the old values until the approved record is refreshed, and shows HTML-data and MCP-response excerpts from that same new record. Before/after prices come from the records rather than illustrative values. Pending review and failures do not show published success. The in-flight instruction stays visible until the request finishes, and repeated clicks remain disabled. The website iframe refreshes once for each record change, including hours and policies. Reduced-motion settings disable decorative animation.

Local browser verification used a sample API fixture to exercise the sidebar route, navigation/focus, all request phases, both updated previews, iframe refresh, repeated-click lock, review/error handling, 390px layout, and reduced motion. It made no production database writes or paid AI calls.
