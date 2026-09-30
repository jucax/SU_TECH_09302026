# OneBridge Website Modernization Style Plan

## Purpose and boundaries

Extend [DASHBOARD_STYLE_PLAN.md](DASHBOARD_STYLE_PLAN.md) into one coherent visual system for the rest of OneBridge: landing, monitoring, review, account screens, setup, the generated business website, and shared states.

This document guides another build agent. It authorizes no additional product scope by itself. Follow [PLAN.md](PLAN.md) and [POC_GAP_REVIEW.md](POC_GAP_REVIEW.md). Favor a simple, reliable PoC over feature breadth. Modernization should make working behavior clearer and more attractive, without changing API contracts, publication rules, authentication behavior, or tenant isolation.

No new backend services, analytics integrations, paid requests, animations library, UI framework, theme switcher, or external imagery service is needed. Reuse React, Tailwind, existing Button/Card primitives, Lucide, and the existing brand assets.

## 1. Source inventory and relationship to the dashboard guide

Inspected source files at authoring:

| Surface | Current implementation |
| --- | --- |
| Landing | `src/pages/Landing.tsx` |
| Account access | `src/pages/Login.tsx`, `Register.tsx` |
| Business setup | `src/pages/Setup.tsx` |
| Monitoring | `src/pages/Monitoring.tsx` |
| Governance | `src/pages/ReviewQueue.tsx` |
| Generated public business site | `lib/generate/site.ts`, served through `api/site.ts` |
| Shared visual primitives | `src/components/ui/button.tsx`, `card.tsx`, `src/index.css` |
| Unavailable/not-found states | `src/pages/Placeholder.tsx` and actual router configuration |

These files establish current frontend structures, not production correctness. Read them and `src/App.tsx` again before editing because implementation is progressing.

Login, Register, and Setup now exist as actual components. The earlier dashboard guide describes their routes as placeholders based on its earlier snapshot. Use current source and router behavior to establish status; do not discard working account/setup screens because of that historical description.

The dashboard guide owns shared color values, type scale, spacing, responsive navigation, accessibility, and dashboard shell. This document supplements it. Do not create a competing palette or duplicate style system.

## 2. Shared aesthetic language

The desired appearance is a clear, polished small-business service:

- Soft neutral page background and white surfaces.
- Navy headings with readable secondary text.
- Blue for AI connections and interactive details.
- Orange used selectively for the human-facing brand and landing CTA.
- Consistent 16px card corners, restrained borders, and low-opacity shadows.
- Comfortable spacing and deliberately limited decoration.

Use the existing logo files without redrawing or distorting them. Use Montserrat if already loaded, with the existing system fallback. Avoid remote font dependencies as a prerequisite for the demo.

### Shared controls

Use 44px-high primary controls, 10px corners, 14 to 16px input text, clear labels, and a visible keyboard-focus ring. Reserve pills for small status badges; not every input or button needs a capsule shape.

Current Button styling uses orange with white text. Verify contrast before reusing it broadly. An orange fill with navy text, or a darker verified action color, may provide a better accessible landing CTA. Dashboard and account actions can use navy or accessible action blue. Avoid changing existing variant names or semantics unexpectedly; check all consumers when refining shared primitives.

Cards should have a consistent heading/body rhythm, not a different shadow and radius on each page. Use semantic heading levels: existing CardTitle renders an `h3`, so ensure pages do not skip meaningful heading hierarchy or add a small optional heading-level facility if necessary.

Use actual links for navigation and buttons for actions. Keep a single primary action per local decision. Do not create menus, links, or badges that imply missing capabilities.

## 3. Landing page

### Outcome

Within a few seconds a judge should understand the product, see how to try it, and locate proof. The current page centers a large logo and explanatory paragraphs. Modernize its composition without expanding the marketing site into many pages.

### Layout

```text
Header: OneBridge logo                          Log in / Set up business

Hero, two columns on desktop:
  One trusted foundation.                     Website for people
  Two connected front doors.                  [simple product preview]
  Short explanation and main demo CTA          MCP for AI assistants
  Secondary setup link                        [small structured-data preview]

Three concise proof points:
  Current business facts | Answer checking | Owner control

For judges:
  Open demo | Website | MCP details | Accuracy checks | Source repository

Footer: Product framing, source link, honest prototype status
```

Main width approximately 1120px, horizontal padding 24 to 32px, hero vertical padding 56 to 80px desktop. At mobile sizes, stack text then visual, reduce padding to 24 to 40px, and let CTAs fill the width.

Suggested hero copy:

> One business. Two connected front doors.
>
> Manage approved business information once, then use it for your website and a connection compatible AI assistants can access.

Retain the existing recognizable demo CTA: “See it work: Jorge's Auto Parts.” The fixed plan gives this CTA priority. Do not replace it with a vague “Get started.”

The right-hand visual may reuse a lightweight preview component or static example markup. Before a tenant is loaded, label illustrative values as “Demo example.” Never call this a live tenant view or fetch paid AI results on page load. Do not use a screenshot containing tiny, unreadable text as the main product explanation.

### Supporting content

Use three compact proof points tied to actual behavior rather than generic marketing claims. Do not add customer logos, testimonials, invented statistics, guaranteed AI placement, or pilot goals presented as achieved results.

Keep “For judges” visibly distinct as a practical evidence panel. Links to canonical demo website/MCP are appropriate when explicitly labeled as the reference business. Interactive monitoring should use the visitor's actual demo context. If a context-dependent destination requires starting a demo first, guide through the existing start action instead of leaving judges on a no-business error screen.

Use a plain description such as “Connected AI accuracy check” where the current test is a controlled MCP comparison. Do not imply it measures organic visibility across assistants.

Retain real demo-start pending/error states. Disable repeat submissions, preserve an understandable failure message, and allow a deliberate retry. No fake loading percentages.

## 4. Monitoring page

### Outcome

Make the experiment understandable and evidence inspectable. Its purpose is not to create a visually predetermined victory for the MCP panel.

Use the shared dashboard shell and active tenant context. Header: “Accuracy check,” business name, and a short explanation. Place one compact methodology note below it:

> Same question, same model, same shared settings. One answer can use this business's MCP tools; the other cannot.

Only state that this is true when verified in the implementation. Display the actual selected model when the result/API supplies it; do not introduce a dynamic model selector for styling.

### Before a run

A white prompt card has a labeled field and “Run comparison” action. Use a textarea if questions become long. An optional “Use example” action merely populates the field, using a real product. No automatic paid call on navigation.

The empty results area explains what will appear: two answers, checkable facts, and tool evidence. Avoid blank cards that look like broken loading.

### After a run

Two equal-size cards display:

1. Panel label: Without MCP / With MCP.
2. Actual answer text in readable normal typography, without mandatory italics or decorative quotation marks around the whole response.
3. Compact summary of correct, incorrect, and unverifiable claims.
4. Field-level evidence table.
5. Tool evidence, where applicable, in a native `details` disclosure.

Keep both panels equally readable. Use subtle blue to identify the connection, not bright green to imply every connected answer is correct. Accuracy may differ from expectations.

The diff table should display field as well as subject so a price mismatch is distinguishable from availability or compatibility. Use text labels “Matches,” “Mismatch,” and “Not verifiable” with status icons/color. Preserve unknown source values explicitly.

For zero verifiable claims, display “No verifiable claims to score” rather than presenting a misleading percentage. If current API scoring behavior differs, flag that as a correctness issue for separate review; CSS alone does not fix scoring.

At narrow widths stack panels, provide within-panel table overflow or stacked evidence rows, and avoid horizontal page scrolling. Tool JSON should be escaped/rendered as text, use monospace, and wrap or scroll in its own region.

Pending state disables duplicate runs. Error state identifies the failed operation without fabricating a partial score. Preserve entered prompt. A stored result, if shown, must be labeled as a previous run, not as fresh monitoring.

## 5. Review queue and audit trail

### Outcome

Owners should understand why a change paused, what they are deciding, and what happened afterward.

Use the dashboard shell. Header: “Review changes,” with the business name and actual pending count. Place a short explanation above the list: “Some changes need your approval before publication.” Avoid oversized warning banners for ordinary governance.

Pending items are white cards with a restrained amber status badge. Show the actual summary, rule in business language, submitted instruction if available, and submission time. Show before/after values only when the response provides them. Do not infer or synthesize a diff from a prose summary.

Use “Approve change” and “Reject” as distinct actions. Preserve the existing decision handler and rules. Do not add an extra confirmation modal for every action or introduce undo when the backend has no undo capability. During a decision disable appropriate conflicting actions, announce the outcome, and refresh the list.

Rule labels should describe actual supported rules. Do not add ACT/ESCALATE/MFA badges unless corresponding behavior exists.

The audit section is a clean list with separators: summary, decision, actor, timestamp. Unknown actor values should be rendered honestly. Do not imply an individual identity if the data only identifies a demo session.

Empty state: “Nothing waiting for review.” After a successful decision the pending count and list should agree. A loading/error response must not be mistaken for an empty queue.

## 6. Login, registration, and email confirmation

### Outcome

Account screens should feel consistent and trustworthy while remaining straightforward. This is a visual pass; preserve current authentication, redirects, session handling, and confirmation behavior.

Use a shared public header and a centered form card around 420 to 460px wide. On a wide screen an optional quiet text panel can repeat the two-front-door framing, but the form must work independently. Avoid adding a large decorative illustration or a second marketing experience.

Use visible labels for business name, email, and password, not placeholders alone. Set appropriate browser autocomplete attributes. Keep the actual password requirements, with a concise hint; do not promise a security standard not implemented.

Login heading: “Welcome back.” Registration heading: “Set up your business.” Keep existing submit actions and links to the other account screen. Include a landing/demo link so judges can return without signing up.

Pending labels are specific: “Logging in...” and “Creating account...”. Keep errors inline and accessible. Do not display account success until the actual operation completes.

Email confirmation gets a deliberate success-style screen with a mail icon, entered email, and the existing next step to log in after confirmation. Do not add resend, password reset, social login, or MFA controls unless those flows already work. Avoid claims such as “Your business is live” at account creation.

Mobile forms use full-width fields and buttons with generous top/bottom spacing and remain usable with the onscreen keyboard. The page should scroll rather than crop on short screens.

## 7. Business setup

### Outcome

Make the existing form/CSV setup easy to scan while preserving owner review before publication. No PDF, XLSX, repository import, or automatic AI cleaning claim should be introduced by the design if not implemented.

The inspected setup screen currently supports manual products, CSV parsing, hours, optional policies, and a final publish action. Preserve this narrow flow.

### Layout

Use a compact public/setup shell rather than a dashboard navigation rail that suggests the business is already published. Main content width around 900px.

Header: “Prepare your business information.” Helper: “Review your information before it goes live.” Use numbered section headings as visual grouping, not a newly implemented multi-page wizard:

1. Products.
2. Hours.
3. Policies.
4. Review and publish.

Keep the existing business-name creation step when needed. Do not add Back/Next navigation that loses current local state or requires a persistence feature.

### Products

Group manual entry in a compact labeled form. Show price currency explicitly according to actual supported behavior. The current manual-entry implementation uses USD; do not silently make the UI look multi-currency if it is not.

Use a clear CSV upload button with a file icon and a short schema hint. A visually bordered upload region is acceptable, but it must not say “Drag and drop” unless drag/drop is implemented. Keep native file-selection accessibility.

Show parse errors as a readable list with row numbers. Label added products as draft information. If accepted and rejected counts are not supplied, do not invent them. Prevent the visual design from hiding errors below a collapsed region.

A sample CSV download is optional only if a valid static fixture aligned with the actual parser can be provided cheaply. It should not expand into an import-template system.

Keep remove actions clearly labeled and keyboard accessible. Do not add inline editing or complex bulk tools solely for visual polish.

### Hours and policies

Arrange day, closed checkbox, and opening/closing inputs in aligned rows on desktop and stacked blocks on mobile. Every time field needs a day-specific accessible label. Current default hours are draft defaults; present them for owner review rather than suggesting they were supplied by the business.

Policy fields have visible labels and “Optional” hints. An empty policy does not mean “No returns” or another inferred policy.

### Review and publish

Place a distinct final white card with a clear summary and the actual product count. Remind owners that publication shares information publicly through the website and MCP connection. Show key draft information or let owners review the visible sections above; do not claim a comprehensive independent verification.

Use “Publish approved information” or the current publish label with explicit confirmation text. Keep publication tied to the existing deliberate action. Any new required checkbox changes the interaction and must be treated as a small explicit behavior choice, not silently introduced as styling.

Do not automatically publish on upload, field blur, account creation, or a step indicator click. Preserve input and errors if publication fails. No fictional deployment progress phases.

## 8. Public business website

### Outcome

The public page should look like a credible local business catalog, not an internal admin screen. It should make products, availability, compatibility, hours, and policies easy to find.

The current business site is generated as server-rendered HTML in `lib/generate/site.ts`. Preserve that architecture. Facts must be present in the HTML with JavaScript disabled. Do not replace it with a React-only storefront, embed the dashboard, or add a required client-side hydration layer for styling.

### Layout

```text
Business header: Actual business name           Products / Hours / Policies
Intro: Current product information, without invented merchant claims

Product catalog, dominant column                Business information
  Product name                                  Hours
  Supplied compatibility                        Policies
  Description, if supplied
  Price and availability

Footer: Powered by OneBridge | structured information / connection links
```

At desktop widths use approximately 1040 to 1120px maximum content width, with a dominant catalog column and a smaller hours/policies column when content permits. On mobile stack the catalog and business information. Provide simple anchor links to sections using normal HTML.

Use a navy business header with restrained branding or a white header on the neutral canvas. Keep OneBridge branding secondary: the page represents the merchant. Do not invent a business logo, slogan, years of experience, star rating, contact details, or location if the record does not contain them.

Product entries can be clean white cards or separated rows. Do not create a product-photo grid when no real images exist. Present compatibility directly beneath product name, prices in tabular numerals, and availability as text with a small status treatment. Preserve descriptions and policy text, wrapping long content.

Do not add Buy, Add to cart, Reserve, Call, or Directions actions unless the actual target or capability exists. This PoC demonstrates published information, not payment processing.

### Information honesty

Use footer copy such as “Published from business-approved information through OneBridge.” The current wording “kept accurate” can suggest a guarantee beyond owner approval and formatting checks. Do not imply independent truth certification.

An update timestamp may be shown only if the actual data supplies one; never use the current render time as a last-business-update timestamp. Missing facts remain unknown.

### Implementation safeguards

Style with existing inline/server-side CSS or a small shared static stylesheet. Tailwind classes in generated strings are not automatically styled unless the deployed stylesheet contains those rules. Ensure the site works independently of the SPA's build assumptions.

Preserve HTML escaping for every merchant-supplied value, safe URL handling, machine-readable facts, and the structured-data payload. Check JSON-LD serialization for safe embedding; do not introduce raw merchant content into HTML/script contexts. A styling pass should not change data types, availability meanings, or schema.org facts.

Keep discovery and MCP links working for the current tenant. `llms.txt`, `robots.txt`, and the MCP protocol route are machine-facing resources; do not wrap them in decorative HTML or change their content types to make them look like pages.

## 9. Global feedback, unavailable routes, and footer

Replace developer-facing placeholder copy on visitor-facing routes with a concise honest message, for example “This part of the prototype is not available yet.” Keep a useful back/demo link. Use a proper “Page not found” screen for unknown routes rather than exposing slice IDs to users.

Use consistent loading, empty, and error treatments across surfaces:

- Loading: stable card placeholders or a simple status message.
- Empty: explain the next existing action, without fake content.
- Error: describe the failed operation and a real retry/back option.
- Success: confirm the actual completed event, not a larger inferred outcome.

Keep status text visible and announce it appropriately. Never rely exclusively on red/green. Do not insert alerts that claim product security, availability, or regulatory compliance without evidence.

Public footers should be compact: OneBridge framing, actual repository link where helpful, and accurate prototype status. Do not add Privacy, Terms, Support, or pricing links to missing pages. Do not invent legal documents through a styling task.

## 10. Implementation sequence and limits

1. Refine shared tokens and controls, checking every consumer.
2. Modernize Landing while preserving demo-start behavior and judge access.
3. Apply the dashboard shell and evidence hierarchy to Monitoring and Review Queue.
4. Restyle the generated business site without changing server rendering.
5. Restyle account/setup surfaces if retained and working within the fixed plan.
6. Refine shared feedback, not-found screens, and responsive/accessibility behavior.

Do not wait for every screen to be redesigned before checking the hosted demo. Make small, reviewable changes and verify working journeys after shared-component changes.

If time is limited, prioritize the landing-to-demo path, the business website, monitoring readability, and review decisions. Defer decorative hero visuals and account-screen embellishment before correctness or submission readiness. Keep the original build-plan cut order authoritative.

## 11. Verification for the implementing agent

- Build and TypeScript checks pass.
- Landing demo CTA creates/opens the correct sandbox; errors and duplicate-click prevention remain functional.
- Internal dashboard links preserve tenant context; public reference links are clearly distinguished.
- Monitoring questions/results remain readable at 320px, 390px, 768px, and desktop widths.
- Evidence tables show field and source values; no baseline result is visually or numerically fabricated.
- Review actions still route correctly and update the actual queue/history.
- Account, email-confirmation, and setup flows retain current behavior and do not publish early.
- CSV errors and publication failures remain visible and preserve owner work.
- Business pages show all published facts in view-source with JavaScript disabled.
- Server-rendered CSS is present in the deployed page and does not depend on missing SPA utilities.
- Merchant names containing quotes, markup characters, and long text remain safely rendered.
- All meaningful buttons/links work; no dead controls are added.
- Text contrast, keyboard focus, labels, touch targets, heading order, and reduced motion are checked.
- No real-looking invented metrics, merchant claims, reviews, or transactions appear.
- Production walkthrough still completes after modernization.

## Instruction to the build agent

Make existing behavior feel cohesive, readable, and deliberate. Treat aesthetics as a way to explain the product, not a reason to expand it. When a design element requires unsupported functionality, simplify or omit it. A calm, trustworthy website with a reliable demonstration is the target.
