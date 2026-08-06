---
name: orchestration
description: Coordinate substantial multi-step work through a lead agent and bounded specialist subagents. Use automatically for work spanning multiple systems or independent surfaces, risky or irreversible changes, long-running goals, parallelizable investigation, or tasks that need independent review and verification. Do not use for simple, well-scoped work that one agent can safely finish and verify directly.
---

# Orchestration

Use the smallest role team that improves correctness or throughput. The lead owns the outcome; workers own only bounded assignments.

## Activation

Treat work as substantial when it has one or more of these traits:

- It spans multiple independent systems, files, or decisions.
- It changes live workflow, secrets, permissions, deployments, data, or another sensitive surface.
- It needs research plus implementation, independent review, or a real verification loop.
- It can be split into independent tasks without concurrent edits to the same surface.
- It is a long-running `/goal` or needs a defensible Done/Not Done verdict.

Keep direct execution for simple, well-scoped work with a clear verification step. Do not create agents merely to look busy.

## Lead Contract

1. Define the outcome, scope, non-goals, risks, and acceptance checks before delegation.
2. Select roles and order work. Prefer a single executor unless parallel work is genuinely independent.
3. Choose a requested model only when the runtime exposes model selection. Prefer a stronger planning/review model for the lead and a capable execution model for workers when available. Never claim a model or delegation occurred when it did not.
4. Keep the lead responsible for integration, safety decisions, final diff review, and final Done/Not Done.

## Assignments

Give every worker a bounded card containing:

- objective and acceptance criteria;
- allowed files, systems, and write scope;
- relevant source paths and commands;
- constraints, non-goals, and required verification;
- the exact evidence to return.

Use role names that match the task: researcher (read-only evidence), executor (implementation), QA (tests and reproduction), reviewer (independent diff/behavior review), security reviewer (threat and permissions review), or release/migration operator. A role changes focus, not permissions.

## Coordination Rules

- Do not let multiple workers edit the same files or mutable machine state concurrently. Sequence them or use isolated worktrees when parallel changes are necessary.
- Keep workers task-local. Do not leak the expected conclusion into an independent review assignment.
- Stop or redirect a worker when evidence changes the plan. Do not force the original plan through.
- Preserve user work and existing safety boundaries. Delegation never expands authority, credentials, tools, or external-write permission.

## Completion Gate

The lead must independently inspect worker output, run the relevant verification, review the final diff, and check for residual risk. Report:

- what each role did and its evidence;
- the final acceptance-check results;
- `Done` only when every required condition holds, otherwise `Not Done` with the remaining gap and next action.
