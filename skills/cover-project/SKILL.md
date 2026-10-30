---
name: cover-project
description: Delegate substantive testing to a bounded worker when separable. Use during implementation for state transitions, rejection, recovery, isolation, replay or persistence; workers deliver tests and fault evidence. Routine fixes stay direct.
---

# Cover Project

Give an agent a coverage target and receive maintained tests plus evidence of
what they protect. Targets range from one behavior to “Cover this project.”
Use this during implementation whenever a testing gap merits focused coverage
work, as well as for a user-requested coverage campaign. Ordinary single-test
implementation need not run this workflow; an explicit bounded assignment can.
This skill is self-contained; it does not require Superpowers or another agent
framework. Explicit invocation: `$cover-project`.

## Parent routing: assign before suite expansion

At implementation intake, choose test ownership; revisit it when scope grows.
Before writing or substantially expanding tests, make one of these choices and
record it briefly in existing task notes or a progress update:

- **Worker:** tests/fixtures can have a separate writer and the change spans
  independently testable behaviors or material state transitions, rejection
  without side effects, recovery, isolation, replay, or persistence. Actually
  dispatch one bounded worker with this skill using the available delegation
  tool. Loading the skill or promising to delegate does not assign the work.
- **Direct:** routine label/config changes or one ordinary regression test,
  already assigned as the coverage worker, an explicit single-agent constraint,
  unavailable/disallowed delegation, or a concrete ownership/cost constraint.
  State the specific reason; file count and “one integrated feature” alone are
  not exceptions. A small task needs neither this full workflow nor a planning
  document unless explicitly assigned.

The human's implementation request authorizes the eligible testing assignment;
no separate coverage/delegation request or larger orchestration team is needed.
The benefit is independent contract-derived assertions and fault evidence, not
agent creation or a larger test count. The parent owns integration and reruns.

If production edits share state, finish that source batch first, then dispatch
before suite expansion while the parent reviews implementation or docs. Give the
worker a stable target and separate write ownership. Coordinate later source
revisions and rerun evidence; do not let source and test writers race. If the
parent already started tests, hand off the remaining substantive gap or
independent fault verification rather than using that work as a direct-execution
exception. An implementation subagent still makes this ownership decision; a
worker assigned this testing role does not spawn more workers. Honor explicit
single-agent, report-only, and runtime constraints.

## Agent entry point

The parent agent owns the product task, scope, integration, and final verification.
When delegation is useful, available, and permitted, assign one coverage worker
a clear steering target using [agent-handoff.md](references/agent-handoff.md).
Pass the skill's accessible path, project location, intended behavior and source
of truth, writable files, constraints, and acceptance checks. Do not assume a
worker inherits this skill, repository state, or the parent's context.

The worker reads this skill, the handoff reference, and the complete
[worker workflow](worker-workflow.md) before executing the assignment. It
returns changed files and reproducible evidence.
It does not broaden the product task, spawn further workers, or commit/merge/push
unless those actions are explicitly assigned. Shared files need one writer;
use an isolated checkout when ownership cannot be separated. The parent reviews
the actual diff, integrates it, and verifies against the final source state.

Direct invocation uses the same workflow without creating a subagent. Read the
complete [worker workflow](worker-workflow.md) before carrying out the coverage
assignment directly. If a delegation tool is unavailable or disallowed, execute
locally within scope and report that fact; do not claim delegation. No framework
or fixed model is needed.

For test design, see [regression design](references/regression-design.md) and
[writing good tests](references/writing-good-tests.md) as directed by the workflow.

## Parent acceptance

Review the test diff and contract assertions against the final source. Compare
coverage only across matching source, test, instrumentation, and exclusion
scopes; inspect missing or empty denominators, and reject inflated coverage from
narrowing collection or weakening tests. For fault checks, distinguish the
intended assertion failure from setup errors, crashes, timeouts, and unexecuted
faults. Independently rerun the integrated checks and report broader checks not
run, uncovered material risks, and unresolved failures.
