---
name: justification-audit
description: Audit whether a component, requirement, plan, or workflow earns its place when the user asks to justify, prune, or challenge it before optimization. Combines Aristotle's four causes, first-principles reasoning, and counterfactual comparison.
---

# Justification Audit

Require a defensible contribution to an explicit outcome. Distinguish unsupported justification from demonstrated uselessness, and make the assumptions that could reverse the decision visible.

Review the requested target; invocation alone requests analysis, and implementation follows existing user authorization. Work standalone or alongside Production Algorithm. Do not turn ordinary creation or explanation requests into unsolicited audits. Scale effort to consequence and uncertainty: a small reversible choice may need only a short comparison. A sound conclusion can be retain, remove, replace, test, or unresolved.

## Establish what deserves optimizing

Identify the target, intended outcome, beneficiaries, system boundary, time horizon, and what must remain true. Separate the desired function from its present implementation. Challenge the objective itself when it may be obsolete, a proxy, or a means mistaken for an end; do not silently replace the user's values with efficiency.

Reuse an existing measurement plan. Otherwise choose a useful outcome measure and quality check; mark an unknown baseline rather than inventing one. Qualitative value, enjoyment, dignity, and resilience need not be monetized to count. State whose benefits and burdens are included and who might be missing. Identify the current system bottleneck where relevant; local savings do not necessarily improve the whole.

Use available evidence first. Ask only for missing information that could materially change the decision, and proceed on independent parts. State a provisional boundary if a broad target cannot yet be resolved.

## Map the four explanations

Use these as inquiry lenses, not four mandatory output sections or a completeness certificate:

| Cause | Practical question |
| --- | --- |
| Final: purpose | What end does this serve, for whom, and why is that end worth pursuing? |
| Formal: structure | What defines the function and required properties? Which features belong only to this implementation? |
| Efficient: source of change | What agents, actions, mechanisms, and incentives produce and sustain it? |
| Material: constituents | What resources, information, components, and dependencies constitute it? |

These are practical adaptations of Aristotle, not modern causal identification or proof of necessity. See [sources and adaptations](references/sources.md) when attribution or theoretical detail matters.

## Expose the premises and causal chain

Distinguish chosen values, established facts, constraints, assumptions, and conventions. Cite evidence for consequential factual claims. Explain what makes a constraint binding and whether it can change; do not relabel a habit as a law or a preference as a fact. First principles are explicit starting premises, not permission to discard empirical knowledge, base rates, or expert evidence.

Trace a short chain: **component → mechanism → intermediate effect → valued outcome**. Mark which links are observed, inferred, or unknown. A coherent story or correlation alone does not establish the effect of keeping or removing the component. Seek counterevidence, competing explanations, and evidence from comparable cases when relevant. An obsolete origin does not prove the present function has no value.

## Compare counterfactual contribution

Ask: **Compared with removing or replacing this, what does keeping it contribute to the whole system, after its burdens?**

Conceptually, `J(x) = V(system with x) − V(best feasible alternative without x)`.

This is a decision rule, not a universal numerical score. Compare the current arrangement with plausible removal, substitution, consolidation, or changed scope. Keep the current arrangement as a status-quo option. Do not assume an imagined alternative is feasible or free. A positive contribution supports retention relative to the compared alternatives, not proof of optimality or absolute necessity; a negative contribution identifies a removal or replacement candidate, not permission to delete.

Evaluate all options on the same boundaries and horizon. Include relevant operating and transition costs, maintenance, attention, opportunity costs, side effects, and risk without double counting. Avoid sunk-cost justification; past work matters only through future consequences. Keep hard constraints outside a weighted score. If outcomes cannot defensibly share units, show their tradeoffs and which value judgment would select an option rather than inventing weights or declaring a winner.

Use numerical estimates only when grounded; show ranges or scenarios and their basis. Keep evidence strength separate from estimated value: do not multiply benefits by an arbitrary confidence percentage. Unknown contribution is not zero. With numerical uncertainty, show a useful break-even point or sensitivity check when possible. Without it, identify the observation or assumption that would change the ranking.

## Check what the model may have missed

Investigate these only to the depth that could affect the decision:

- **Boundary and timing:** displaced work, affected people, delayed effects, feedback, rare failures, and consequences outside the convenient measurement window.
- **Interactions:** dependencies, thresholds, complementary components, shared causes of failure, and protective redundancy. Re-evaluate the remaining system after each proposed removal; individually removable parts may not be jointly removable.
- **Metric validity:** how could the measure improve while the real outcome worsens? Pair the outcome measure with a proportionate quality or harm check. Keep unmeasured value visible.
- **Symmetric challenge:** state the strongest credible case for retention and for removal or replacement. Apply comparable evidence standards; neither familiarity nor novelty earns an exemption. Respect asymmetric costs of error and reversibility.
- **Reversal:** which plausible missing variable or changed assumption would reverse the recommendation? Say what remains outside the model; do not claim exhaustive coverage or freedom from bias.

Do not demand exhaustive proof for a cheap reversible trial. Preserve validated safety, security, legal, contractual, financial, and incident-proven protections unless an authorized change has adequate evidence and preserves the required property. Missing documentation does not establish uselessness, and a short incident-free period does not establish that a protection has no effect.

## Decide and stop at useful evidence

Return a short brief, using a table only when it helps:

1. **Purpose and boundaries:** outcome, beneficiaries, horizon, constraints, and measure or unknown baseline.
2. **Justification:** contribution versus feasible alternatives, decisive evidence, and consequential assumptions. Separate value from evidence strength.
3. **Decision:** retain, remove, replace, test, or unresolved; explain why and give the strongest credible objection or reversal condition.
4. **Next evidence:** the smallest useful check or reversible experiment, measurement, review point, and stop/add-back condition where needed. Name a responsible person only when known; otherwise mark ownership unassigned.

Prefer evidence that could change the decision. If additional investigation is unlikely to affect the choice enough to justify its cost or delay, stop with the best-supported provisional decision. Do not require numerical scores, a ledger, a full causal diagram, or an experiment for every target.

## Pair with Production Algorithm

When the user invokes both skills, load the current `$production-algorithm` skill and conduct one integrated review. Establish one outcome/measurement plan; use this audit's purpose, premise, and causal checks within **question requirements**, then its counterfactual comparisons within **delete**. Carry justified functions, constraints, and unresolved questions into simplification, acceleration, and automation; revisit justification if those stages change the mechanism, dependencies, or metric. Preserve Production Algorithm's five-step order.

Return one shared decision brief: use Production Algorithm's output structure, adding the decisive assumptions, evidence strength, and reversal condition where they affect the decision. Do not create a separate full audit, duplicate measurements, or impose a mandatory preliminary gate. Standalone audits may pass their findings to a later Production Algorithm review without repeating resolved work.

Pairing requires the user's invocation of both skills or an explicit request to combine them; mention of possible later use is not invocation. Do not automatically run Production Algorithm, and keep this audit usable when that skill is unavailable.
