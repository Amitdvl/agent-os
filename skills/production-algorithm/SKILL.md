---
name: production-algorithm
description: Explicit-only review of one workflow using Musk's five steps, a shared measurement plan, and protections proportionate to the proposed change.
---

# Production Algorithm

Use only when explicitly invoked as `$production-algorithm` or by name. Review one bounded workflow; an unscoped request to improve everything needs a narrower target. Invocation requests a review; implementation follows existing user authorization.

The primary source is [Musk's Startup Archive clip](https://www.youtube.com/watch?v=tdf3luOCNks). See [sources and adaptations](references/sources.md) for provenance.

## Establish one measurement plan

Identify the intended outcome, current workflow, responsible people, and constraints. Choose a useful outcome metric and baseline, or mark the baseline unknown and propose a small measurement. Define what improvement would look like and when to check it. Add a quality or reliability check where faster output could hide harm.

Reuse this plan throughout the review. Distinguish evidence from estimates; do not invent owners, targets, or cycle-time savings. Compare actual work time with waiting when latency is the problem. Numeric targets and formal deadlines are optional when the evidence does not support them.

## Apply the five steps in order

When explicitly paired with `$justification-audit`, use one integrated review and the same measurement plan. Apply its purpose, premise, and causal checks while questioning requirements, and its counterfactual comparisons while considering deletion. Carry the results through the remaining steps and revisit them when the mechanism or dependencies change. Return one decision brief, including material assumptions and reversal conditions; do not require a separate audit or preliminary gate. Production Algorithm remains usable on its own.

1. **Question requirements.** What does each requirement mean, who is responsible for it, what evidence supports it, and what happens if it changes? Challenge it regardless of the person's seniority or intelligence. A department is not an accountable person. Investigate historical authorship when it helps resolve the requirement; mark unknowns honestly.

2. **Delete.** Try hard to remove unjustified work before improving it. Challenge duplicate steps and speculative “just in case” requirements. Prefer reversible trials with an add-back condition. Musk's roughly 10% add-back heuristic challenges excessive caution; it is not a deletion quota.

3. **Simplify.** Improve only what survives deletion. Compare benefit with effort, maintenance cost, defects, and opportunity cost; choose the smallest reliable flow. If necessity remains uncertain, investigate or test it before investing in optimization.

4. **Accelerate.** Reduce waiting, handoffs, batching, and delayed decisions in the surviving flow. Make the next action and responsible person clear; set a proportionate review point. For engineering work, preserve cleanup, recovery, and failure evidence when shortening the path.

5. **Automate.** Consider only necessary work that is stable enough to specify and worth its maintenance and failure costs. Judge it by the shared outcome metric. Identify an owner and fallback where failure matters. No justified automation is a valid conclusion; no stage requires a change.

## Preserve necessary protections

Missing ownership or evidence does not prove a protection is unnecessary. Preserve validated safety, security, legal, contractual, financial, and incident-proven protections unless an authorized change has adequate evidence; replacing a guardrail must preserve its safety property.

For changes with meaningful consequences, state what must remain true, what could be affected, how to reverse or stop the change, and what evidence permits proceeding. Missing or skipped checks remain unresolved. Read [technical safeguards](references/technical-safeguards.md) when the proposed change warrants that detail; touching a technical category alone does not trigger a rollout packet. Follow applicable authorization and privacy rules.

## Return a short decision brief

1. **Highest-value decision:** what to remove, challenge, or retain, and why.
2. **Proposed changes:** prioritized in algorithm order, with expected benefits and material risks.
3. **Next experiment:** responsible person, measurement, review point, and reversal or stop condition where needed.

Use a table or future-state workflow only when it clarifies the decision. Scale the detail to the review; do not require a ledger, separate stage reports, or an automation backlog for every request.
