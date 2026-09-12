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

## Delegation

Goal mode does not by itself require orchestration. Use one executor by default.
Activate the `orchestration` workflow only when the work has independently
valuable workstreams with separate evidence, or a sensitive/irreversible change
needs an independent risk review. Keep parallel writers in isolated worktrees
or on disjoint mutable surfaces.

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
