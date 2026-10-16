# Cover Project evaluation

The default `$cover-project` skill is distributed in the core pack. It remains
self-contained and normally eligible for automatic invocation. Core policy routes
substantive testing gaps to it, including bounded assignments during implementation,
while keeping routine single-test work lightweight and honoring explicit choices.

## Initial forward test

The raw project in `tests/fixtures/cover-project/` is a maintained behavioral
evaluation fixture, not an example of a good final suite. Its initial smoke test
deliberately has no assertions, and its initial coverage command misses a source
file that no test imports. The README supplies an independent product contract.

An independent executor received only the skill, a disposable copy of that
project, and this task: cover the project, preserve production behavior/source,
use no services or installs, and keep all changes in the isolated evaluation
workspace. The lead reviewed the generated tests and faults, independently reran
the tests, coverage, and four fault challenges, and verified unchanged production
source hashes. No evaluator artifacts were installed into the live project.

Observed on Node v26.11.1:

| Check | Baseline | Result |
| --- | --- | --- |
| Tests | One passing smoke test, no assertions | 12 passing tests with contract assertions |
| Owned source collection | Formatter omitted | Both modules included, including before test expansion |
| Comparable full-source line coverage | 61.36% | 100% |
| Branch coverage | Partial: provider reported 64.29%; unloaded formatter had no informative denominator | Both executed modules reported 100% |
| Production source | Original fixture | Byte-identical after test expansion and fault checks |
| Isolation | No external dependencies | No installs, external services, or production mutations |

The final tests protect tenant access boundaries, exact monetary effects,
rejection without side effects, idempotency after balance exhaustion, conflicting
keys, tenant-scoped keys, immutable receipts, self-transfers, safe-integer amount
boundaries, and signed formatting.

Four isolated source changes each produced an intended `ERR_ASSERTION` failure:

| Fault | Observed rejection |
| --- | --- |
| Remove destination tenant check | Missing expected forbidden-access exception |
| Debit the source again on replay | Expected balance 900; actual 800 |
| Remove receipt freezing | Expected frozen receipt; actual mutable receipt |
| Remove fractional padding | Expected `0.00`; actual `0.0` |

The lead independently ran `npm test`, `npm run coverage`, and the task-local
Python fault harness. The harness creates separate source/test copies, applies
one mutation per copy, invokes the named Node test, checks the intended assertion
failure, and verifies original source hashes. This is evidence for those four
faults, not a whole-project mutation score.

The empty-denominator observation led to a concrete skill improvement: inspect
raw branch/function totals, mark missing/partial denominators, and avoid claiming
comparable aggregate coverage from a displayed 100% with no measured branches.

## Bounded agent handoff forward test

After adding the agent entry point and handoff contract, a fresh independent
worker received only the skill, a new disposable copy of the same raw fixture,
and a formatter-only assignment. Its source of truth was the README's
`formatCents` contract. Write ownership allowed one new formatter test file and
task-local evidence; source, existing bank tests, package/config, and other files
were read-only. No installs, services, further delegation, commits, or pushes
were assigned. The evaluator withheld this report and expected findings.

Observed on Node v26.11.1:

| Check | Result |
| --- | --- |
| Scope | Formatter only; no bank coverage campaign |
| New tests | Four deterministic tests: padding, signs, safe-integer precision, invalid input errors |
| Verification | Focused 4/4 and full fixture 5/5 passed |
| Scoped line coverage | 0/7 to 7/7 using include-all collection of `src/format.mjs` |
| Branches | Baseline unavailable (0/0); final 8/8 |
| File ownership | Only `test/format.test.mjs` added to project; every original file byte-identical |
| Handback | Status, file list, contract map, source hashes, commands, metrics, fault evidence, limits, parent checks |

The worker used installed command-line flags to measure the unimported target
without changing shared config. It disclosed empty baseline branch/function
denominators and made no repository-wide coverage claim. Five disposable faults
were rejected by intended assertions: missing padding, lost negative sign,
floating-point precision loss, accepting unsafe integers, and wrong exception
type. There were no surviving or inconclusive selected faults; this is not a
whole-project mutation score.

The parent inspected the assertions and raw LCOV, independently reran the focused
tests, full fixture suite, scoped coverage, and all five fault copies, then
compared every original project file and checked the exact added-file set. All
checks passed. Generated tests/logs remain task-local evaluation evidence; the
raw fixture remains unchanged for future runs.

This validates one bounded assignment and its handback on a small JavaScript
project. It does not establish safe concurrent writes, cross-worktree transfer,
every stack, or automatic routing/delegation on every coding request.

## Repeat or extend

Copy the raw fixture to a disposable workspace and give the executor the skill,
README, and the task constraints above. Withhold this evaluation report until
the executor finishes. Judge actual artifacts and run results against the
acceptance checks in `skills/cover-project/references/fault-checks.md`; the exact
number of tests and percentage gain are observations, not required outputs.

For the bounded variant, assign only the README formatter behavior; allow a new
formatter test and an evidence directory, preserving all original files/config.
Use the template in `skills/cover-project/references/agent-handoff.md`, withhold
this report, and check scope, exact write ownership, handback, and parent reruns.

For broader confidence, add independent runs on an existing failing suite, a
project with no tests, a monorepo, and explicit report-only/no-production-change
tasks. Those cases are evaluation criteria, not claimed completed evaluations.
One small JavaScript fixture does not establish effectiveness across every stack
or guarantee automatic selection on every natural-language prompt.

## Implicit implementation routing

Earlier blind implementation trials selected `cover-project` directly but did
not launch a worker: zero child agents across a stateful checkout service and a
modular access/CSV/queue toolkit. Both implementations passed independent
contract checks. This identified a routing gap rather than a lack of workflow
selection: a generic single-executor preference left the testing ownership
decision implicit.

The revised core policy, orchestration policy, and skill entry point require
that decision before test expansion. Separately testable components or material
failure/recovery, isolation, replay, or persistence behavior default to one
bounded coverage worker when tests/fixtures can have separate ownership. Source
can be stabilized first; shared production state alone is not an exception.
Routine work, explicit single-agent requests, an existing coverage-worker role,
unavailable delegation, and concrete cost/ownership constraints stay direct.
The parent still owns integration and final verification.

### Routing rerun results

After the routing change, both fresh implementation executors actually launched
one bounded `cover-project` child without that instruction in their feature
requests. The requests named neither coverage, the skill, nor delegation. Before
the change both comparable cases had used the workflow directly with zero
children; afterwards both used a testing worker. This is an observed two-case
result, not a measured general success rate.

| Parent-verified outcome | Stateful checkout | Modular access/CSV/queue toolkit |
| --- | --- | --- |
| Actual bounded testing child | One | One |
| Maintained final tests | 21 passed | 30 passed |
| Separate acceptance checks | 13 passed | 14 passed |
| Selected assertion-detected faults, independently rerun | 3/3 | 7/7 |
| Final line coverage | 335/335 | 369/369 |
| Final observed V8 branches | 253/254 | 375/387 |

Both workers reported reading the skill and its handoff/fault references before
completion, returned tests and scoped evidence, stayed within test/report/evidence
ownership, and spawned no further workers. Parents reviewed failures, fixed
production defects, coordinated stable source revisions, and independently ran
integrated tests. The toolkit parent could not establish that its own coverage
run followed the final strengthened worker assertions; the worker and outer
evaluator measured the final suite. The evaluator archived artifacts before
revealing the expected selection outcome, inspected actual assertions and fault
harnesses, and independently reran all suite/acceptance/measurement/fault checks.
Final measured source hashes matched; fault checks left production unchanged.

Both workers reproduced three parent-suspected defects each with failing
regressions; these were not independent bug discoveries. The toolkit worker
independently strengthened bulk-expiration and cross-job token checks. A toolkit
token-collision fault initially survived because another guard masked it; a better cross-job collision
assertion caught it on rerun. This is evidence of useful testing work beyond
agent creation or percentage growth.

Limits: these runs used fresh native subagents and explicit reads of normal
global instructions, not fresh top-level App chats. Canonical executor labels
included a blind-test label, and completed reviewer names were visible in the
agent inventory; therefore experimental purpose was not perfectly concealed by
the runtime even though prompts and expected routing stayed withheld. Exact
handoffs/skill reads were corroborated by pre-audit artifacts and retrospective
parent/worker audits rather than a complete native tool-event trace. An early
interrupted run observed a child but is excluded from these completed results.
The comparative toolkit run retained the original export-count assertion; the
maintained fixture subsequently corrected it as described below. Routine
single-test and explicit single-agent exceptions remain policy choices; these
two positive cases do not constitute negative-control tests for those choices.

### Reproduce a blind implementation trial

Run one of these preparers from the repository:

```sh
node scripts/prepare-implementation-eval.mjs checkout
node scripts/prepare-implementation-eval.mjs toolkit
```

The preparer writes a dependency-free project beneath the operating system's
temporary directory and returns a project path plus a neutral `launch` message.
It neither invokes an agent nor modifies installed instructions. Give only that
message to a fresh executor with no evaluator history. Use neutral executor names
and keep evaluator role labels out of its visible context when the runtime
allows. Do not pass this report, expected routing, worker criteria, or any coverage/delegation hint. The request
asks the executor to read its normal installed global instructions and preserve
project-local constraints. A toolkit legacy assertion now checks the original
named exports instead of an exact export count, allowing additive API changes.

Keep the implementation request and initial source fixed when comparing policy
versions. Observe actual child-agent creation, not just a stated intention. Only
after completion, inspect the assignment, skill reads, stable source target,
separate write ownership, worker artifacts, fault evidence, parent review, and
integrated rerun. Independently verify the product contract and selected faults;
a delegated but incomplete implementation is not a successful outcome. Preserve
logs before revealing evaluation criteria. Run trials sequentially if parallel
trials would consume the worker slots being evaluated.

These are synthetic behavioral evaluations. Automatic selection is probabilistic
and depends on installed instructions, tools, context, and resources. Results
from fresh native subagents do not establish identical behavior in a fresh
top-level App chat or another stack. Selected fault checks are not exhaustive
mutation scores, and source expansion makes final coverage percentages
incomparable to the tiny baseline denominators.
