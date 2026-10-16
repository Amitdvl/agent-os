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
