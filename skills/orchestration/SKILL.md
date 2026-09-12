---
name: orchestration
description: Coordinate genuinely multi-track or high-risk work through a lead agent and bounded specialist subagents. Use automatically only when the task has multiple independently valuable workstreams or a sensitive/irreversible change needs independent risk review.
---

# Orchestration

Use the smallest role team that improves correctness or throughput. The lead
owns the outcome; workers own only bounded assignments.

## Activation

Goal mode and orchestration are separate concerns. A `/goal` creates a durable,
thread-scoped outcome; it does not by itself require orchestration. Use one
executor by default, including for long-running or multi-file goals.

Activate orchestration only when one of these conditions is clearly true:

1. The outcome needs two or more independently valuable workstreams with
   separate deliverables and evidence, such as research that materially informs
   implementation plus independent review, or isolated changes that do not
   share mutable state.
2. The task changes a sensitive or irreversible external surface—such as
   production data, permissions, deployments, secrets, or money—and an
   independent risk review materially reduces the chance of harm.

Do not orchestrate merely because work uses `/goal`, spans multiple files, has
several steps, is lengthy, or could theoretically be divided. When the
activation decision is genuinely uncertain, ask the human whether to
orchestrate. Never claim a model or delegation occurred when it did not.

## Lead Contract

1. Define the outcome, scope, non-goals, risks, and acceptance checks before delegation.
2. Select roles and order work. Prefer a single executor unless parallel work is genuinely independent.
3. Choose a requested model only when the runtime exposes model selection. Prefer a stronger planning/review model for the lead and a capable execution model for workers when available. Never claim a model or delegation occurred when it did not.
4. Keep the lead responsible for integration, safety decisions, final diff review, and final Done/Not Done.
5. Keep the host anchored to the original goal. Treat worker output as evidence and implementation input, not a replacement goal; reconcile it against the agreed scope, non-goals, and acceptance checks before acting on it.

## Assignments

Give every worker a bounded card containing:

- objective and acceptance criteria;
- allowed files, systems, and write scope;
- relevant source paths and commands;
- constraints, non-goals, and required verification;
- the exact evidence to return.

Use role names that match the task: researcher (read-only evidence), executor
(implementation), QA (tests and reproduction), reviewer (independent
diff/behavior review), security reviewer (threat and permissions review), or
release/migration operator. A role changes focus, not permissions.

## Coordination Rules

- Do not let multiple workers edit the same files or mutable machine state concurrently. Sequence them or use isolated worktrees when parallel changes are necessary.
- Keep workers task-local. Do not leak the expected conclusion into an independent review assignment.
- Do not let a worker's tangent, partial deliverable, or proposed expansion silently redirect the work. Redirect it to the original scope, or explicitly re-scope only with user authorization.
- Stop or redirect a worker when evidence changes the plan. Do not force the original plan through.
- Preserve user work and existing safety boundaries. Delegation never expands authority, credentials, tools, or external-write permission.

## Completion Gate

The lead must independently inspect worker output, run the relevant verification,
review the final diff, and check for residual risk. Report:

- what each role did and its evidence;
- the final acceptance-check results;
- `Done` only when every required condition holds, otherwise `Not Done` with the remaining gap and next action.
