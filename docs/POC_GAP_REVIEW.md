# OneBridge PoC Gap Review

## Purpose

This is a review for discussion with another agent, not an approved scope expansion or a replacement for [PLAN.md](PLAN.md). Keep the fixed build sequence, cut order, architecture, and existing commitments. Use [CLAUDE_API_INTEGRATION.md](CLAUDE_API_INTEGRATION.md) as the API implementation companion.

The guiding preference is a simple, reliable hosted PoC. A few working behaviors with honest evidence are more valuable than many fragile features. Most findings below can be addressed through precise labels, documentation, existing demo data, and acceptance checks. Do not treat every suggestion as a feature to implement.

## Evidence and limits

This review compared the local plans with:

- [Main competition Google Doc](https://docs.google.com/document/d/1J52F6s-fOM0Pto4xlnGce4epC1gpjgPG_rpQVK8Yr8A/edit), including its later consolidated solution, governance, marketing, financial, and pilot sections.
- [Official HSI BOTB case PDF](https://drive.google.com/file/d/1ZjY0_9HMRcFTLzd5rri7KPwdIMQ4Gwow/view), including challenge, submission instructions, and judging rubric.

The main Google Doc contains brainstorms as well as polished sections. Earlier ideas are not automatically current commitments. Separate Tech, Executive Summary, and Business Plan Docs returned no readable content through the connector, so this review cannot establish the content or status of actual submissions. Do not silently revise submitted commitments based on this review.

This is a comparison of plans and promises, not a verification that proposed functionality is implemented or deployed. Confirm repository and hosted behavior before labeling anything built.

## Core finding

The build plan provides a strong foundation for verified business data, real MCP access, controlled answer checking, and human governance. The larger product narrative also promises visibility monitoring, understandable reporting, issue correction over time, and measurable business value.

The PoC should demonstrate the narrower behaviors it can reliably prove and explain the remaining pilot work. It does not need to prove the entire business model during the competition.

The essential demo remains:

1. Open a fresh Jorge demo tenant.
2. View the approved business facts and generated website.
3. Retrieve those facts through that business's actual MCP endpoint.
4. Make one supported plain-language update and observe consistent data.
5. Run a controlled answer comparison with visible facts and tool evidence.
6. Trigger one material change, review it, and inspect the audit trail.

If this path is unreliable, pause optional work and stabilize it. Preserve the README and recorded fallback.

## Priority 0: Submission timing and packaging

### Finding

The official PDF contains a deadline conflict: the main schedule says September 30 at 7:00 AM CT, while the technical submission instructions say 7:00 AM ET. `PLAN.md` assumes CT.

### Recommendation

Verify the deadline with organizers. Until clarified, plan to submit by 6:00 AM Chicago time, the earlier interpretation. This is a risk-management recommendation, not a claim that the organizers confirmed that deadline.

Check the official naming convention, cover-page requirement, citations, public repository access, production links, and submission receipt. A `run.sh` is recommended in the case instructions, not presented here as mandatory. Follow clarified official instructions if they differ.

### Scope impact

No app feature required. Do not sacrifice submission time for optional UI or ingestion work.

## Priority 1: Clarify what the monitoring comparison proves

### Promise and gap

The Google Doc describes AI Inclusion Rate and a free AI Visibility Check. M8 compares an answer without MCP against an answer with the business's MCP connected. That can demonstrate accurate access through a supported connection. It does not, by itself, establish that independent shopping assistants discover or recommend the business organically.

### Minimum response

Use precise labels in M8 and M12:

- Connected-client factual accuracy: measured by the controlled PoC.
- Sampled AI visibility: measured only if an actual defined prompt sample is run under an appropriate discovery setup.
- Broad visibility improvement, conversions, and cross-platform effects: pilot goals unless supported by evidence.

An inclusion metric for an explicitly connected test must be labeled as inclusion within that test. Do not call it general market visibility.

### Optional work

If M8 is already stable, reuse a small fixed set of customer-style prompts. This does not require a second provider or a new marketing funnel. Otherwise, document the pilot methodology instead of adding a new feature.

## Priority 1: Make the experiment fair and reproducible

### Finding

M8 correctly calls for the same model, prompt, and shared settings. However, the plan's verification wording expects the no-MCP panel to miss or misstate facts and the MCP panel to be correct. Desired output differences should not be an acceptance requirement.

### Minimum response

Judge the implementation by whether:

- Both branches run under the documented shared conditions, differing in MCP access.
- The connected branch has evidence of actual MCP tool calls when used.
- Claims are compared against the same captured source record for the run.
- Correct answers, mismatches, unsupported claims, and abstentions are handled honestly.
- Failed or incomplete runs are not presented as valid scores.

The baseline may answer correctly or abstain. Preserve that result. Do not rerun selectively until a favorable contrast appears.

Show the prompt, answer, relevant source facts, and timestamp. Define the score denominator. A small visible evidence table is sufficient; do not build an evaluation platform.

### Scope impact

Primarily acceptance criteria and reporting within M8/M12. No new milestone. This document recommends clarifying verification without editing the fixed plan automatically.

## Priority 1: Make the correction journey visible

### Promise and gap

The Docs describe monitoring, detecting, acting, measuring, and repeating. M7, M8, and M9 contain the pieces, but the plan does not explicitly show how an observed issue leads to an action and a subsequent check.

### Minimum response

Use the existing screens in a documented walkthrough:

1. Run a check and inspect a discrepancy, if one is actually observed.
2. Determine whether the source data is wrong, incomplete, or correct but misrepresented externally.
3. Apply or review an appropriate source correction only when justified.
4. Rerun the check and compare evidence.

Do not change correct merchant data merely to make an assistant's answer look correct. If the source is already correct, document the external discrepancy and the limit on OneBridge's control.

### Optional work

Only if the existing slices are stable, add a lightweight issue status and link to the relevant review action. If this requires a new workflow or significant persistence changes, defer it. A documented manual sequence is enough for the PoC.

Do not mark an external issue resolved merely because a source record was updated. Resolution requires follow-up evidence within the measured test.

## Priority 1: Match governance claims to implemented behavior

### Promise and gap

The consolidated Google Doc describes four levels: ACT, VERIFY, ESCALATE, and BLOCK. ESCALATE includes owner intervention and multi-factor authentication. M9 mainly specifies routine versus material classification and approve/reject actions.

### Minimum response

| Level | Narrow PoC interpretation | Evidence or limitation |
| --- | --- | --- |
| ACT | Apply a permitted routine update and record it | Existing M7/M9 behavior, after verification |
| VERIFY | Hold uncertain or material changes for owner review | Existing M9 review queue |
| BLOCK | Reject unauthorized or prohibited requests | Demonstrate an actual rejection if supported; do not claim fraud detection from authorization alone |
| ESCALATE | Consequential change requires stronger intervention | Planned unless the specific escalation and authentication behavior exists |

Do not add MFA just to fill the fourth label during the competition. Explain the implemented subset honestly. Model output must not authorize writes or override deterministic rules.

### Scope impact

Existing rules, validation, audit evidence, and documentation. No broad governance framework, fraud classifier, or new authentication milestone.

## Priority 1: Explain what verified means

### Promise and gap

The Docs distinguish merchant-approved information, system-validated information, and externally observed AI answers. The plan commonly refers to a verified record. Without explanation, judges may think OneBridge independently proves every merchant statement.

### Minimum response

Use a short definition visible in the demo and README:

> Verified in this PoC means approved by the business owner and checked for supported formatting and consistency. It does not mean independently certified as objectively true.

Show the owner approval and last update using available information. Keep externally observed answers separate from approved business facts. Never label demo data as confirmed by a POS system that is not connected.

### Optional work

Source references and field-level provenance are valuable if already supported by the data model. Do not undertake a broad schema redesign for this review. Document missing provenance as a pilot improvement when necessary.

## Priority 2: Connect the demo to Maria's actual problem

### Finding

The story emphasizes harm from buying an incompatible auto part. The planned interactive edit emphasizes a price change. The demonstration could connect more directly to the customer story using the existing MCP and monitoring tools.

### Minimum response

Use existing verified seed facts to ask a compatibility question. Include a supported match and an unknown case if the current schema supports compatibility. The answer should preserve missing information rather than invent a match.

### Boundary

Do not add a vehicle fitment database, automotive recommendation engine, or safety certification. If compatibility is not modeled, acknowledge that limitation and use the existing price/availability example reliably. This is a demo-data and prompt suggestion, not a new product requirement.

## Priority 2: Define measurable outcomes without pretending the pilot has happened

### Promise and gap

The Docs identify inclusion, factual accuracy, critical mismatches, correction rates, time to resolution, and business impact. M10 has request counts, freshness, inconsistencies, and an accuracy trend. Some product KPIs therefore remain outside the demonstrated scope.

### Minimum response

For every displayed metric, document:

- What event or claim is counted.
- Numerator and denominator, where applicable.
- Sample size, time window, and test conditions.
- Whether it is measured, a sample illustration, or a future target.

The Doc's at least 95% factual accuracy, fewer than 5% critical mismatches, and at least 80% correction targets are pilot goals, not achieved PoC results.

Customer trust, conversions, and revenue improvement need evidence beyond an accurate answer. Do not invent a trust score or claim a demo proves increased sales. Describe the customer harm the PoC aims to reduce and how the pilot will measure it.

### Scope impact

Definitions and honest labels within M8/M10/M12. Do not add analytics integrations or synthetic trend charts. Keep the existing cut order for the M10 trend chart.

## Priority 2: Reconcile the existing-website promise

### Promise and gap

The Docs describe businesses with usable existing websites and offer either existing-site integration or a new website. The PoC's end-to-end case is the OneBridge-hosted site. The plan already acknowledges that owners must place discovery files on external domains.

### Minimum response

State that the PoC demonstrates the hosted path. Explain that external websites require supported integration or owner action, and that automatic synchronization with arbitrary external websites is not demonstrated.

Keep a clear distinction between providing files, installing them, checking their content, and synchronizing an external site.

### Scope impact

Documentation. Do not build scraping, external deployment, repository imports, or website connectors to address this gap tonight.

## Priority 2: Connect cost estimates to the recurring service

### Promise and gap

The consolidated Doc assumes approximately $45 in variable costs per SMB per month and a $149 monthly commercial subscription. Cheap input preparation alone does not validate recurring monitoring costs or support effort.

### Minimum response

Record measured API usage for representative edit and monitor operations if the existing implementation makes this straightforward. Explain that one monitor run can require multiple API calls.

Document a pilot workload assumption covering prompts per check, checks per month, assistants tested, retries, support, and onboarding effort. Keep forecasts marked as assumptions and keep prepaid demo credit separate from projected monthly cost to serve.

### Scope impact

A small cost example in M12, using actual measurements where available. Do not build billing, payment processing, subscription management, or a cost dashboard for the PoC.

## Optional white space: Owner-friendly issue reporting

The product promises understandable reporting. An existing mismatch table can express an issue in business language:

> This answer reports $49.99. Your approved price is $54.99, updated today. Check whether another published source still contains the old price.

Only suggest a source check as a possible next step unless that source was actually inspected. This explanation can be generated deterministically from the diff; it does not require another AI call.

A short explanation of what happened and what the owner can do adds more value than another technical panel. Add it only if the mismatch view already works reliably.

## Explicit deferrals

Do not add these to the competition build because of this review:

- PDF parsing, OCR, XLSX ingestion, or arbitrary website scraping.
- Additional AI providers or broad discovery integrations.
- Automated external-site synchronization.
- MFA, fraud detection, or a new governance platform solely to complete labels.
- Independent merchant truth certification or vehicle fitment verification.
- Conversion attribution, payment flows, or subscription billing.
- Background monitoring infrastructure, large-scale scheduling, or an evaluation platform.
- Dashboard-level MCP tools or generated executable MCP code per upload.

These may belong to the pilot or roadmap. Their absence is acceptable if clearly disclosed and the core PoC works.

## Suggested review questions for the other agent

1. Which findings affect the correctness or credibility of the committed PoC, rather than adding functionality?
2. Can each response be handled through labels, README text, existing prompts, or acceptance checks?
3. Which suggestions depend on code or data structures that do not exist yet?
4. Are any current documents describing planned work as already implemented?
5. Is the controlled MCP comparison being mistaken for organic discovery evidence?
6. Can a judge complete the essential demo without external-client setup or a personal AI account, while still inspecting real MCP evidence?
7. What should be deferred to protect reliability and the submission deadline?

## Decision rule

Accept a suggestion only when it strengthens an existing promised behavior, has a bounded implementation, and can be verified on the production deployment before submission. Otherwise document the limitation and defer it.

Preserve the fixed plan. Prioritize submission readiness, fair monitoring evidence, owner approval, safe governance, and a coherent walkthrough. A reliable narrow demonstration with clear limits is the intended outcome of this review.
