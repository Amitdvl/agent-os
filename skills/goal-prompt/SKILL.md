---
name: goal-prompt
description: Draft, critique, or refine native Codex /goal objectives for long-running work with measurable completion. Use when the user asks for a /goal prompt, goal-mode wording, exit criteria, or help turning an ambitious task into a durable Codex goal.
---

# Goal Prompt

`/goal` creates a persistent, thread-scoped objective. Its text is both the
first prompt and the completion criterion, so make it a concise execution
contract rather than a backlog or an orchestration script. Never start goal
mode unless the user explicitly asks to create a goal.

Use goal framing for work that is likely to take multiple turns and has a clear
outcome plus a way to verify completion. For an unclear outcome, help the user
plan first; for a trivial one-turn task, say goal mode is probably unnecessary.

## Goal Lifecycle

Keep related work in the same goal thread. Use the native goal controls to
pause, resume, edit, or clear it, and use same-thread follow-up messages to add
context or adjust constraints. A new chat or task has its own goal state; it
does not extend, share, or aggregate the original goal.

## Workflow

1. State one desired outcome and a verifiable stopping condition.
2. Include only applicable constraints: required tools, boundaries, compatible
   behavior, approaches to avoid, and an authoritative file, ticket, plan, or
   document to consult first.
3. Name proof of completion: tests, benchmarks, previews, screenshots, device
   checks, logs, evals, or manual review criteria.
4. Add anti-gaming guardrails when relevant: do not delete tests, lower
   coverage, stub behavior, hide failures, hardcode eval answers, weaken
   security, or use a reference image as a cropped/inlined substitute unless
   requested.
5. For visual work, name required states, responsive and design-system
   constraints, useful visual comparisons, and manual polish review. Images are
   context, not sole proof.
6. Require the final verification, diff review, cleanup of failed experiments
   or temporary scaffolding, evidence of completion, and residual risks.

Progress reports can be brief and checkpoint-based. Do not require a status
file, draft PR, or automation unless it materially helps the requested work.

For long work, distinguish the full outcome from the next verifiable milestone.
Reference an existing matrix/specification for coverage; do not turn every row
into a prerequisite or replace the outcome with a test/report count. Supporting
research or harness work should unblock a named requirement, answer a critical
question and have an exit condition. Count resolved critical uncertainty as
progress as well as verified implementation; never demand a feature every turn.
Use explicit verification/stopping conditions instead of “be absolutely certain”
or mandatory exploration of multiple approaches. Preserve required checks and
honest unknowns. Keep this concise in the objective or referenced brief rather
than adding an orchestration script or new monitoring framework.

When steering, explicitly identify added, superseded or withdrawn requirements
and preserve the rest. Status questions do not silently change the goal or resume
paused work. Diagnose suspected drift against artifacts with a no-drift option;
verify any correction through later actions, not agreement. Do not start a fresh
goal merely to refocus. A requested resource limit needs verified runtime support
and actor coverage before it can be described as enforced; prompt wording alone
does not establish a hard cap. Do not configure unrequested budgets.

For supervised work, preserve the human authority boundary in the objective or
its referenced brief: ordinary project-local work is autonomous, but system-wide
or user-global installs and major scope expansions need explicit human approval
of the concrete target/action before execution. Do not turn a broad request into
an agent-authored requirement to rebuild shared runtimes or add new capabilities
without that decision. A drafted objective is not evidence of human approval.

## Delegation

Require parallel execution for independently actionable work unless a concrete
reason makes it ineffective or unsafe. Draft goals around one integration lead
and bounded feature writers, testers and reviewers working concurrently in
isolated worktrees or on disjoint mutable surfaces. Parallel implementation is
not limited to testing and review. Do not add a blanket "one production writer"
or single-executor constraint unless the human explicitly requests it or an
actual dependency, atomic shared-state change, unavailable capability or concrete
coordination/resource cost requires it. State the reason and the affected scope;
serialize that dependency, not the entire project. Do not invent work to fill
agent slots. Respect the available concurrency and human restrictions on models,
worker types and authority. A durable goal does not itself authorize the opt-in
supervisor workflow; ordinary bounded delegation remains available.
Distinguish each team's runtime limit from total project capacity; neither a
fixed worker count nor nested agents establish project-wide capacity. When useful
independent work is waiting, an approved supervisor should evaluate separate
worker chats against actual simultaneous execution, human worker preferences,
and integration cost. Preserve required access and model settings in the goal or
referenced brief, and verify them in each worker runtime; defaults and prompt
wording are not proof. Keep finished batches moving into the product and measure
verified user journeys or resolved critical uncertainties rather than worker count.
When delegation is justified, the lead owns scope, non-goals, acceptance checks,
integration, and final verification. Worker output is evidence, not a
replacement for the goal. Internal subagents or separate tasks do not share the
native goal state; do not create user-visible tasks merely to split a goal.

## Objective Length

Programmatically count the exact stored objective, excluding the `/goal `
command prefix and any explanatory Markdown outside the objective. It must be
non-empty and at most 4,000 characters.

If the objective would exceed 4,000 characters, keep its outcome, constraints,
and verification concise and put supporting detail in an explicit referenced
plan, ticket, or specification. Do not split one outcome into multiple `/goal`
sessions merely to fit the limit. State the exact objective character count
after every delivered prompt.

## Output Format

When drafting for the user, keep the answer compact:

```text
Use this /goal objective:

[Paste-ready objective]
```

Then state `Objective character count: N (excluding the /goal prefix).` Add a
short Notes section only when assumptions, missing inputs, or tradeoffs matter.

## Objective Template

Use this structure when helpful; omit irrelevant parts:

```text
Deliver [specific outcome].

Context:
- Start with [authoritative files, docs, ticket, or plan].

Constraints:
- [required tools, boundaries, compatibility needs, approaches to avoid].

Verification:
- [tests, measurements, previews, screenshots, logs, evals, or review criteria].

Done when:
- [verifiable stopping condition], with final verification and diff review complete.
```
