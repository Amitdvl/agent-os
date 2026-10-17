# Regression design

For a reproducible bug, derive the failing case from the intended contract and
observe it fail for the expected reason before fixing production code when
practical. Fix the cause, rerun the case, then check adjacent behavior. A setup
error or unrelated crash is not a useful red result.

For new behavior, a small failing contract test can clarify the interface before
implementation. Refactor once the behavior passes and rerun the affected suite.
Use the project's conventions and risk to choose this sequence; this reference
does not impose universal TDD, a mandatory test for prose or a phase approval gate.

For tests added around existing correct behavior, immediate passing is expected.
Challenge the assertion with a plausible isolated fault rather than changing
production merely to manufacture a red baseline. Read
[writing-good-tests.md](writing-good-tests.md) for independent expectations,
real boundaries and mock pitfalls, and [fault-checks.md](fault-checks.md) for
bounded mutation evidence.

Adapted from Superpowers TDD guidance; see [license](superpowers-LICENSE.txt).
