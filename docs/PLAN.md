# OneBridge PoC Build Plan

## Status

Execution starting now at M1. Repo state confirmed: `main` up to date with `origin/main`, only
`README.md` tracked and `CLAUDE.md` present but untracked. First commit of M1 should add `CLAUDE.md`
to version control (it is the source of truth referenced throughout this plan and belongs in history)
before scaffolding begins.

## Context

Southwestern University's team is competing in the 2026 HSI Battle of the Brains. The Tech Solution
deliverable is due 09/30 at 7:00 AM CT and this repository (`SU_TECH_09302026`, currently empty
except for `README.md` and `CLAUDE.md`) is that submission. Roughly 10 hours of build time remain.

The product, OneBridge, is defined in `CLAUDE.md`: a managed digital and AI readiness platform for
small businesses. One verified, business approved information foundation powers two connected front
doors for that business, a website for people and an MCP server for AI, with monitoring and
governance on top.

The goal is not a complete product. It is a hosted proof of concept that makes three claims
verifiable by a judge in about five minutes: a business's MCP server really serves that business's
live verified data to an AI client, an accuracy check really compares AI answers against source of
truth data, and a governance layer really separates automatic updates from human review with an
audit trail.

## Decisions already made with the user

- Depth goes to MCP, monitoring, and governance. Website and AI discovery files are real but simple.
- Ingestion is narrow and honest: manual form and CSV upload work live. URL scraping and PDF parsing
  are documented as planned, not built.
- Registration is real but thin: Supabase auth, and a registered tenant gets its own verified record,
  website, `llms.txt`, and MCP server.
- The demo path clones Jorge's data into a private per visitor tenant, so the canonical demo tenant
  stays in script condition for the live pitch and the README.
- Stack is Vite plus React (SPA) for the dashboard, with Vercel serverless functions for everything
  that must be served by a server.
- Each business's MCP endpoint is a path under that business's site, no subdomains.
- Build in small commits on feature branches, one vertical slice at a time. The judge visible demo
  comes first and ships deployed before anything else is built on top of it.

## Working method

The demo is the priority, so the build order is chosen to produce a live URL a judge could open as
early as possible, then add capability to it slice by slice. Nothing is scheduled to be integrated at
the end.

- One branch per slice, named `feat/<slice>` or `chore/<slice>`.
- Small commits, one logical change each. Commit message format: `<slice id>: <short 1 to 2 line
  explanation>`, for example `m4: clone Jorge seed into a fresh tenant on demo start`. Slice ids are
  the plan's M-numbers, lowercased. No AI co-author attribution line on commits in this repository.
- A slice merges to `main` only when it works end to end and is deployed. Vercel builds previews per
  branch and production from `main`, so every merge refreshes the live judge URL.
- Deploy on the very first slice, not at the end. Deployment problems then surface at minute 45
  instead of hour nine.
- Never commit `.env` or keys. Secrets live in Vercel environment variables and the Supabase dashboard.
- Pull requests are optional. If you want the repo to show a review trail for judges, open one per
  slice; otherwise merge locally and keep the commit history clean and readable.

## The MCP model (important, this drives the whole design)

We generate **one MCP server per business**, from that business's verified record, tied to that
business's website. We are not building an MCP server for the OneBridge dashboard.

```
Jorge's verified record (one foundation)
        |
        |-- front door for people:  /site/jorges-auto-parts
        |-- front door for AI:      /site/jorges-auto-parts/mcp
        |-- /site/jorges-auto-parts/llms.txt
        |      states the verified facts AND declares the MCP endpoint
        |-- /site/jorges-auto-parts/robots.txt
```

Maria's AI assistant connects to Jorge's MCP server, which exposes Jorge's catalog, prices, stock,
hours, and policies. A different business is a different server with different data. This matches how
MCP is normally deployed, one server per data source.

`llms.txt` declaring the MCP endpoint is what makes "two front doors, one foundation" concrete: an AI
system that finds the human website has a documented path to the structured, business approved data.

Explicitly out of scope, documented as a future opportunity in the README: a OneBridge platform level
MCP that would let an AI agent operate the dashboard or manage a business's data.

Honest limitation to state in the README: if a business keeps its existing website on its own domain,
we cannot serve files at that domain. We generate their `robots.txt` and `llms.txt` and host their MCP
server, but the owner has to place those two files on their domain. The PoC demos the OneBridge hosted
case end to end.

## Architecture

| Layer | Choice |
| --- | --- |
| Dashboard | Vite, React, TypeScript, React Router, Tailwind, shadcn/ui, Recharts |
| Server | Vercel serverless functions (Node runtime) under `api/` |
| Data | Supabase Postgres, Supabase Auth for the registration path |
| MCP | `@modelcontextprotocol/sdk` with `StreamableHTTPServerTransport` in stateless mode |
| AI | Claude API, called only from functions so the key never reaches the browser |
| Validation | Zod schemas shared by ingestion, edits, claim extraction, and diffing |
| Hosting | Vercel, one deploy, plus Supabase. Public GitHub repo is the submission |

Because the SPA and the server rendered business sites share one domain, `vercel.json` rewrites decide
what is handled where. Order matters, the `/site/*` rules must precede the SPA fallback:

```
/site/:tenant/mcp        -> /api/mcp?tenant=:tenant
/site/:tenant/llms.txt   -> /api/llms-txt?tenant=:tenant
/site/:tenant/robots.txt -> /api/robots-txt?tenant=:tenant
/site/:tenant            -> /api/site?tenant=:tenant
/(.*)                    -> /index.html          (SPA fallback)
```

The generated business site is returned as server rendered HTML from `api/site.ts`, not by the React
SPA. This is deliberate: a client rendered page would be effectively empty to any AI system that does
not execute JavaScript, which is the exact failure OneBridge claims to fix.

Access model: a business's published data is public by design, so the website, `llms.txt`, and MCP
routes need no auth. Writes require either a Supabase session (registered tenants) or a demo session
secret issued by the clone route (demo tenants).

## Data flow

```
messy input (form, CSV)
      v
Claude structures it  ->  owner verification gate (nothing publishes unconfirmed)
      v
verified record (Supabase, per tenant)
      |--------------------------|
      v                          v
website + llms.txt/robots.txt    that business's MCP server
      |                          |
      |      AI answer with MCP  vs  AI answer without MCP
      |                   \         /
      |                    v       v
      |                 claim extraction, diff, accuracy score
      |                          v
      |         routine change -> auto sync
      |         material change -> review queue -> audit log
      v
activity dashboard (MCP requests, freshness, inconsistencies, accuracy trend)
```

## Build slices

Each slice is a branch, ends deployed, and leaves the live URL strictly better than before.

### M1 `chore/scaffold` (0:00 to 0:45)

Vite, React, TypeScript, Tailwind, shadcn, brand tokens from the `CLAUDE.md` brand guide, React Router
shell, `vercel.json` with the rewrites above, first Vercel deploy connected to the GitHub repo.

Commits: init Vite app, add Tailwind and brand tokens, add shadcn and base components, add router
shell, add `vercel.json`, connect deploy.

Outcome: a live URL exists.

### M2 `feat/data-foundation` (0:45 to 1:20)

`supabase/schema.sql` with `tenants`, `products`, `hours`, `policies`, `updates_log`, `review_queue`,
`mcp_requests_log`, `monitor_runs`, `demo_sessions`, every business scoped table carrying `tenant_id`.
`supabase/seed.sql` with the Jorge's Auto Parts master template and the canonical demo tenant.
`lib/db.ts`, `lib/tenant.ts`, `lib/schemas.ts` (Zod).

Commits: add schema, add Jorge seed, add Supabase client, add tenant resolution, add shared Zod schemas.

### M3 `feat/landing` (1:20 to 1:50)

Landing page at `/`: OneBridge framing, dominant orange CTA "See it work: Jorge's Auto Parts",
secondary navy CTA "Set up your business", and a "For judges" strip linking to the MCP endpoint, the
generated site, `llms.txt`, the monitoring page, and the repo. Strip links can point at placeholders
until the slices that provide them land.

### M4 `feat/demo-session` (1:50 to 2:20)

`api/demo-start.ts` clones the Jorge master seed into a new tenant and returns a tenant id plus a demo
secret held client side. Dashboard renders that tenant's verified data read only.

**First judge visible milestone.** A judge opens the live URL, clicks one button, and sees a real
business's verified record in a private sandbox. Merge and deploy before continuing.

### M5 `feat/business-site` (2:20 to 2:55)

`lib/generate/site.ts`, `llmsTxt.ts`, `robotsTxt.ts` plus `api/site.ts`, `api/llms-txt.ts`,
`api/robots-txt.ts`. Server rendered semantic HTML with schema.org product markup. `llms.txt` states
the verified facts and declares the MCP endpoint.

**Second judge visible milestone.** The front door for people plus the AI discovery files, openable in
a browser tab.

### M6 `feat/mcp-server` (2:55 to 4:35)

`api/mcp.ts`: that business's MCP server via `@modelcontextprotocol/sdk` streamable HTTP in stateless
mode. Tools `getBusinessProfile`, `listProducts`, `checkAvailability`, `getPolicies`. Every call writes
to `mcp_requests_log`. Verified with MCP Inspector, then with Claude Desktop.

**Third judge visible milestone.** The front door for AI, connectable from a judge's own client.

This is the fiddliest part of the build, which is why it gets 100 minutes. Fallbacks, in order:

1. Deploy only the MCP server as a small persistent Node service on Render or Railway and keep
   everything else on Vercel. The URL changes, nothing else does.
2. Ship a documented local stdio bridge script judges can run against our REST endpoints, so the MCP
   client experience stays demonstrable.

### M7 `feat/plain-language-edits` (4:35 to 5:10)

`lib/ai/structure.ts` plus `api/structure.ts` and `api/apply-change.ts`, and the dashboard edit box.
Auto sync path only at this stage.

**Fourth judge visible milestone.** Type "change the brake rotor to $54.99 and mark it low stock" and
watch the website, the MCP server, and the freshness timestamp all move together.

### M8 `feat/monitoring` (5:10 to 6:45)

`lib/ai/extractClaims.ts`, `lib/diff.ts`, `api/monitor.ts`, and the monitoring page with both panels
and a field level diff table plus accuracy score.

**Fifth judge visible milestone, and the most persuasive one.** Same model, same prompt, same settings
in both panels. The only variable is whether that business's MCP server is connected. This must be
true in the code and stated on the page, because a judge will ask whether the baseline was rigged.

### M9 `feat/governance` (6:45 to 7:45)

`lib/governance.ts` rule engine (routine is a small delta on an existing field, material is a new or
removed item, a large price move, or conflicting sources), review queue UI, approve and reject, audit
log capturing who, what, and when.

**Sixth judge visible milestone**, and the one that answers the required ethics and governance
component.

### M10 `feat/activity-dashboard` (7:45 to 8:15)

Real MCP request counts, data freshness, inconsistencies detected and resolved, accuracy trend chart.

### M11 `feat/setup-and-auth` (8:15 to 9:15)

Supabase auth, register and login, the setup wizard with form plus CSV upload, and the verification
gate that blocks publishing until the owner confirms. This is the platform proof: a second real tenant
with its own website, `llms.txt`, and MCP server.

This is the designated cut candidate. If hour 8:15 arrives and the earlier slices are not solid, skip
it and let the README describe registration as planned rather than built. Losing this is much cheaper
than losing monitoring or governance.

### M12 `chore/judge-readme` (9:15 to 10:00)

Judge facing README: problem, architecture diagram (the existing OneBridge diagram from Drive can be
reused), live links, the five minute walkthrough script, how to connect the MCP server to their own
client, and an explicit implemented versus planned versus not claimed section. Record the 60 to 90
second demo fallback. Final smoke test of the hosted URL.

Never cut this slice. The README is the first thing a judge reads.

## Cut order if time slips

M11 registration, then the M10 trend chart, then the second AI provider in M8, then brand polish.

## Honesty constraints from CLAUDE.md

- Never claim that publishing an MCP server or `llms.txt` forces ChatGPT, Claude, Gemini, or any
  assistant to discover or use it.
- Separate what OneBridge controls, what the standards enable, and what third party platforms support.
- The README must label implemented, planned, and not claimed.
- No em dashes or en dashes in any written output. Avoid inflated AI language.

## Verification

Run per slice, not all at the end.

1. After M1, confirm the deployed URL loads and the SPA fallback rewrite works on a deep link.
2. After M4, click the demo CTA and confirm a new tenant appears with Jorge's catalog. In a second
   browser profile, click the demo again, change something, and confirm the first session and the
   canonical tenant are both unaffected.
3. After M5, open `/site/jorges-auto-parts` and view source. Confirm product data is in the HTML with
   JavaScript disabled. Open `llms.txt` and confirm it declares the MCP endpoint.
4. After M6, point MCP Inspector at `/site/jorges-auto-parts/mcp`, call all four tools, confirm they
   return the verified record, and confirm rows land in `mcp_requests_log`. Then connect the same
   endpoint to Claude Desktop and ask a shopping question.
5. After M7, type the brake rotor instruction and confirm the parsed change, the website update, the
   MCP update, and the freshness timestamp.
6. After M8, run a check and confirm the no MCP panel misses or misstates facts, the MCP panel is
   correct, and the diff flags the right fields. Re run after an edit and confirm the answer quotes the
   new price.
7. After M9, trigger a material change and confirm it does not auto sync, lands in the review queue
   with the rule that caught it, and writes an audit entry on approval.
8. After M11, register an account, upload the sample CSV, confirm the verification gate blocks
   publishing until confirmed, and confirm that tenant gets its own site, `llms.txt`, and MCP endpoint.
9. Before writing README links in M12, walk all of the above against the production URL, not localhost.
