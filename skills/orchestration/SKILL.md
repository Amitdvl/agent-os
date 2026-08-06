---
name: orchestration
description: Coordinate genuinely multi-track or high-risk work through a lead agent and bounded specialist subagents. Use automatically only when the task has multiple independently valuable workstreams or a sensitive/irreversible change needs independent risk review. Do not use merely because work spans files, is lengthy, uses /goal, or could theoretically be split.
---

# Orchestration

Use the smallest role team that improves correctness or throughput. The lead owns the outcome; workers own only bounded assignments.

## Activation

Use orchestration only when one of these conditions is clearly true:

1. The outcome needs two or more independently valuable workstreams with separate deliverables and evidence—for example, research that materially informs implementation plus an independent review, or two isolated system changes that can proceed without touching shared state.
2. The task changes a sensitive or irreversible external surface—such as production data, permissions, deployments, secrets, or money—and an independent risk review materially reduces the chance of harm.

Do **not** orchestrate merely because the work spans multiple files, has several implementation steps, is lengthy, uses `/goal`, or can theoretically be divided. A normal feature, bug fix, refactor, UI component, or one-system migration remains direct work unless it clearly meets a condition above. When the activation decision is genuinely uncertain, ask the human whether to orchestrate.

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
