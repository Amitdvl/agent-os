# Bounded coverage assignments

Read this when assigning or executing coverage work as a subagent. A skill is
instructions, not a spawning API: the parent uses its available delegation tool
and supplies this skill's path explicitly. Preserve host delegation policy.

## Parent: give the worker a finishable target

Use a compact brief, adapting fields to the task. Prefer behavior over “get the
number up.” The parent can invoke this during ordinary implementation; the human
does not need to request coverage separately when it is part of the authorized task.

```text
Use $cover-project at <accessible-skill-path>/SKILL.md.
Role: coverage worker. Do not delegate further or commit/push.
Project/worktree: <path and relevant source state>
Target: <behavior and source files; why this gap matters>
Contract: <spec, caller expectations, or explicit expected behavior>
Write ownership: <test/fixture files and any permitted config or source files>
Do not change: <production behavior, shared config, other workers' files, etc.>
Acceptance: <behaviors protected, required checks, any actual coverage target>
Budget/limits: <only when relevant; dependencies, services, runtime>
Return: changed files, test evidence, scoped before/after coverage, fault checks,
        bugs/limits, and remaining integration checks.
```

For example, while implementing a payment retry feature:

```text
Target: retry/idempotency behavior in src/payments/retry.ts.
Contract: docs/payment-retries.md; a timeout followed by a retry must not charge
twice. Rejected requests must leave no charge or completed receipt.
Write ownership: tests/payments/retry.test.ts and its dedicated fixtures.
Do not change production files, package/CI config, or unrelated payment tests.
Acceptance: cover replay, conflicting keys, and failure recovery; prove a
plausible duplicate-effect fault is detected. Run the payment suite. Report
metrics for the declared source scope; no repository-wide percentage target.
```

Record the routing decision in task notes: `delegate: <target, benefit, ownership>`
or `direct: <concrete exception>`. If a stable source batch is needed, dispatch
after that batch rather than treating temporary coupling as a permanent reason
to skip the worker. The parent can review source/docs while the worker owns tests.
An implementation subagent may be this parent when applicable instructions permit;
an already assigned coverage worker must not recursively delegate.

Choose file ownership before dispatch. A shared worktree is suitable only with
disjoint writes and stable inputs; avoid editing source the worker is measuring.
Use an isolated checkout for overlap or necessary production edits. Make intended
uncommitted source changes available there; do not silently test an older commit.
Reserve shared test config/lockfiles for one writer. If the worker needs a wider
write set, resolve that concrete dependency instead of having both agents edit it.

## Worker: complete the assignment

- Verify the project, instructions, target, and writable paths. Infer harmless
  omissions from context; return a precise question/blocker only when the target,
  contract, or safe write ownership cannot be established.
- Apply the main workflow at the assigned scale. A behavior-level target does
  not require a repository audit, all test layers, new CI, or a fixed percentage.
- Measure the named source set including unimported in-scope files. If metrics
  cover a containing module, name that denominator; claim protection only for
  verified behaviors. Targeted collection is honest when explicitly scoped and
  comparable; it must not be presented as whole-project improvement.
- Use task-local evidence when documentation/config is outside ownership. Never
  rewrite shared reports, change ignores/thresholds, or fix production bugs
  outside the brief. Keep a reproducer and return a concrete unresolved finding.
- Run fault challenges in disposable copies, never against another agent's
  working tree. If source changes during testing, identify which revision was
  measured and invalidate stale claims; coordinate or rerun before completion.
- Finish with a usable handback even if blocked. Do not report tests as green
  when expected assertions fail, or call unmeasured scope covered.

## Handback and parent acceptance

Return these facts compactly; link raw artifacts instead of pasting noisy logs:

1. **Status:** complete, partial, or blocked against the stated acceptance checks.
2. **Changes:** files, behaviors protected, and any source/config edits (including
   an explicit statement when production source was preserved).
3. **Evidence:** source state, exact commands/exit results, test counts, comparable
   scoped line/branch metrics and unavailable denominators, plus observed fault
   detection and surviving/inconclusive faults. Omit percentages when measurement
   is unavailable; explain why instead.
4. **Open items:** discovered bugs, missing checks, ownership/access limits, and
   concrete integration actions needed from the parent.

The parent inspects assertions and the actual diff against the brief, including
scope/exclusion changes. For an isolated checkout, bring over only intended files
or commits. Verify the integrated tests against the final implementation, run
the relevant broader checks, and resolve returned bugs/limitations before making
the overall completion claim. Worker evidence applies to its recorded state and
scope; it does not establish repository readiness. The parent owns the ordinary
repository finish flow unless explicitly delegated.
