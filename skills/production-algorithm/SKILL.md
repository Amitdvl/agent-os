---
name: production-algorithm
description: Explicit-only method to diagnose one workflow, remove unnecessary requirements, reduce cycle time, and determine whether automation is justified.
---

# Production Algorithm

Use this skill only when the user explicitly invokes `$production-algorithm`, names the Production Algorithm, or asks to run it. Do not apply it merely because a request concerns operations, production, AI, or automation.

## Purpose

Redesign one bounded workflow for a stated outcome. Work in this order:

1. Question requirements.
2. Delete work that does not earn its place.
3. Simplify the work that remains.
4. Shorten the feedback and delivery cycle.
5. Automate only the proven residual workflow.

The aim is quality volume: preserve or improve the outcome while increasing useful throughput. Treat automation as the final decision, never the starting assumption.

## Establish the review

Identify or ask for the smallest useful scope:

- The workflow boundary, intended outcome, and primary success metric.
- Actual touch time versus total elapsed time, when available.
- Steps, handoffs, tools, approvals, requirements, and accountable owners.
- Non-negotiable safety, security, legal, regulatory, contractual, financial-control, or irreversible customer constraints.

Proceed with the evidence available. Label estimates, unknowns, and assumptions; do not invent metrics or owners. Keep the review analytical by default. Do not disable steps, alter systems, contact people, or build automations without separately stated authority.

## Run the algorithm

### 1. Question requirements

Create a requirement ledger. Every retained requirement needs a named accountable owner, its expected effect, and evidence or a testable rationale.

For each item, ask:

- What does this mean in observable terms?
- How do we know it improves the stated outcome?
- So what happens if it is removed or changed?

Mark unowned, unevidenced, duplicated, or outcome-irrelevant items as deletion candidates. A department, convention, or “best practice” is not an accountable owner.

### 2. Delete before optimizing

Propose removal or a reversible trial for candidates before making them faster. Prefer low-risk, reversible tests with a clear add-back trigger and owner. If no removed items ever need to return, the team may be deleting too cautiously; this is a learning signal, not a quota.

Never trial-remove validated safety, security, legal, regulatory, contractual, financial-control, or irreversible customer protections without explicit authority and appropriate review.

### 3. Simplify the remainder

For each surviving step, compare its expected contribution with effort, cost, latency, defects, handoffs, and opportunity cost. Consolidate tools, approvals, formats, and queues only when the success metric and safeguards remain intact. Favor the smallest reliable version of the process.

### 4. Accelerate the cycle

Separate actual work from waiting, batching, queue time, and delayed decisions. End actionable work with `who / what / by when`; make the deadline proportionate to time on task, current priorities, and capacity. Recommend shorter, useful feedback cycles rather than performative status updates.

### 5. Gate automation

Recommend automation only for a step that is necessary, stable enough to specify, measurable, and worth the maintenance and failure cost. For each candidate, state:

- Expected metric impact and baseline.
- Preconditions and owner.
- Failure mode, manual fallback, and review cadence.
- Why deletion or simplification is no longer the better option.

Do not create the automation unless the user explicitly requests implementation.

## Deliverable

Return a concise Production Algorithm Review containing:

1. Scope, outcome, metric, baseline, and constraints.
2. A requirements ledger: item, owner, evidence, decision, and rationale.
3. A ranked deletion or experiment plan with add-back triggers.
4. The simplified future-state workflow and expected cycle-time change.
5. A `who / what / by when` cadence for the next review.
6. An automation backlog for only the residual, justified work.
7. Assumptions, risks, and decisions that require user authority.

Use tables when they make trade-offs scannable. Lead with the highest-leverage deletion or decision, not a process diagram.

## Applicability

Use this on content production, client delivery, sales or support operations, internal approvals, software delivery, and physical operations when there is a bounded workflow and an observable outcome. Do not use it for open-ended strategy, people-performance evaluation, or an unscoped request to “make everything efficient.”
