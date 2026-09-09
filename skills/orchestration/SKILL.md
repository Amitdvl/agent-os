---
name: orchestration
description: Coordinate every /goal through an accountable lead and bounded workers or reviewers. Outside /goal, activate for independently valuable workstreams or sensitive external changes needing independent risk review, not merely file count or length. Support authorized multi-task execution under one parent goal.
---

# Orchestration

Use the smallest role team that improves correctness or throughput. The lead owns the outcome; workers own only bounded assignments.

## Activation

**Default rule: every `/goal` activates orchestration.** Treat `/goal` as an
explicit trigger, not a suggestion. Invoke this workflow at the beginning of
the goal, establish a lead, and assign bounded worker or reviewer roles when
delegation is available. Do not decline orchestration merely because the task
is one feature, one system, spans multiple files, is long-running, or appears
too easy to parallelize. If delegation is unavailable, keep the lead contract
and state that limitation explicitly.

Outside `/goal`, use orchestration when one of these conditions is clearly true:

1. The outcome needs two or more independently valuable workstreams with separate deliverables and evidence—for example, research that materially informs implementation plus an independent review, or two isolated system changes that can proceed without touching shared state.
2. The task changes a sensitive or irreversible external surface—such as production data, permissions, deployments, secrets, or money—and an independent risk review materially reduces the chance of harm.

For non-`/goal` work, do **not** orchestrate merely because the work spans
multiple files, has several implementation steps, is lengthy, or can
theoretically be divided. When the activation decision is genuinely uncertain,
ask the human whether to orchestrate. Never claim a model or delegation
occurred when it did not.

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

- Honor explicit permission, including applicable standing instructions, to split one goal across multiple Codex tasks, subject to runtime tool restrictions. Prefer subagents for internal subtasks; create user-visible tasks only when the runtime permits that authorization. If a runtime requires a task-specific request, include that permission in the proposed goal prompt instead of treating this skill as an override.
- Keep one parent goal and one accountable lead. Record each task's bounded scope, identifier, dependencies, acceptance checks, and returned evidence in the goal's progress artifact. Track tasks through completion or a genuine blocker and integrate their results; dispatch is not delivery.
- Multiple tasks do not mean multiple user-run goal sessions or expanded scope. The lead owns completion of the entire goal, not merely the first milestone. Drafting a prompt does not authorize creating tasks or starting implementation.
- Do not let multiple workers edit the same files or mutable machine state concurrently. Sequence them or use isolated worktrees when parallel changes are necessary.
- Keep workers task-local. Do not leak the expected conclusion into an independent review assignment.
- Stop or redirect a worker when evidence changes the plan. Do not force the original plan through.
- Preserve user work and existing safety boundaries. Delegation never expands authority, credentials, tools, or external-write permission.

## Completion Gate

The lead must independently inspect worker output, run the relevant verification, review the final diff, and check for residual risk. Report:

- what each role did and its evidence;
- the final acceptance-check results;
- `Done` only when every required condition holds, otherwise `Not Done` with the remaining gap and next action.
