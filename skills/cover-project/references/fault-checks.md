# Test strength and deeper checks

Read this when demonstrating fault detection or when ordinary examples leave a
material risk untested. Choose the smallest technique that resolves the question.

## Challenge a claim

1. Name a protected behavior and a plausible defect: accepting another tenant's
   record, dropping a transaction rollback, shifting a boundary comparison,
   emitting a duplicate effect, or swallowing a dependency failure.
2. Establish that the focused tests pass on the correct source. Use the current
   final tests, not a stale coverage artifact.
3. Prefer the project's existing mutation tool, scoped to relevant source/tests.
   Otherwise create a disposable isolated copy of the relevant project and apply
   one local fault there. Never mutate a shared working tree or live service. If
   copying an environment is infeasible, use a purpose-built injected dependency
   only when it exercises the same production decision; label the narrower claim.
4. Run the selected tests and inspect why they fail. Count detection only when
   the intended behavior is violated and an appropriate assertion rejects it.
   Invalid programs, import failures, broken fixtures, and runner errors are
   inconclusive. Review timeouts separately; they can expose liveness failures
   but are not automatically assertion kills.
5. For a surviving valid fault, check whether the test reaches it, the oracle is
   meaningful, or the change is equivalent/unreachable under the contract. Improve
   the test for a material gap, or document the reason it needs no new assertion.
6. Remove only task-created disposable challenge outputs when no longer needed.
   Verify original source remains intact and the final suite passes. Record the
   fault, command, observed assertion, result, and any unresolved survivor.

A few targeted challenges demonstrate specific protections. They do not establish
a whole-project mutation score. When reporting a tool's score, preserve its
denominator and list equivalent/excluded/uncovered/timeout categories separately.

## Choose deeper techniques by failure mechanism

| Risk | Useful technique | Avoid |
| --- | --- | --- |
| Parsers, arithmetic, normalization | Property tests: invariants, valid/invalid generators, boundary partitions | Reimplementing production code to calculate expected values |
| Stateful workflows, retries, idempotency | Model-based sequences; assert state and effect counts after each transition | Happy-path-only sequences or a model copied from implementation |
| Concurrency, cancellation, partial failure | Controlled barriers/schedulers, failure injection, cleanup checks | Sleeps as synchronization or nondeterministic race lotteries |
| Interoperability and adapters | Contract fixtures and local integration against real boundaries | Stubbing the boundary and claiming its integration was tested |
| Complex algorithms with a trusted reference | Differential testing using an independent implementation/specification | Comparing two wrappers over the same implementation |
| User journeys | Exercise the actual entry point and persistence/error behavior | Treating “page rendered” as proof that data was saved correctly |

Persist reproducible seeds and minimized counterexamples. Derive properties from
the domain: balances conserve value across transfers; normalization is idempotent;
rejected requests cause no mutation; repeated idempotent requests add no effects.
Round-trip tests need independent validity assertions because matching bugs in
encoder and decoder can cancel out.

## Behavioral evaluation of this skill

Evaluate substantial changes with an independent executor when available and
authorized, using a disposable project and realistic request. Give it the skill,
raw project, and user constraints; withhold the evaluator's expected findings.
Judge executed artifacts, not whether the answer repeats this document.

Useful evaluation cases and acceptance checks:

- **High execution, weak assertions:** seeded tests execute core code without
  checking outcomes. The executor improves assertions and detects a plausible
  fault despite little coverage gain.
- **Incomplete collection:** an owned module is never imported. The executor
  discovers the omission, establishes comparable measurement, and reports it.
- **Existing failure / missing dependency:** baseline has a reproducible failure
  or unavailable service. The executor separates evidence, works on runnable
  scope, and never reports the whole suite green.
- **No-test project / monorepo:** use minimal conventional setup and identify
  package boundaries instead of reporting one package as the whole repository.
- **Strict scope:** report-only or no-production-change instructions are honored;
  discovered production bugs remain reproducible and explicitly unresolved.
- **Routing negatives:** a one-line bug regression, report-only QA, or unrelated
  request does not expand into a project-wide coverage campaign.

Record fixture revision, request, tools, actual commands/outcomes, and residual
limits. Re-evaluate after material workflow changes or demonstrated failures,
not as a background task. Better models may select stronger checks while the
acceptance criteria remain about behavior, reproducibility, and honest evidence.

## Provenance

Independently authored for Codex and Agent OS. The measure → identify gaps → add
tests → rerun → report loop was informed by ECC's
[test-coverage workflow](https://github.com/affaan-m/ECC/blob/main/commands/test-coverage.md).
No ECC runtime, Superpowers dependency, or blanket coverage threshold is required.
