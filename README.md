# OneBridge: The Trusted Connection

**Southwestern University · 2026 HSI Battle of the Brains · Technology Solution (`SU_TECH_09302026`)**

> **One business. One trusted information foundation. Two connected digital front doors.**

**Live prototype (start here): <https://onebridge-botb-2026.vercel.app>**
Judges do not need to install or run anything. Everything below works on the hosted site.

---

## 1. What OneBridge does

Customers increasingly ask AI assistants what to buy instead of visiting a company's website. A small business with no technical staff has no good way to make sure an assistant gets its prices, stock, hours, and policies right.

OneBridge is a managed platform that lets a small business keep **one verified, owner-approved set of business information** and publish it through two connected front doors:

| Front door | Who it serves | What it is in this prototype |
| --- | --- | --- |
| **Website for People** | Ordinary customers | A server-rendered storefront at `/site/<business>` with structured data, generated from the approved record |
| **MCP Server for AI** | Compatible AI assistants | A read-only Model Context Protocol endpoint at `/site/<business>/mcp`, generated from the same approved record |

Both front doors read the same record, so they cannot drift apart. The owner never edits HTML, an API, or a database. They review information once and later update it by typing plain language, for example: *"Change this brake rotor to $54.99 and mark it low stock."*

**The story used throughout the demo:** Jorge owns a local auto-parts shop and has a spreadsheet, a typed sheet of hours and policies, and an old website. Maria, his customer, needs the right brake rotor. OneBridge gives her accurate, current answers from Jorge's approved data, whether she uses his website or a supported AI assistant.

The case asks for a way to stay accurately represented in AI-assisted shopping, with an ethics and governance component. This prototype concentrates on three things a judge can verify in a few minutes:

1. **A real MCP server** serves a business's approved data to an AI client.
2. **An accuracy check** compares what an AI model says with and without that MCP server against the business's own facts.
3. **A governance layer** separates changes that apply automatically from changes that need a person, and keeps an audit trail.

## 2. How to explore it (about 5 minutes)

No account or sign-in is needed. Every demo run creates a private sandbox copy of Jorge's business, so nothing you do affects anyone else.

1. **Open the landing page**: <https://onebridge-botb-2026.vercel.app>. Read the hero, the story, and how it works.
2. **Click "See the live demo"** (`/demo`). This is a guided walkthrough of first-time setup:
   1. *Sources*: Jorge's real, unedited files (a CSV inventory, a PDF of hours and policies, and his old website).
   2. *Cleaning and review*: OneBridge organizes the information into products, hours, and policies. You can edit any of it. **Nothing is published until you approve it.**
   3. *Logo*: Jorge's logo is applied; you can replace or remove it.
   4. *Bridge*: click **Bridge** to publish. A new sandbox business is created.
   5. *Reveal*: compare the earlier website with the two generated front doors side by side.
3. **Click "Go to the dashboard"** and look at the two front-door cards. Open the website preview (it links to the live generated site) and click **Inspect AI connection** to see the exact approved data and the four tools an AI client receives.
4. **Make a plain-language update.** In the dashboard, type an instruction such as *"Change the front brake rotor to $54.99"* into the update box. Watch the website and MCP data change together. Then try a big change (for example, raise a price by more than 20 percent, or add a new product) and open **Review queue** to see it held for a person to approve or reject.
5. **Check activity.** **Dashboard** and **Analytics** show when the record last changed, MCP call counts, pending reviews, and the accuracy trend.
6. **Run the accuracy check.** Open **Test** for a scripted illustration of the method, then follow "Open the live accuracy check" (`/dashboard/monitoring`) to run a real comparison against an AI model.
7. **Look at what AI systems see.** Open `/site/<business>/llms.txt` (linked from the generated site), the platform-level `/llms.txt`, and `/robots.txt`.

To skip the setup walkthrough and go straight to a filled-in dashboard, the seeded example business is `jorges-auto-parts`, at `/dashboard?slug=jorges-auto-parts`. It is the canonical demo record that each sandbox is cloned from, so please treat it as read-only.

## 3. What is built, and what is not

Being specific here matters more than sounding impressive. Labels: **Built** means it works in the hosted prototype today. **Illustrative** means the screen or data is an example, and it is marked as such in the product. **Planned** means it is not built.

### Built

- **Guided setup demo** with editable products, hours, policies, and logo, and a verification gate: nothing reaches the website or MCP server until the owner publishes the reviewed data (`api/setup-publish.ts`).
- **Website for People**: server-rendered storefront with catalog search, compatibility, prices, stock, hours, policies, JSON-LD structured data, and links to the AI-readable facts (`lib/generate/site.ts`).
- **Discovery files**: platform `robots.txt` and `llms.txt`, plus a per-business `llms.txt` that lists products, prices, stock, hours, policies, and MCP connection instructions.
- **MCP Server for AI**: stateless Streamable HTTP endpoint with four read-only tools (`getBusinessProfile`, `listProducts`, `checkAvailability`, `getPolicies`). There are no write, payment, order, or reservation tools. Every call is logged (`api/mcp.ts`).
- **Plain-language updates**: an instruction is turned into a structured change by Claude, checked against the current record, and shown before it is applied (`lib/ai/structure.ts`, `api/structure.ts`).
- **Governance rules**: routine changes (stock toggles, small price edits, descriptions, hours, policies) auto-sync. A new product or a price change of more than 20 percent goes to a **review queue** for a person to approve or reject. The routing decision is deterministic code, never a model call, and every applied change is written to an audit log in the database (`lib/governance.ts`, `api/apply-change.ts`, `api/review.ts`).
- **Accuracy check**: the same question is sent to the same Claude model twice with identical settings, once with no tools and once with the business's live MCP server attached. The answers are broken into factual claims and compared against the approved record (`api/monitor.ts`, `lib/ai/extractClaims.ts`, `lib/diff.ts`).
- **Owner dashboard**: overview with both front-door previews, products, analytics, test, review queue, and settings.
- **Activity tracking from real events**: MCP tool calls, applied changes, review counts, and accuracy-check results are recorded in the database.

### Illustrative (clearly labeled in the product)

- **Analytics charts** for website visits and MCP calls over 30 days in demo sandboxes are generated sample data and carry a "Sample data" tag. Only the activity counts and accuracy trend come from real recorded events.
- **The "Test" page example** uses scripted answers built from the business's own record so it works without an AI account. The live check at `/dashboard/monitoring` is the real one.
- **Ingestion in the guided demo** shows Jorge's real files, but the demo pre-fills the extracted products, hours, and policies rather than parsing the uploaded PDF or website on the spot. The demo says so.
- **Subscription controls** in Settings (a $250 setup fee and $149 monthly service fee, with a cancel flow) show the intended plan only. No payment processing is connected.

### Planned, not built

- Real registration and sign-in for business owners (the account path was removed so the hosted prototype stays demo-only).
- Automatic ingestion from a PDF, an existing website URL, or arbitrary spreadsheets.
- Payments or AI-assisted transactions. When added, the plan is an established provider such as Stripe, and only where a specific integration supports it.
- Measurement of visibility, conversions, or accuracy inside third-party assistants (ChatGPT, Gemini, Claude.ai, and others). See "Limitations".
- Additional AI providers and more languages.

## 4. Technology

| Layer | Choice |
| --- | --- |
| Front end | React 18, TypeScript, Vite, React Router, Tailwind CSS, Recharts, Lucide icons |
| Back end | Vercel serverless functions in `api/` (Node 22, TypeScript) |
| Data | Supabase (Postgres) with row-level security on every table |
| Protocol | Model Context Protocol via `@modelcontextprotocol/sdk` (Streamable HTTP) |
| AI | Anthropic Claude via `@anthropic-ai/sdk`, model `claude-sonnet-5` |
| Validation | Zod schemas shared by the client and server (`lib/schemas.ts`) |
| Hosting | Vercel (production builds from `main`) |

Where AI is used, and where it is deliberately not:

| Task | Uses AI? | Why |
| --- | --- | --- |
| Turning a typed instruction into a structured change | Yes (Claude) | Natural language in, structured proposal out. Validated before use |
| Extracting factual claims from an AI answer | Yes (Claude) | Turns free text into checkable claims |
| The with-MCP and without-MCP answers being compared | Yes (Claude) | This is the thing being measured |
| Deciding whether a change auto-applies or goes to review | **No** | Deterministic rules, so a model can never authorize its own writes |
| Authorization, validation, publishing | **No** | Ordinary application code |
| CSV parsing | **No** | Deterministic parser |

## 5. Architecture

```
Business information (CSV, PDF, old website, owner input)
        │
        ▼
   OneBridge AI  ──►  Owner review and approval (verification gate)
        │
        ▼
   Verified record  (Supabase: products, hours, policies)
        │
        ├──►  Website for People     GET  /site/<slug>
        ├──►  Business facts         GET  /site/<slug>/llms.txt
        └──►  MCP Server for AI      POST /site/<slug>/mcp

Owner dashboard
   plain-language edit ─► Claude proposes a change ─► governance rules
        ├─ routine ───► applied, written to the audit log
        └─ material ──► review queue ─► person approves or rejects ─► applied
```

Key points:

- **One source of truth.** The website, `llms.txt`, and MCP tools all read the same `VerifiedRecord`, so they stay consistent.
- **All writes go through the server.** The browser only holds a publishable key. Tables are readable publicly only where the information is meant to be public (a business's published facts). Internal tables (audit log, review queue, request logs, monitor runs) have no public policies. Writes use a server-side key and check tenant ownership.
- **Routes** are defined in `vercel.json`: discovery files and the MCP endpoint are matched before the single-page-app fallback.

### Repository map

```
api/            Serverless functions: demo-start, setup-publish, structure, apply-change,
                review, monitor, activity, tenant-record, site, discovery, mcp
lib/            Shared server logic: schemas, tenant access, governance rules, AI helpers,
                site / llms.txt / robots.txt generators, activity summaries
src/pages/      Landing, Demo (guided walkthrough), Dashboard, Products, Analytics, Test,
                Monitoring, Review queue, Settings
src/components/ Dashboard layout, front-door previews, MCP inspector, update chat, charts
supabase/       schema.sql (tables and row-level security) and seed.sql (Jorge's business)
docs/           Build plan, discovery and MCP notes, Claude API notes, style plans
```

More detail: [`docs/DISCOVERY_AND_MCP.md`](docs/DISCOVERY_AND_MCP.md) (routes and the four MCP tools) and [`docs/PLAN.md`](docs/PLAN.md) (build plan and decisions).

## 6. Governance, accountability, and trust

This addresses the ethics and governance requirement in the case.

- **The owner approves what is published.** Nothing reaches the website or the MCP server until the owner has reviewed it.
- **Automatic versus human.** Routine, low-risk edits sync automatically. New products and large price moves (more than 20 percent) wait in a review queue. The rule that fired is recorded with each item.
- **Accountability.** The business owner is accountable for the approved record. Every applied change stores what changed, the original instruction, the source (owner edit, setup, or review approval), and who approved it.
- **Honest limits on what the AI can do.** A model can propose a change or explain a decision. It cannot authorize a write. All MCP tools are read-only.
- **Uncertainty is shown, not hidden.** Missing compatibility is reported as unknown. Ambiguous product matches ask for clarification instead of guessing. Product images on the storefront are illustrations and are labeled so, not verified product facts.
- **Measuring accuracy.** The accuracy check compares claims in an AI answer against the approved record and reports how many verifiable claims were correct. Runs are stored, so the dashboard can show a trend over time.

## 7. Limitations (please read)

- **What OneBridge controls versus what it does not.** OneBridge controls the approved record, the website, the discovery files, and the MCP server. MCP and `llms.txt` are open standards or conventions. **Third-party assistants decide whether to use them.** Publishing an MCP server does not make ChatGPT, Claude, Gemini, or any other assistant discover, recommend, or connect to a business automatically. `robots.txt` and `llms.txt` are advisory hints, not commands.
- **The accuracy check is a controlled test, not market measurement.** It shows that an assistant connected to a business's MCP server can state that business's facts correctly, compared with the same model without it. It does not show how independent shopping assistants rank or describe the business in the wild. No conversion or visibility improvement is claimed.
- **Sample size.** The check is run one question at a time by the user. It is a demonstration of the method, not a statistically meaningful benchmark.
- **Stock and prices** reflect the owner's approved record, not a live point-of-sale system.
- **Prototype scale.** This is a hosted proof of concept with example data (Jorge's Auto Parts). It has not been load tested or independently security audited.
- **Audit log viewing.** Applied changes and review decisions are recorded in the database, but the dashboard does not yet include a full audit-trail viewer. It shows the last-updated time and counts.
- **Demo sandboxes** are anonymous and protected by a per-session cookie, not by user accounts.
- **Live AI features** (plain-language updates and the accuracy check) need an Anthropic API key configured on the server. If the prepaid balance runs out, those features stop while the rest of the site keeps working.

## 8. Running it yourself (optional)

Most judges can skip this section and use the hosted site.

**Prerequisites:** Node 22, a Supabase project, and an Anthropic API key.

```bash
git clone https://github.com/jucax/SU_TECH_09302026.git
cd SU_TECH_09302026
npm install
cp .env.example .env        # then fill in the values below
```

Environment variables (see `.env.example`):

| Variable | Where it is used | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser | Safe to expose; protected by row-level security |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Server only | Never prefix with `VITE_`; never commit |
| `ANTHROPIC_API_KEY` | Server only | Needed for plain-language updates and the live accuracy check |

Database setup: run `supabase/schema.sql`, then `supabase/seed.sql` in the Supabase SQL editor.

```bash
npm run build      # type-checks the client and server, then builds
npx vercel dev     # runs the site and the api/ functions together locally
```

`npm run dev` starts only the Vite front end. The `/site/...` pages, the MCP endpoint, and the API need the serverless functions, so use `vercel dev` for a full local run. Local runs also need the Supabase project and API key above, which is why the hosted prototype is the recommended way to review this work.

## 9. Team, sources, and credits

- **Team:** Southwestern University, seven students, second year at the HSI Battle of the Brains.
- **Challenge:** "The New Front Door: Trustworthy AI Product Discovery," 2026 HSI Battle of the Brains.
- **Standards and references:** [Model Context Protocol](https://modelcontextprotocol.io/), [llms.txt proposal](https://llmstxt.org/), [Google robots.txt guidance](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt), [Anthropic API documentation](https://docs.anthropic.com/).
- All example business data (Jorge's Auto Parts) is fictional and created for this competition. Product and hero images on the generated storefront are illustrations.
- All application code in this repository was written for this competition.
