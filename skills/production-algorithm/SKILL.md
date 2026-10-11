---
name: production-algorithm
description: Explicit-only review of one workflow using Musk's ordered five-step method, measured outcomes, and technical safeguards before automation.
---

# Production Algorithm

Use this skill only when the user explicitly invokes `$production-algorithm`, names the Production Algorithm, or asks to run it. Do not apply it merely because a request concerns operations, production, AI, or automation.

This is the single merged successor to Production Algorithm and Engineer Algorithm. The primary source is [Elon Musk's Startup Archive video](https://www.youtube.com/watch?v=tdf3luOCNks). Read [sources and adaptations](references/sources.md) when interpreting the method or explaining its provenance; do not substitute a commentator's application for Musk's account.

## Purpose

Redesign one bounded workflow for a stated outcome. Work in this order:

1. Question requirements.
2. Delete work that does not earn its place.
3. Simplify the work that remains.
4. Shorten the feedback and delivery cycle.
5. Automate only the proven residual workflow.

The aim is to remove unjustified work while preserving the intended outcome. Treat automation as the final decision, never the starting assumption. Apply all five stages in order; each may conclude that no change is justified.

## Establish the review

Identify or ask for the smallest useful scope:

- The workflow boundary, intended outcome, primary success metric, baseline, target, and review window.
- Actual touch time versus total elapsed time, when available.
- Steps, handoffs, tools, approvals, requirements, and accountable owners.
- Non-negotiable safety, security, legal, regulatory, contractual, financial-control, or irreversible customer constraints.

Proceed with the evidence available. Label estimates, unknowns, and assumptions; do not invent metrics or owners. Where the baseline is missing, propose a bounded measurement rather than claim an improvement. Include a quality or reliability floor so faster throughput cannot disguise worse outcomes.

Keep the review analytical by default. Invoking the algorithm authorizes a decision packet, not implementation. Present material decisions independently with context, alternatives, risk, and required evidence. Preserve existing authority for clear local work; do not add redundant approval gates. External mutations, rollout, and changes beyond the authorized scope need explicit authority.

## Run the algorithm

### 1. Question requirements

Create a requirement ledger. Identify the person who introduced each requirement and its current accountable owner, expected effect, and evidence or a testable rationale. If the person or rationale is unknown, mark it unknown and name the next investigation; do not invent ownership.

For each item, ask:

- What does this mean in observable terms?
- How do we know it improves the stated outcome?
- So what happens if it is removed or changed?
- What incident, failure mode, dependency, or user need does it protect, and is that problem still real?

Question requirements regardless of the originator's intelligence or seniority. A department, convention, or “best practice” is not an accountable owner. Classify items as `keep`, `challenge`, `needs evidence`, or `candidate for deletion`. Missing evidence or ownership calls for investigation; it does not establish that a protection is unnecessary.

### 2. Delete before optimizing

Try hard to remove unnecessary work before making it faster. Challenge speculative “just in case” steps, stale requirements, duplicate checks, unread artifacts, and approvals that do not change decisions. Weigh proven value against maintenance cost and technical debt.

Prefer low-risk, reversible tests with a clear add-back trigger and owner. Musk's roughly 10% add-back remark challenges excessive caution; treat it as a learning signal, not a deletion quota or an instruction to create failures.

Never trial-remove validated safety, security, legal, regulatory, contractual, financial-control, or irreversible customer protections without explicit authority and appropriate review.

For incident-proven guardrails, preserve the actual safety property; any removal requires an approved replacement and proof that it works.

### 3. Simplify the remainder

For each surviving step, compare its expected contribution with effort, cost, latency, defects, handoffs, and opportunity cost. Consolidate tools, approvals, formats, and queues only when the success metric and safeguards remain intact. Clarify ownership, sources of truth, and diagnosable failure modes. Favor the smallest reliable version of the process; avoid optimizing a step whose necessity remains unresolved.

### 4. Accelerate the cycle

Separate actual work from waiting, batching, queue time, and delayed decisions. End actionable work with `who / what / by when`; make the deadline proportionate to time on task, current priorities, and capacity. Recommend shorter, useful feedback cycles rather than performative status updates.

For engineering workflows, fail earlier, make the first actionable blocker clear, stop unnecessary downstream work, and parallelize independent checks when safe. Preserve cleanup, recovery, and decisive failure evidence. Reduce uncertainty as well as runtime.

### 5. Gate automation

Recommend automation only for a step that is necessary, stable enough to specify, measurable, and worth the maintenance and failure cost. For each candidate, state:

- Expected metric impact and baseline.
- Preconditions and owner.
- Failure mode, manual fallback, and review cadence.
- Why deletion or simplification is no longer the better option.
- Observable success/failure evidence, maintenance cost, and rollout/rollback conditions where relevant.

Do not create the automation unless the user explicitly requests implementation. Do not automate approvals, destructive actions, or provider mutations simply because the review found them repeatable. Validate the manual path and preserve applicable authorization boundaries.

## Technical safeguards

When recommendations affect auth, billing, security, CI, deployment, production operations, data, or customer-facing reliability, include:

- The invariant that must remain true and dependencies affected.
- Blast radius: users, accounts, environments, data, and systems exposed if wrong.
- A bounded trial or staged rollout, rollback owner/path, and explicit stop or add-back triggers.
- Required proof before rollout and readback after implementation; skipped checks and unavailable evidence are not passes.
- Redacted evidence collection when credentials or customer data are involved.

Scale these details to the actual change. Do not turn a particular repository's release gate into a universal rule.

## Deliverable

Return a concise Production Algorithm Review containing:

1. Scope, outcome, metric, baseline, and constraints.
2. A requirements ledger: item, owner, evidence, decision, and rationale.
3. A ranked deletion or experiment plan with expected upside, risk, replacement if needed, owners, and add-back triggers.
4. The simplified future-state workflow and expected cycle-time change.
5. A `who / what / by when` cadence for the next review.
6. An automation backlog for only the residual, justified work.
7. Assumptions, risks, technical safeguards where relevant, and independently reviewable decisions requiring new authority.
8. The smallest reversible next step and the evidence that will decide whether it worked.

Use tables when they make trade-offs scannable. Lead with the highest-leverage deletion or decision, not a process diagram.

## Applicability

Use this on content production, client delivery, sales or support operations, internal approvals, software delivery, and physical operations when there is a bounded workflow and an observable outcome. Do not use it for open-ended strategy, people-performance evaluation, or an unscoped request to “make everything efficient.”
