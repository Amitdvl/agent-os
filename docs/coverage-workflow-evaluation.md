# Cover Project evaluation

The default `$cover-project` skill is distributed in the core pack. It remains
self-contained and normally eligible for automatic invocation. Core policy routes
broad coverage requests to it while preserving narrower tasks and explicit choices.

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

## Repeat or extend

Copy the raw fixture to a disposable workspace and give the executor the skill,
README, and the task constraints above. Withhold this evaluation report until
the executor finishes. Judge actual artifacts and run results against the
acceptance checks in `skills/cover-project/references/fault-checks.md`; the exact
number of tests and percentage gain are observations, not required outputs.

For broader confidence, add independent runs on an existing failing suite, a
project with no tests, a monorepo, and explicit report-only/no-production-change
tasks. Those cases are evaluation criteria, not claimed completed evaluations.
One small JavaScript fixture does not establish effectiveness across every stack
or guarantee automatic selection on every natural-language prompt.
