---
name: current-limiting-factor
description: Diagnose the current bottleneck for a concrete objective when the user asks what limits progress, what to prioritize next, or why an operation is stuck.
---

# Current Limiting Factor

## Overview

Diagnose the one factor that most constrains forward progress right now.
Optimize for present constraint removal, not for elegant theory, complete roadmaps, or local improvements that do not move the system.

## Core standard

- Start from a concrete objective, not from a department or function.
- Evaluate the full system required to achieve that objective.
- Identify multiple plausible bottlenecks before choosing one.
- Select the bottleneck with the highest current constraint on progress now, not the biggest abstract weakness in the company.
- Recommend the smallest high-leverage action that can relieve that bottleneck quickly enough to generate new information.
- Name the work that should not be prioritized yet.

If several issues are related, still choose one limiting factor unless the evidence shows they are inseparable in the current state.

## Workflow

1. Restate the objective in one sentence.
- Make the objective specific enough to judge progress.
- If the user is vague, infer the most immediate objective from context and state the assumption.

2. Enumerate the system required to achieve the objective.
- Name the major parts that must work: product, demand, distribution, conversion, delivery, reliability, talent, capital, ops, or other relevant system elements.
- Keep this list short and functional.

3. Identify candidate bottlenecks.
- Surface the few constraints that could plausibly be dominating progress.
- Consider both throughput limits and decision-quality limits.

4. Choose the single current bottleneck.
- Pick the factor that, if relieved now, would most increase the rate of progress toward the stated objective.
- Reject factors that are real but not currently rate-limiting.

5. Explain why it is the limiting factor now.
- Ground the answer in present conditions, observed symptoms, sequencing, and dependency structure.
- Distinguish direct constraints from downstream noise.

6. Recommend the smallest high-leverage action.
- Prefer an intervention that reduces uncertainty and increases throughput quickly.
- Make it concrete, bounded, and easy to evaluate.

7. State what not to work on yet.
- Name attractive work that should be deferred because it does not address the current constraint.
- Be explicit about why it is not first priority.

8. Define a short feedback loop and metric.
- Give one near-term checkpoint and one primary metric or signal that will show whether the bottleneck moved.
- Prefer a loop measured in days or a small number of weeks, not quarters.

## Communicate the decision

Lead with the likely constraint, evidence and smallest useful intervention.
Include the objective, alternatives considered, work to defer, uncertainty and a
near-term metric/checkpoint as needed. Scale the response to the question; no
fixed headings or section count is required. A provisional diagnosis must say
what observation would change it. Ordinary bug implementation without a
prioritization question does not require this workflow.

## Style

- Be decisive.
- Use first-principles reasoning.
- Avoid handwaving, slogans, and management filler.
- Avoid local optimization.
- Prefer one hard claim with justification over a broad list of possibilities.
- If evidence is weak, say so plainly and still choose the most likely current bottleneck.

## Do not

- Turn the answer into a brainstorming list without selecting a constraint.
- Recommend broad parallel workstreams when one constraint is clearly dominant.
- Default to the loudest pain point if it is not the binding constraint on the objective.
- Confuse an important capability gap with the present limiting factor.
