# OneBridge: The Trusted Connection

**Southwestern University · 2026 HSI Battle of the Brains · Technology Solution (`SU_TECH_09302026`)**

> **One business. One trusted information foundation. Two connected digital front doors.**

**Live prototype (start here): <https://onebridge-botb-2026.vercel.app>**

> ### This website is a demo
> **This website is a demo showing the process of how OneBridge would work for a customer like Jorge.** Jorge is a fictional local auto-parts store owner. Every business, product, price, and file you see is example data created for this competition. The demo walks through what a real business owner would see, screen by screen, from first-time setup to day-to-day use. It is a working prototype, not a launched product, and it has no real customers. Section 4 explains each screen, and Section 3 states plainly which parts are fully working, which are illustrative, and which are not built.

Judges do not need to install or run anything. Everything works on the hosted site above.

---

## Contents

1. [What OneBridge does](#1-what-onebridge-does)
2. [Quick 5-minute path](#2-quick-5-minute-path)
3. [What is built, and what is not](#3-what-is-built-and-what-is-not)
4. [Screen-by-screen walkthrough](#4-screen-by-screen-walkthrough)
5. [Technology](#5-technology)
6. [Architecture](#6-architecture)
7. [Governance, accountability, and trust](#7-governance-accountability-and-trust)
8. [Limitations](#8-limitations)
9. [Sources and credits](#9-sources-and-credits)

---

## 1. What OneBridge does

Customers increasingly ask AI assistants what to buy instead of visiting a company's website. A small business with no technical staff has no good way to make sure an assistant gets its prices, stock, hours, and policies right.

OneBridge is a managed platform that lets a small business keep **one verified, owner-approved set of business information** and publish it through two connected front doors:

| Front door | Who it serves | What it is in this prototype |
| --- | --- | --- |
| **Website for People** | Ordinary customers | A server-rendered storefront at `/site/<business>` with structured data, generated from the approved record |
| **MCP Server for AI** | Compatible AI assistants | A read-only Model Context Protocol endpoint at `/site/<business>/mcp`, generated from the same approved record |

Both front doors read the same record, so they cannot drift apart. The owner never edits HTML, an API, or a database. They review information once and later update it by describing a change in plain language, for example: *"Change this brake rotor to $54.99 and mark it low stock."*

**The story used throughout the demo.** Jorge owns a local auto-parts shop. He has a spreadsheet, a typed sheet of hours and policies, and an old website. Maria, his customer, needs the right brake rotor. OneBridge gives her accurate, current answers from Jorge's approved data, whether she uses his website or a supported AI assistant.

The case asks for a way to stay accurately represented in AI-assisted shopping, with an ethics and governance component. The prototype concentrates on three things a judge can verify:

1. **A real MCP server** serves a business's approved data to an AI client.
2. **An accuracy check** compares what an AI model says with and without that MCP server against the business's own facts.
3. **A governance layer** separates changes that apply automatically from changes that need a person, and records the decisions.

## 2. Quick 5-minute path

No account or sign-in is needed. Every demo run creates a private sandbox copy of Jorge's business, so nothing you do affects anyone else.

1. Open <https://onebridge-botb-2026.vercel.app> and click **See the live demo**.
2. Follow the guided demo to the end (Sections 4.2 to 4.4). Click **Bridge** to publish Jorge's business.
3. Click **Go to the dashboard**. Open the website preview, then **Inspect AI connection**.
4. In the update box, click **Apply update** twice. The first change publishes right away. The second is held for review because it is a large price change.
5. Open **Review queue** and approve the held change. Then open **Test**, and follow "Open the live accuracy check" to run a real comparison.

Every screen is explained in Section 4.

## 3. What is built, and what is not

Being specific matters more than sounding impressive. **Built** means it works in the hosted prototype. **Illustrative** means the screen or data is an example and is marked as such in the product. **Planned** means it is not built.

### Built

- **Guided setup demo** with editable products, hours, policies, and logo, and a verification gate: nothing reaches the website or MCP server until the owner publishes the reviewed data (`api/setup-publish.ts`).
- **CSV parsing** of Jorge's real inventory file in the browser during the demo (`lib/csv.ts`).
- **Website for People**: server-rendered storefront with catalog search, compatibility, prices, stock, hours, policies, JSON-LD structured data, and links to the AI-readable facts (`lib/generate/site.ts`).
- **Discovery files**: platform `robots.txt` and `llms.txt`, plus a per-business `llms.txt` listing products, prices, stock, hours, policies, and MCP connection instructions.
- **MCP Server for AI**: stateless Streamable HTTP endpoint with four read-only tools (`getBusinessProfile`, `listProducts`, `checkAvailability`, `getPolicies`). There are no write, payment, order, or reservation tools. Every call is logged (`api/mcp.ts`).
- **Plain-language updates**: an instruction is turned into a structured change by Claude, checked against the current record, and applied through governance rules (`lib/ai/structure.ts`, `api/structure.ts`, `api/apply-change.ts`).
- **Governance rules**: routine changes auto-sync. A new product or a price change of more than 20 percent goes to a **review queue** for a person to approve or reject. Routing is deterministic code, never a model call. Applied changes are written to an audit log in the database, and review decisions appear in the Review queue's audit trail (`lib/governance.ts`, `api/review.ts`).
- **Accuracy check**: the same question is sent to the same Claude model twice with identical settings, once with no tools and once with the business's live MCP server attached. The answers are broken into factual claims and compared with the approved record (`api/monitor.ts`, `lib/ai/extractClaims.ts`, `lib/diff.ts`).
- **Owner dashboard**: overview, products, analytics, test, review queue, and settings.
- **Activity from real events**: MCP tool calls, applied changes, review counts, and accuracy-check results are recorded in the database.

### Illustrative (marked in the product)

- **Analytics charts** for website visits, MCP calls, sales, who is asking, and what customers ask AI about are generated sample data in demo sandboxes and carry a "Sample data" tag. The accuracy trend, last-updated time, review counts, and recorded MCP request counts come from real events.
- **The Test page example** uses scripted answers built from the business's own record, so it works without an AI account. The live check is the real comparison.
- **Setup extraction in the demo**: Jorge's inventory CSV is really parsed. His hours and policies are the contents of his PDF entered ahead of time, not read from the PDF live. The "reading your files" animation narrates the intended AI-assisted cleaning step. The demo says so on screen.
- **The demo update box** is preloaded with two requests so a judge only clicks **Apply update** (details in Section 4.5).
- **Subscription controls** in Settings show the intended plan ($250 setup fee and $149 monthly service fee, with a cancel flow). No billing is connected and nothing is charged.

### Planned, not built

- Real registration and sign-in for business owners (removed so the hosted prototype stays demo-only).
- Automatic ingestion from a PDF, an existing website URL, or arbitrary spreadsheets.
- Payments or AI-assisted transactions. When added, the plan is an established provider such as Stripe, and only where a specific integration supports it.
- Measurement of visibility, conversions, or accuracy inside third-party assistants (ChatGPT, Gemini, Claude.ai, and others). See Section 8.
- Additional AI providers and more languages.

## 4. Screen-by-screen walkthrough

This is what a customer like Jorge sees, in order.

### 4.1 Landing page (`/`)

The public home page.

- **Header**: the OneBridge logo, links to Our Story, How It Works, Core Values, and Pricing, and a **See the live demo** button.
- **Hero**: "Your business, told right. To people and to AI," with the flow diagram of business information going through OneBridge AI and owner review into a website and an MCP connection.
- **Our Story**: Jorge and Maria, showing who benefits on each side.
- **How It Works**: four steps: give us what you have, we clean the data, we create your two front doors, we stay with you.
- **Core Values**: Truth Before Visibility, Access Without Advantage, Humans Stay Accountable, and Trust Through Transparency.
- **Pricing**: one subscription, a $250 one-time setup fee and $149 per month.
- **See the live demo** starts the guided demo.

### 4.2 Guided demo, introduction and Step 1: "What Jorge already has" (`/demo`)

- A progress bar across the top shows four stages: **Sources, Clean and review, Publish, Two front doors**.
- **Meet Jorge**: a short introduction to the problem, that an AI assistant may skip his shop or get his price or stock wrong. Click **See how Jorge sets up**.
- **Step 1** shows the three things Jorge already has, as real files you can open or download:
  - **Inventory**: a spreadsheet exported from his register (`jorges-inventory.csv`).
  - **Hours and policies**: a sheet he typed himself (PDF).
  - **Current website**: an old site, built years ago and rarely updated.
- The point: OneBridge does not require any particular format to get started. Click **Continue to setup**.

### 4.3 Reading Jorge's files, then Step 2: "Set up Jorge's Auto Parts"

- **Reading Jorge's files**: a short animated checklist (cleaning the data, finding relationships, finding products, finding hours and policies, looking for a color palette, looking for a logo). It narrates the intended AI-assisted cleaning step. As noted in Section 3, the inventory CSV is really parsed and the rest is pre-filled.
- **Step 2** is the setup screen, already filled in. Everything is editable so Jorge can fix anything before it goes live:
  - **Products**: parsed from his CSV. Edit, remove, or add a product (name, price, compatibility, in stock or not).
  - **Hours**: a weekly schedule with a bar for each day showing when the shop is open, today highlighted. Use the pencil to edit any day.
  - **Policies**: returns, pickup, and warranty text, each editable.
  - **Logo**: Jorge's logo is applied. You can replace it or remove it.
- At the bottom, **Bridge** turns Jorge's approved information into a website and an MCP server. This is the verification gate: nothing is published until Jorge clicks it.

### 4.4 Building the two front doors, then Step 3: "One record, two front doors"

- **Building Jorge's two front doors**: a checklist (structuring the data, generating the website, generating the MCP server, publishing `llms.txt` and `robots.txt`). Behind it, a private sandbox business is created and the reviewed data is published to it.
- **Step 3** compares what Jorge had with what he now has:
  - **Before**: an earlier generated website for Jorge, shown for comparison.
  - **After: MCP server for AI**: below the Before card, with an arrow. Click it to open the AI-connection inspector in the dashboard.
  - **After: website for people**: the newly generated storefront, live in a preview frame, with an "Open in a new tab" link. Beneath it are the two AI-discovery files, **`llms.txt`** (states the facts in plain text) and **`robots.txt`** (tells crawlers they are welcome). Each has a small help icon that explains it.
- Click **Go to the dashboard**.

### 4.5 The owner dashboard (`/dashboard`)

The left sidebar has **Dashboard, Products, Analytics, Test, Review queue, and Settings**. A badge on Review queue shows how many changes are waiting. At the bottom left, Jorge's logo and business name form a **Log out** button that returns to the landing page.

The **Dashboard** overview has four parts:

- **Snapshot card** (sales through OneBridge, sample data): with an accuracy figure, how recently the data was updated, and how many changes are in review. The last two come from real activity.
- **Website for people** card: a live, scaled-down preview of the generated site. Click it, or the arrow in the header, to open the full site. **Edit with AI** jumps to the update box.
- **MCP server for AI** card: a preview of the approved data an AI client receives, the connection URL with a copy button, and **Inspect AI connection**. The inspector shows the exact approved record, explains each field, and lists the four tools. It is read-only and does not generate extra activity.
- **Update box** ("Update with OneBridge AI"): where Jorge describes a change in plain language. In a demo sandbox it is preloaded with two requests, and a judge only clicks **Apply update**:
  1. **A routine price change** (the first product, a brake rotor, from $49.99 to $54.99). It is applied to the website and the MCP data together. The preview highlights the new value.
  2. **A large price increase** (about 30 percent). Because it is more than 20 percent, it is **not published**. A notice explains why and links to the Review queue.
  - How the scripted step works: the request is sent to Claude first. If Claude's structured result matches the scripted change, that result is used. If it differs or the call fails, the preset change is used so the demo stays reliable. Either way, the change then goes through the real governance check and the real database.
- **Performance** section: activity counts and charts, with sample data tagged.

### 4.6 Review queue (`/dashboard/review`)

- **Pending**: each held change shows why it was held (for example "Big price change"), the original instruction, and a summary. **Approve change** publishes it to the website and MCP data. **Reject** discards it.
- **Audit trail**: every decision, who made it, and when.
- This is the human-in-the-loop half of the governance requirement.

### 4.7 Products (`/dashboard/products`)

- Four figures at the top: **Active products, Average price, Unavailable,** and **Missing fit info**.
- **Active products** table: product, what it fits, price, and status, straight from the verified record.
- **What AI assistants ask about most**: sample data, tagged as such.

### 4.8 Analytics (`/dashboard/analytics`)

How people and AI assistants use the information, and how accurate it stays.

- **Key indicators**, **visits and AI calls over 30 days**, **who is asking**, **sales through OneBridge**, and **what customers ask AI about**: sample data, each tagged "Sample data".
- **Recorded MCP requests** and the **accuracy trend** come from real events. Until an accuracy check has run, it says "No checks yet."

### 4.9 Test (`/dashboard/test`)

A scripted illustration of how the accuracy check works, so it can be tried without an AI account. It is labeled "Simulated example."

- **What this test does**: four steps. Ask twice (same model, same question, with and without the MCP server). Collect the facts stated. Compare each fact with the approved record. Score how many were right.
- **Try it**: pick a customer-style question and run it. The two answers appear side by side with each fact marked as a match, a mismatch, or not stated.
- **What it shows and does not show**: it shows whether an assistant connected to the MCP server gets the facts right. It does not show that ChatGPT, Claude, or Gemini will find or recommend the business on their own.
- **Run it for real** links to the live check.

### 4.10 Live accuracy check (`/dashboard/monitoring`)

The real comparison. Type any customer question and click **Run comparison**. The same Claude model answers twice with the same settings. One answer cannot use the business's tools. The other can call the business's live MCP endpoint, and those calls are logged like any other MCP client's. The answers are turned into factual claims and scored against the approved record. Each run is saved and feeds the accuracy trend. This needs the server's Anthropic account, so it stops working if the prepaid balance runs out.

### 4.11 Settings (`/dashboard/settings`)

- **Business profile**, **business hours**, and **policies**: view and edit the approved information.
- **Plan**: shows the subscription (sample data, no billing connected) and a cancel or reactivate flow that only changes what is shown.

### 4.12 What AI systems see (`/site/<business>/llms.txt`, `/llms.txt`, `/robots.txt`)

Plain-text files that describe the business and the platform to AI systems. The business `llms.txt` lists products, descriptions, prices, stock, compatibility, hours, policies, and how to connect to the MCP endpoint. These files are helpful hints, not commands. See Section 8.

## 5. Technology

| Layer | Choice |
| --- | --- |
| Front end | React 18, TypeScript, Vite, React Router, Tailwind CSS, Recharts, Lucide icons |
| Back end | Vercel serverless functions in `api/` (Node 22, TypeScript) |
| Data | Supabase (Postgres) with row-level security on every table |
| Protocol | Model Context Protocol via `@modelcontextprotocol/sdk` (Streamable HTTP) |
| AI | Anthropic Claude via `@anthropic-ai/sdk`, model `claude-sonnet-5` |
| Validation | Zod schemas shared by the client and server (`lib/schemas.ts`) |
| Hosting | Vercel, with production builds from `main` |

Where AI is used, and where it is deliberately not:

| Task | Uses AI? | Why |
| --- | --- | --- |
| Turning a typed instruction into a structured change | Yes (Claude) | Natural language in, structured proposal out. Validated before use |
| Extracting factual claims from an AI answer | Yes (Claude) | Turns free text into checkable claims |
| The with-MCP and without-MCP answers being compared | Yes (Claude) | This is the thing being measured |
| Deciding whether a change auto-applies or goes to review | **No** | Deterministic rules, so a model can never authorize its own writes |
| Authorization, validation, publishing | **No** | Ordinary application code |
| CSV parsing | **No** | Deterministic parser |

## 6. Architecture

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

- **One source of truth.** The website, `llms.txt`, and MCP tools all read the same verified record, so they stay consistent.
- **All writes go through the server.** The browser only holds a publishable key. Tables are publicly readable only where the information is meant to be public (a business's published facts). Internal tables (audit log, review queue, request logs, monitor runs) have no public policies. Writes use a server-side key and check tenant ownership.
- **Routes** are defined in `vercel.json`. Discovery files and the MCP endpoint are matched before the single-page-app fallback.

### Repository map

```
api/            Serverless functions: demo-start, setup-publish, structure, apply-change,
                review, monitor, activity, tenant-record, site, discovery, mcp
lib/            Shared server logic: schemas, tenant access, governance rules, AI helpers,
                site / llms.txt / robots.txt generators, activity summaries
src/pages/      Landing, Demo (guided walkthrough), Dashboard, Products, Analytics, Test,
                Monitoring, Review queue, Settings
src/components/ Dashboard layout, front-door previews, MCP inspector, update box, charts
supabase/       schema.sql (tables and row-level security) and seed.sql (Jorge's business)
docs/           Build plan, discovery and MCP notes, Claude API notes, style plans
```

More detail: [`docs/DISCOVERY_AND_MCP.md`](docs/DISCOVERY_AND_MCP.md) (routes and the four MCP tools) and [`docs/PLAN.md`](docs/PLAN.md) (build plan and decisions).

## 7. Governance, accountability, and trust

This addresses the ethics and governance requirement in the case.

- **The owner approves what is published.** Nothing reaches the website or the MCP server until the owner has reviewed it.
- **Automatic versus human.** Routine, low-risk edits sync automatically. New products and large price moves (more than 20 percent) wait in the Review queue. The rule that fired is recorded with each item.
- **Accountability.** The business owner is accountable for the approved record. Applied changes store what changed, the original instruction, and the source. Review decisions store who decided and when.
- **Honest limits on what the AI can do.** A model can propose a change or explain a decision. It cannot authorize a write. All MCP tools are read-only.
- **Uncertainty is shown, not hidden.** Missing compatibility is reported as unknown. Ambiguous product matches ask for clarification instead of guessing. Product images on the storefront are illustrations and are labeled so.
- **Measuring accuracy.** The accuracy check compares claims in an AI answer with the approved record and reports how many verifiable claims were correct. Runs are stored, so the dashboard can show a trend.

## 8. Limitations

- **What OneBridge controls versus what it does not.** OneBridge controls the approved record, the website, the discovery files, and the MCP server. MCP and `llms.txt` are open standards or conventions, and **third-party assistants decide whether to use them.** Publishing an MCP server does not make ChatGPT, Claude, Gemini, or any other assistant discover, recommend, or connect to a business automatically. `robots.txt` and `llms.txt` are advisory hints, not commands.
- **The accuracy check is a controlled test, not market measurement.** It shows that an assistant connected to a business's MCP server can state that business's facts correctly, compared with the same model without it. It does not show how independent shopping assistants rank or describe the business in the wild. No conversion or visibility improvement is claimed.
- **Sample size.** The check is run one question at a time. It demonstrates the method and is not a statistically meaningful benchmark.
- **Stock and prices** reflect the owner's approved record, not a live point-of-sale system.
- **Prototype scale.** This is a hosted proof of concept with example data (Jorge's Auto Parts). It has not been load tested or independently security audited.
- **Audit log viewing.** Applied changes are recorded in the database, and review decisions are shown in the Review queue's audit trail. There is no single viewer for every applied change yet.
- **Demo sandboxes** are anonymous and protected by a per-session cookie, not by user accounts.
- **Live AI features** (plain-language updates and the accuracy check) need an Anthropic account on the server. If the prepaid balance runs out, those features stop while the rest of the site keeps working.

## 9. Sources and credits

- **Team:** Southwestern University, seven students, second year at the HSI Battle of the Brains.
- **Challenge:** "The New Front Door: Trustworthy AI Product Discovery," 2026 HSI Battle of the Brains.
- **Standards and references:** [Model Context Protocol](https://modelcontextprotocol.io/), [llms.txt proposal](https://llmstxt.org/), [Google robots.txt guidance](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt), [Anthropic API documentation](https://docs.anthropic.com/).
- All example business data (Jorge's Auto Parts) is fictional and created for this competition. Product and hero images on the generated storefront are illustrations.
- All application code in this repository was written for this competition.
