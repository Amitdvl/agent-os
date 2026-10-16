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

The worker reads this skill and the handoff reference, executes the workflow
within that assignment, and returns changed files and reproducible evidence.
It does not broaden the product task, spawn further workers, or commit/merge/push
unless those actions are explicitly assigned. Shared files need one writer;
use an isolated checkout when ownership cannot be separated. The parent reviews
the actual diff, integrates it, and verifies against the final source state.

Direct invocation uses the same workflow without creating a subagent. If a
delegation tool is unavailable or disallowed, execute locally within scope and
report that fact; do not claim delegation. No framework or fixed model is needed.

## Decide the scope and completion criteria

For an implementation assignment, add and verify tests; do not stop at an audit
or proposed test plan. A named behavior is a valid complete scope: do not expand
it to every test gap in its containing file, module, or repository. Honor
report-only, time, file, and no-production-change limits. Resolve the repository
from the current context; ask only if the
target or intended behavior is genuinely ambiguous. Routine local setup and
testing do not need a phase-approval gate.

Use the repository's coverage requirements when present. Otherwise prioritize
important behavior and explain a defensible scope and stopping criterion before
editing. No universal 80%/100% threshold, required test count, or mandatory test
layer. A numeric user target remains a requirement; report it unmet when it is
not reached. Select tools from the installed project and current interfaces;
do not install an agent framework to run this workflow.

## Establish an honest baseline

Read project instructions, manifests, relevant CI/test configuration, and
representative tests. Map owned source, public entry points, key dependencies, and existing test
layers. In a monorepo, inventory relevant packages before selecting commands;
do not treat one package's results as whole-project coverage.

Run the relevant existing tests and coverage before modifying tests. A bounded
worker runs the affected suite; a repo-wide assignment establishes the broader
baseline. Use an existing parent baseline only when its commands, scope, and
source state are recorded and still applicable. Record commands, exit status,
passing/failing/skipped counts, runtime, and source revision
or relevant dirty-state details. Separate pre-existing failures from regressions.
If a full baseline is blocked, keep working on independently runnable scope and
label the missing evidence; do not present a partial suite as green overall.

Measure line and branch coverage for the declared target where supported,
separately by package/language when necessary. Verify inclusion of in-scope
owned executable source, especially files
never imported by tests. Inspect source maps and exclusions. Unsupported branch
coverage is “unavailable,” not zero or 100%. Inspect raw totals too: a zero-branch
denominator can display 100% for unexecuted source. Label missing/partial
denominators and do not present those aggregates as fully comparable coverage.
If instrumentation is absent, add the smallest conventional local setup in
scope, then measure a baseline before test
expansion. A focused assignment need not add repository-wide instrumentation;
if setup falls outside write ownership, use available evidence and return the
measurement limitation or request the smallest specific ownership change.
A failed provider is not evidence that coverage is impossible; inspect
the tool's actual support and try a suitable project-native route.

Keep baseline and final measurement scopes comparable: same source set,
instrumentation, exclusions, and test scope. Disclose and rebaseline necessary
measurement changes. Never inflate results by narrowing collection to exercised
files, lowering thresholds, deleting assertions/tests, adding ignores/skips, or
removing production code just to shrink the denominator.

## Choose what deserves protection

Create a compact behavior map in the repository's existing test documentation,
or a task-local report when no maintained location exists. Keep it proportional:
a bounded worker may use a short handback table. For each material in-scope gap,
record: behavior and its source of truth, plausible failure, impact/likelihood,
current evidence, chosen test boundary, and status. Use public contracts, specs,
callers, and established examples to derive expected results. Reading today's
implementation is useful for finding paths, not sufficient to define correctness.

Prioritize authorization/isolation, data integrity, money, irreversible state
transitions, and core user journeys when present; then error recovery, boundary
conditions, and frequently changed logic. Coverage holes and complexity guide
this map, but a heavily executed path with no meaningful assertions can be a
higher priority than an uncovered getter. Mark uncertain behavior for resolution
instead of blessing it with a snapshot.

Choose the cheapest reliable test boundary that can expose the actual failure:

- Unit tests for decisions, transformations, and boundary values.
- Integration/contract tests for persistence, serialization, adapters, and
  cross-component behavior. Exercise real local boundaries when feasible; mock
  external services at their edge, not the behavior under test.
- A small number of end-to-end journeys when real user wiring is a material
  risk. A library or CLI may need no browser tests at all.

## Improve in coherent batches

Add high-value tests using existing fixtures, naming, runner, and conventions.
Assert observable outputs and side effects, including absence of forbidden
effects on rejected inputs. Cover relevant success, rejection, boundary, and
recovery behavior. Test doubles must not manufacture the result being asserted.
Avoid broad snapshots, implementation-detail assertions, tautological expected
values computed by the same production algorithm, and duplicate cases that add
maintenance without detecting a new fault.

Control clocks, randomness, temporary resources, and network access. Await work
and assert the intended failure type; an arbitrary crash must not satisfy an
error-path test. Keep fixtures disposable and isolated from real user data and
production services. Do not run destructive or paid live operations merely to
measure coverage.

Run focused tests after each batch, inspect the resulting gaps, and choose the
next batch by remaining risk. If tests reveal a probable production bug, retain a
clear reproducer and document it. Fix it only when the task/instructions authorize
behavior changes and the contract is clear; otherwise report the bug as unresolved.
Never change intended behavior or weaken a test just to obtain a green suite.

## Prove the tests discriminate

For newly protected high-risk behavior, demonstrate that a plausible violation
causes the intended assertion to fail, then that the correct code passes. Prefer
an existing targeted mutation runner or a narrow fault challenge in an isolated
copy. Read [fault-checks.md](references/fault-checks.md) when performing this step
or choosing property/stateful/differential tests. A test on existing correct code
can pass immediately; there is no requirement to rewrite production code or
manufacture a failing baseline.

Distinguish assertion-detected faults from syntax/import/setup failures, timeouts,
unexecuted mutants, and equivalent changes. Fix weak assertions exposed by valid
survivors. If fault challenges cannot run, state why and the resulting evidence
limit; do not claim mutation verification. Scale deeper techniques to actual
risk and available tools: properties, adversarial inputs, state sequences,
concurrency schedules, or differential checks against an independent oracle.
More capable agents should investigate deeper failure mechanisms, not chase a
larger test count. Do not add tools or multi-agent machinery without a concrete
benefit and applicable authority.

## Verify and leave maintainable evidence

After the last edit, run the full affected suite, regenerate relevant coverage,
and run required checks within the assignment. The parent owns broader repository
checks after integration; a worker identifies those it has not run. Repeat a new
test only when nondeterminism, a failure, or a later edit warrants it. Check that
no temporary fault, debug hook, unexpected
snapshot update, or unrelated change remains. Preserve original test commands;
add a reproducible coverage command and lightweight regression guard to existing
CI when in scope and supported. New thresholds must come from measured results
and project goals, not arbitrary round numbers; do not lower existing gates.

Finish when the requested target/scope is satisfied, material in-scope risks have
verified tests or an explicit unresolved status, and applicable checks pass. If
access, runtime, ambiguity, budget, or diminishing returns force an earlier stop,
deliver the useful verified work and mark the remaining scope unfinished. Do not
call a project “fully covered” from an aggregate percentage.

Report concisely, using the handback contract in
[agent-handoff.md](references/agent-handoff.md) for delegated work and linking to
detailed evidence when useful:

- Scope and result: completed criteria versus unfinished or blocked items.
- Comparable before/after line and branch coverage, with source scope, exclusions,
  and unavailable metrics identified. No invented percentages.
- Important behaviors newly protected and representative test locations.
- Exact verification commands/results and fault challenges actually observed;
  distinguish existing failures, new failures, and unrun checks.
- Remaining risks, discovered bugs, and the highest-value next gap. Include
  reproducible seeds/counterexamples where applicable.

Keep reusable commands, minimal behavior documentation, and deterministic tests
in the project. Keep bulky logs, raw coverage, and temporary challenge artifacts
in ignored task outputs. Do not copy private project findings into global skills.
Improve this workflow only from demonstrated failures or evaluated improvements,
without silently rewriting global guidance during an ordinary coverage task.
