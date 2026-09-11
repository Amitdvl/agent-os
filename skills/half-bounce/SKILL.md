---
name: half-bounce
description: Improve cold-start readiness in native macOS apps so the first useful surface is interactive before the Dock icon settles, with measured software and physical evidence.
---

# Half-Bounce

Use this workflow when a native macOS app launches correctly but looks or feels
unready during the Dock's launch animation. The goal is a responsive first
surface without weakening correctness, privacy, cancellation, recovery, or
the app's existing readiness contract.

## Boundary

Treat these as two related but separate outcomes:

- **Software readiness:** the app reaches its first useful, interactive surface
  without a regression in tests, cancellation, state recovery, or return
  semantics.
- **Physical readiness:** on a real cold launch, a normal user action works
  while the Dock icon is still bouncing or before it settles.

Do not claim physical readiness from a unit test, a task completion message,
`onAppear`, a successful build, or an installed app that was already resident.
Do not upload recordings, screenshots, telemetry, or source data without exact
user authorization. Do not replace an installed app or change signing,
privacy permissions, focus protections, or external services without scope.

## Lead contract

For a `/goal`, activate orchestration at the beginning. Establish one lead,
bounded worker/reviewer assignments when delegation is available, explicit
acceptance checks, and a final Done/Not Done decision. Keep the work in an
isolated branch/worktree when the checkout or installed app may be shared.
Never claim delegation or a model choice that did not happen. Worker output is
evidence to review, not a replacement goal.

Before editing, record:

- repository instructions, current branch/worktree, and unowned changes;
- the exact launch/build/test/package path and baseline test result;
- the app's first intended interactive surface and what “ready” means for it;
- whether a real-device or display recording is authorized and available.

## Find the real path

Trace the cold-start path from process launch to the first surface a normal
user can use. Identify the app-specific equivalents of:

1. process launch and dependency construction;
2. state/settings/recovery availability;
3. native delegate or scene launch completion;
4. window/menu-bar/overlay presentation;
5. shortcut or primary-action registration;
6. noncritical indexing, persistence, cleanup, or refresh work.

Use the existing readiness callbacks as the source of truth. Do not invent a
single global “ready” flag that hides a missing dependency or moves work past
an invariant. A visible window is not automatically interactive.

## Measure before optimizing

Add or use an opt-in, bounded startup trace only when it can identify the
bottleneck. It should contain metadata-only event names and monotonic offsets,
be disabled by default, impose bounded memory, and avoid text, screenshots,
file paths, document contents, account data, or network transmission. Keep
timestamps nondecreasing if clocks are sampled across threads. Remove or leave
the trace behind its explicit opt-in boundary after validation.

Record the smallest useful stage set, for example:

```text
processLaunch -> appStateReady -> nativeLaunchFinished
              -> firstInteractiveSurface -> primaryActionReady
              -> backgroundWorkReady
```

Map those names to the app rather than copying them literally. Optimize only a
measured stage or an obvious duplicate on the hot path; do not turn the trace
itself into product readiness.

## Implementation rules

Prefer changes that let the first interactive surface arrive earlier while
preserving the lifecycle contract:

- defer noncritical synchronous disk I/O, recovery refresh, indexing, cleanup,
  and telemetry until after the first useful surface;
- make deferred work idempotent, coalesced, failure-tolerant, and observable;
- keep bundled/default assets available if persisted state is delayed or
  corrupt;
- yield to the main run loop when that is the app's safe handoff boundary;
- remove duplicate dismissal, layout, registration, or setup work only after
  proving that the remaining call is sufficient;
- preserve return values and async admission semantics, including the rule for
  when an accepted action is allowed to return.

For capture, editor, media, or privacy-sensitive flows, preserve the app's
existing invariants: freeze before dismissal, cancellation, admission/race
handling, private-content boundaries, recovery, and cleanup. A faster visual
surface is a regression if an action can be lost, accepted work can return too
early, or user data can become visible or persisted incorrectly.

## Verification gate

After each coherent change:

1. run focused tests for startup ordering, deferred work, cancellation,
   admission races, and recovery/error paths;
2. run the complete repository test/CI suite and report the exact count and
   failures;
3. inspect the diff for accidental telemetry, paths, secrets, signing changes,
   or unrelated edits;
4. build the intended Release configuration in task-local derived/output
   locations, then verify the app bundle signature and launch path;
5. do not install or replace the user's current app unless explicitly asked.

If a test uses async state, await the operation before passing its result to an
assertion. A passing compile is not evidence that the race is covered.

## Physical readiness gate

Only run this gate when the user has authorized local recording and the needed
macOS permissions. Use an available local screen tool such as `opencap` or
`peekaboo` according to its own contract; do not assume login, upload, or
permission availability.

For each candidate build, record enough context to reproduce the result:

- clean cold launch, with the Dock visible and the app not already resident;
- the normal shortcut or primary user action, not a synthetic probe;
- a small known-safe interaction that should visibly work;
- the first surface visibly usable while the icon is still bouncing or before
  it settles;
- one resident/repeat launch to separate cold-start behavior from ordinary
  behavior;
- display, scale, appearance, build identity, and relevant configuration.

Keep the video and analysis local unless the user explicitly authorizes a
named destination. If a Bounce Lab or similar analyzer is used, retain its
submission URL/report or local output, exact build/configuration, and the
criterion it evaluated. A public benchmark or another app's report is context,
not evidence for this app.

## Evidence and output

The final report should state:

- commit/build identity and repository cleanliness;
- baseline and final test counts, focused test results, and signature result;
- trace configuration and stage offsets, with no private payloads;
- physical recording conditions and analyzer report, or the precise reason
  that physical evidence was unavailable;
- regressions checked, residual risks, and the next action if blocked.

Use **Done** only when the software gate passes and authorized physical
evidence demonstrates the criterion. Otherwise say **Not Done**, distinguish
software progress from unverified physical readiness, and name the missing
evidence or remaining risk.
