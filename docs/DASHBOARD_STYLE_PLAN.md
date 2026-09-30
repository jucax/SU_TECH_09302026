# OneBridge Dashboard Style Plan

## Goal and implementation boundary

Build an attractive, calm dashboard inspired by the user-supplied dashboard image. The design should make “one information foundation, two digital front doors” immediately understandable while supporting the existing reliable PoC.

This is a visual implementation guide for another agent, not a replacement for [PLAN.md](PLAN.md). Preserve existing API contracts, tenant selection, governance routing, and working interactions. Do not add backend features, routes, paid calls, or fabricated metrics simply to match the image. Apply the recommendations from [POC_GAP_REVIEW.md](POC_GAP_REVIEW.md).

Deliver a usable application interface, not an image of a laptop containing an interface. The screenshot's laptop bezel, perspective, background, and rendered text artifacts are presentation furniture and should not be reproduced in the app.

## 1. Reference analysis and aesthetic direction

The image succeeds through four clear ideas:

- A persistent brand/navigation rail anchors the page.
- Two equal preview cards explain the human website and AI-facing connection.
- One prominent update field communicates that both are managed together.
- Simple activity cards show the result of maintaining the business's information.

Keep this hierarchy. Improve the execution with restrained shadows, clear typography, consistent padding, sharper icons, readable contrast, and fewer competing blue outlines. The reference is a conceptual illustration; its values and labels are not product requirements.

Aim for a polished small-business workspace: white surfaces, a pale neutral canvas, deep navy typography, blue connection details, and selective orange actions. Use green only for a supported success state. Avoid thick glowing borders, oversized gradients, excessive pills, giant icons, and ornamental charts.

The most important visual connection is that the website preview and structured-data preview refer to the same actual product and price. A successful applied edit should update both visibly. A change held for review must leave both published previews unchanged.

## 2. Current repository baseline

At authoring, the inspected files include:

- `src/pages/Dashboard.tsx`: business header, plain-language update, activity summary, products, hours, and policies.
- `src/pages/Monitoring.tsx`: prompt input, two answer panels, claim tables, and tool-call evidence.
- `src/pages/ReviewQueue.tsx`: pending changes, approve/reject, and decision history.
- `src/App.tsx`: `/dashboard`, `/dashboard/monitoring`, and `/dashboard/review`; setup/auth routes currently point to placeholders.
- `src/components/ui/button.tsx` and `card.tsx`: existing UI primitives.
- `tailwind.config.js`: existing brand colors and Montserrat family.
- `public/brand/logo-primary.png` and `icon-square.png`: existing brand assets.

The code has advanced since the earlier API companion's repository snapshot. This inspection establishes available frontend structures, not deployed correctness. Read the current files again before implementing because other work may continue.

Current data used by Dashboard includes `VerifiedRecord` and an activity summary with MCP counts, updates applied, review counts, last update, monitor count, latest accuracy, latest mismatches, and accuracy trend. Preserve actual field names, especially `priceCents` and the currency-aware price formatter. The reference's `price` field is illustrative and must not replace application contracts.

## 3. Visual tokens

Keep existing brand values; supplement them with accessible interaction and status colors.

| Token | Suggested value | Use |
| --- | --- | --- |
| Brand navy | `#091D3F` | Headings, body text, dark JSON panel |
| Brand blue | `#408EEC` | Illustrative accents, chart stroke, decorative connection details |
| Action blue | `#1D4ED8` | Filled controls with white text, links, focus ring |
| Brand orange | `#F68835` | Small brand accents and human-facing details |
| Action navy | `#091D3F` | Primary update action if consistent with existing buttons |
| Canvas | `#F5F6F8` | Page background, already present as brand gray |
| Surface | `#FFFFFF` | Cards, sidebar, fields |
| Subtle blue | `#EFF6FF` | Active navigation background and update region tint |
| Border | `#DFE6EF` | Card and input boundaries |
| Secondary text | `#52627A` | Descriptions, labels, timestamps |
| Success text | `#166534` | Confirmed success or approved status |
| Success surface | `#F0FDF4` | Success notices |
| Review text | `#92400E` | Pending-review notices |
| Review surface | `#FFFBEB` | Review notices |
| Error text | `#B91C1C` | Failures and invalid input |
| Error surface | `#FEF2F2` | Error notices |

Do not use the lighter brand blue or orange as small white-background body text without verifying contrast. Brand orange is not a universal error color. Verify normal text at 4.5:1 contrast and large text and meaningful UI boundaries at 3:1 before delivery.

Use Montserrat where already available, with the existing Arial/sans-serif fallback. Check whether the font is actually loaded; a font-family declaration alone does not load it. Prefer an available/local font over adding a network dependency. Do not add multiple type families. Use the system monospace stack for JSON.

Suggested scale:

- Page heading: 28px desktop, 24px mobile, weight 700, line-height 1.2.
- Section/card heading: 18px, weight 600, line-height 1.35.
- Body and form input: 14 to 16px, line-height 1.5.
- Supporting label: 12 to 13px, line-height 1.45.
- Metric value: 28 to 32px, weight 700, tabular numerals.
- JSON: 12 to 13px, line-height 1.6.

Spacing uses a 4px base: 8, 12, 16, 20, 24, 32. Card radius: 16px. Input/button radius: 10px. Status badges may use full rounding. Standard card border: 1px. Standard shadow: `0 4px 18px rgba(9,29,63,0.04)`. Use a slightly stronger shadow only for the focused update region or an open overlay.

## 4. Desktop layout

At 1024px and wider, use a 224px sidebar and a fluid content region. Give main content 24 to 32px padding and a maximum width near 1160px. Let it grow naturally; do not compress the whole dashboard into the reference image's portrait proportions.

```text
+--------------------+---------------------------------------------------+
| OneBridge logo     | Business name                    Demo sandbox     |
|                    | Approved information              Last updated    |
| Overview           |                                                   |
| Products           | Website preview        AI connection preview      |
| Website            | Same selected product  Structured approved data   |
| MCP connection     | Open website           View connection details    |
| Accuracy checks    |                                                   |
| Review queue [n]   | Update business information                       |
|                    | Plain-language field              Apply update    |
|                    | Inline result or review notice                    |
|                    |                                                   |
|                    | Activity: requests / updates / review / accuracy  |
|                    |                                                   |
| Tenant context     | Products                    Hours and policies    |
| Back to landing    | Existing verified data      Existing verified data|
+--------------------+---------------------------------------------------+
```

Use a two-column grid for the previews and a four-column grid for the existing activity metrics. Lower content may use a two-thirds products column and one-third hours/policies column if readable. Keep the first desktop viewport focused on the two front doors and update action; the catalog can extend below the fold.

The sidebar can be sticky within normal document scrolling. Avoid independent scroll regions for the sidebar and main dashboard in this small PoC.

## 5. Navigation without expanding the app

The image lists Dashboard, Products, Website, MCP Server, Analytics, and Settings. Adapt these to existing capabilities:

| Visible label | Destination | Rule |
| --- | --- | --- |
| Overview | `/dashboard?slug=...` | Existing dashboard route |
| Products | Product section on Overview | Anchor link; no new CRUD page required |
| Website | Current tenant's `/site/:slug` | Open the real generated site |
| MCP connection | Connection section/details on Overview | Show endpoint and existing tools |
| Accuracy checks | `/dashboard/monitoring?slug=...` | Existing comparison route |
| Review queue | `/dashboard/review?slug=...` | Existing governance route |

Omit Settings until it has a useful implemented destination. Do not add inert menu items or route a live-feature label to a generic placeholder. Review queue deserves a visible place because governance is a central PoC claim.

Preserve tenant context on every internal link. Never substitute the canonical Jorge slug for the visitor's active demo tenant. Active navigation uses a pale-blue surface, dark blue text, and a narrow left indicator. Use `aria-current` for actual page navigation; an external Website link is not an active dashboard route.

Use Lucide icons already installed: `LayoutDashboard`, `Package`, `Globe`, `Server`, `Activity`, `ClipboardCheck`, `ArrowUpRight`, `Copy`, `Check`, `Clock`, and `AlertCircle`. Standard navigation icons are 20px; preview header icons may be 22px. Mark decorative icons hidden from assistive technology.

Keep the existing logo proportions with `object-contain`, approximately 140 to 160px wide. Do not redraw the logo or stretch it.

## 6. Business header

Use the actual `record.profile.name` as the heading. Supporting copy: “One information foundation. Two connected front doors.” Add last-update information when available.

Show “Demo sandbox” only when the session is known to be a demo. If current data does not establish that status, add no blanket badge that could mislabel a registered business. Do not display “Live” or “Connected” based solely on constructing an endpoint URL.

Keep tenant slugs and other technical identifiers secondary, in connection details rather than beside the main heading. An approval badge needs actual approval state or a precise explanation of what the record represents.

## 7. Paired preview cards

### Website preview

Title: “Website for people.” Description: “Your published business information.”

Use a lightweight HTML mini-preview inside the card, not a screenshot service or iframe. A small browser-style top bar, business name, and one real product are enough. Reuse the existing currency formatter and availability labels.

Prefer an existing product image if the record supplies one. Otherwise use a neutral product icon or restrained placeholder with text. Do not add remote stock photography or imply a placeholder photo belongs to the merchant.

Primary card action: “Open website,” with external-link affordance. The preview must reflect current approved data, not a hardcoded rotor or reference-image price.

### AI connection preview

Title: “MCP for AI assistants.” Description: “Structured information from the same record.”

Use a navy JSON panel with light text, subtle syntax colors, and rounded corners. Show a small JSON serialization of the same selected product. Use an explicit adapter for display if needed, but label the panel “Approved data preview.” Do not claim it is the exact MCP tool response unless it is obtained from that tool.

A suitable display includes product name, formatted or explicitly unit-labeled price, availability, and compatibility when supplied. Unknown compatibility remains unknown. Keep JSON valid through `JSON.stringify`, not manually assembled HTML.

Use the first available product as the default in both cards. No product selector is required. If there are no products, both cards show a corresponding empty state.

Provide connection details with the actual tenant endpoint and the existing supported tool names. Copying the endpoint should give temporary “Copied” feedback and handle failure. Opening the raw MCP URL in a browser does not prove a successful protocol connection.

### Shared editing affordance

The image places “Edit with AI” below both previews. This app has one source of truth, so prefer a shared helper above the update box: “Update once. Keep both front doors aligned.”

If retaining edit buttons in both cards, both should focus the same update field. They must not suggest independent edits to website HTML or MCP code. Avoid a separate modal or duplicate form.

## 8. Update region

Use a pale-blue surface or a white card with a narrow blue accent, 20 to 24px padding, and a clear heading: “Update your business.” Supporting copy: “Describe a change. Routine updates apply; material changes go to review.” Match this copy to actual backend behavior.

Use a properly labeled textarea instead of a pill-shaped single-line input for long instructions. Suggested height: 88px, maximum growth around 160px. Preserve multiline typing. For a textarea, Enter inserts a line break; do not silently submit on Enter. A visible “Apply update” button is sufficient.

The placeholder may reference an actual product if available. An optional “Use example” button only populates text; it never submits. Do not assume the brake rotor exists in every tenant or that low-stock has a supported representation.

Keep the existing structuring and apply handler behavior during this visual pass. A proposal-confirmation redesign is separate functional work, not an implicit part of styling.

States:

- Idle: empty field and disabled apply button.
- Pending: disable repeat submission, retain text, label button “Applying...”. Use only phases the frontend can actually observe.
- Applied: green notice with the actual returned summary; refresh approved data and activity.
- Held for review: amber notice, actual summary, link to the existing review queue; published previews remain unchanged.
- Failed: red notice with understandable message; preserve input for correction/retry.

Do not use a lock icon to claim encryption, MFA, or safety guarantees. A small information or edit icon is enough. Use an inline `role="status"` success/review notice and an appropriate error announcement. Do not communicate outcomes through color alone.

## 9. Activity section with honest metrics

Keep the reference's clean metric-card style, but use existing measured fields:

| Card | Existing value | Supporting text |
| --- | --- | --- |
| MCP requests | `mcpRequestCount` | “Recorded tool requests” |
| Updates applied | `updatesApplied` | “Approved information changes” |
| Pending review | `reviewCounts.pending` | Link to review queue |
| Latest accuracy | `latestAccuracyScore` | Include check count; describe as the controlled check |

Use 20px icon containers, small labels, prominent tabular values, and one short helper line. The cards should not all look like primary buttons.

Do not copy the image's 12,482 visits, 3,921 calls, 18% growth, or 42% growth. Website visits are not in the inspected activity summary. Do not add a visits card unless real measurement already exists. A request count is not a unique-user count or conversion rate.

Do not include a “Last 30 days” dropdown unless the backend actually filters the selected period. Use the real current measurement window if known; otherwise use “Recorded activity” without inventing a window.

Show zero for a measured zero. Show “Not available” when the request failed. Show “No checks yet” for a null accuracy value. Do not turn missing data into zero or a score into proof of organic visibility.

Keep the existing lightweight SVG accuracy sparkline only when at least two valid readings exist. Give it a visible label and accessible textual description. No synthetic uptrend, animation, or chart library installation is required for this style pass.

## 10. Products, hours, and policies

Keep all existing business information accessible below the overview. A compact product table on desktop can show name, compatibility, price, and availability. On mobile use stacked rows with clear labels.

Use subtle horizontal separators rather than a grid of heavy borders. Preserve formatted prices and explicit currency. Use “Unknown” or “Not provided” where applicable rather than visually hiding missing facts. Do not convert missing stock information into unavailable.

Keep hours and policies in smaller cards. Policy bodies use readable line length and normal sentence case. Long content wraps naturally. Do not truncate critical policy or compatibility information without an accessible expansion.

No product CRUD workflow, drag-and-drop upload, search indexing, or bulk editor is required by this style guide.

## 11. Shared appearance for Monitoring and Review Queue

Reuse a common dashboard shell so navigation, spacing, and tenant context remain consistent. Prefer composition through a `DashboardLayout` component; preserve existing route and data-loading behavior.

Monitoring retains its side-by-side answer panels on wide screens and stacks them on narrow screens. Use neutral styling for the baseline and a subtle blue connection treatment for the MCP panel. Do not make baseline styling imply it must be wrong. Match/mismatch/unknown states need text labels alongside color. Tool evidence can be a native expandable details section to avoid clutter.

Review Queue uses the same card typography. Pending cards are lightly amber-tinted, with actual rule and summary. Approve/reject actions remain visibly distinct and disabled during a decision. The audit trail stays a readable list with status, actor, and timestamp. No new timeline visualization is necessary.

## 12. Responsive behavior

| Width | Layout |
| --- | --- |
| 1024px and wider | 224px sidebar; two previews; four metrics |
| 768 to 1023px | Compact top navigation; two previews if readable; two-by-two metrics |
| Below 768px | Brand/header above content; wrapping navigation; stacked previews; two metrics per row |
| Very narrow screens | One metric per row if two columns force awkward wrapping |

For the reliable PoC, use a visible wrapping top navigation on smaller screens instead of building a drawer with complex focus handling. Keep navigation targets accessible without horizontal page scrolling.

Page padding: 16px mobile, 24px tablet, 32px desktop. Mobile buttons fill available width where helpful. JSON may scroll horizontally within its panel, but the page itself must not overflow. Use `min-width: 0` on grid children. Break or scroll long endpoint URLs inside their own container.

## 13. Loading, empty, and failure states

Use the same shell for loading and errors whenever tenant context is available. Reserve card geometry with simple skeleton blocks rather than flashy shimmer. Respect reduced-motion preferences.

- No tenant: existing “Start demo” or landing link, no fake business preview.
- Record loading: static placeholder cards, no invented products or metrics.
- Record failure: clear error and explicit retry/back action.
- Activity loading: placeholder values with labels.
- Activity failure: “Activity unavailable” with retry; do not silently hide the entire section forever.
- Empty products: “No products published,” consistent in both previews and catalog.
- No monitoring history: “Run an accuracy check” linking to the existing page.
- No pending review: calm “Nothing waiting for review” state.

Keep independent failures local. An activity fetch failure should not erase a successfully loaded catalog. A failed AI request should not clear approved data.

## 14. Accessibility and interaction polish

Use semantic `nav`, `main`, headings, labeled form controls, buttons, and links. Include a skip-to-content link. One page heading per view. Preserve visible keyboard focus, with a 2px ring and offset. Aim for 44px touch targets.

Use text and icons together for important statuses. Endpoint-copy controls need accessible names. Announce mutation results without repeatedly announcing every metric refresh. Keep layout stable while notices appear where practical.

Subtle hover changes may last 120 to 180ms. No parallax, bouncing icons, count-up animations, confetti, or animated chart entrances. Disable transition effects when reduced motion is requested.

## 15. Suggested frontend structure

Names below are suggestions; do not create an elaborate design framework:

```text
src/components/dashboard/
  DashboardLayout.tsx
  BusinessHeader.tsx
  FrontDoorPreviews.tsx
  UpdateBusinessCard.tsx
  ActivityCards.tsx
```

Only extract components that simplify the existing page. Keeping smaller pieces local is acceptable. Continue using existing Button/Card primitives and Lucide. Keep data fetching and mutation contracts intact. Do not add a state-management library, chart library, modal library, or theme switcher for this task.

Suggested implementation order:

1. Shared visual tokens and shell, preserving all current routes.
2. Business header and live paired previews derived from the existing record.
3. Style the existing update action and its result states.
4. Restyle existing measured activity cards and lower business details.
5. Apply the shell to monitoring and review pages.
6. Responsive, accessibility, and actual interaction checks.

Apply this work within the existing frontend slices or an explicitly authorized polish change. Do not reorder backend milestones. If time is tight, complete the shell, paired previews, and update feedback first; preserve working detail screens even if they remain visually simpler.

## 16. Acceptance checks

The agent implementing this should verify:

- Desktop at roughly 1440px and 1024px, tablet at 768px, mobile at 390px, and narrow mobile at 320px.
- Logo is undistorted; type and padding are consistent; there is no horizontal page overflow.
- Both previews use the same real product, formatted price, and approved record.
- Internal links preserve the active tenant; website and MCP details point to that tenant.
- A successful update refreshes both previews and the actual activity values.
- A queued change does not appear published before approval.
- Failed updates retain the owner's input; repeat submission is disabled while pending.
- Activity failure, zero values, null accuracy, and empty products look intentional and honest.
- Navigation, update input, copy endpoint, and review links work with a keyboard.
- Long product names, policy text, and endpoint URLs remain readable.
- No invented metrics, unsupported status badges, dead Settings links, or fake trends appear.
- The repository's normal TypeScript/build check passes after the visual changes.
- The hosted five-minute demo still works after styling.

A static screenshot can check aesthetics, but cannot establish functionality. Use actual interactions and the production URL for final validation. Avoid adding tests that only assert CSS classes; prioritize the existing tenant/update/review flows and meaningful regressions.

## Final direction for the build agent

Use the image as a composition reference: sidebar, paired front doors, one update surface, and simple activity cards. Use the repository as the source for brand colors, data, behavior, and implemented capabilities.

The desired result is a clear, polished dashboard that makes the existing PoC easier to understand. Preserve reliability, tenant isolation, truthful metrics, and governance behavior. If a visual feature needs a new backend capability, defer it and keep the interface simpler.
