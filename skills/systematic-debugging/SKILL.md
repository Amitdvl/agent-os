---
name: systematic-debugging
description: Diagnose bugs, failed tests, build errors, and unexpected behavior before choosing a fix.
---

# Systematic Debugging

Use one investigation for the reported failure. Establish the cause before changing
production behavior; scale the evidence to the risk and reproducibility of the bug.
This replaces the former investigate and plugin debugging entry points.

## Investigate and bound the scope

Read the complete error, trace the failing path, inspect relevant recent changes,
and reproduce the symptom. For intermittent failures, record conditions and gather
targeted evidence rather than treating one passing run as a fix.

At component boundaries, inspect inputs, outputs, state and configuration propagation.
Check only whether required secrets are present; never print values, whole environments,
credential files or session stores. Trace bad values back to their first invalid producer;
read [root-cause-tracing.md](root-cause-tracing.md) when the stack points downstream.

State the narrowest affected files or module before editing. Keep unrelated files
outside that boundary. If evidence requires expanding it, explain why and update the
boundary. This is a deliberate edit scope, not an enforced sandbox or installed hook.
Honor any actual user-imposed edit boundary; do not silently expand it.

## Compare and test a hypothesis

Compare a working case with the failing case, including configuration and ordering.
Write a specific, falsifiable cause and test one variable at a time. Temporary logs
or probes must discriminate the hypothesis and must be removed after use.

When evidence contradicts the hypothesis, revise it before stacking fixes. After
repeated failed attempts, reassess the model and affected layer; seek missing domain
information when necessary. Routine local investigation does not need phase approval.

## Fix and verify

Make the smallest change that addresses the demonstrated cause. Add a meaningful
regression check where practical and verify it detects the original failure. Follow
the project's test-ownership policy before substantive suite expansion.

For timing bugs, use [condition-based-waiting.md](condition-based-waiting.md) rather
than arbitrary sleeps. For validation at several trust boundaries, consult
[defense-in-depth.md](defense-in-depth.md) without adding redundant guards everywhere.

Re-run the original reproduction and affected tests, then checks required by project
policy. Report the symptom, evidenced cause, change, actual verification and limits.
If the cause or verification remains uncertain, state that explicitly; do not claim
the bug fixed. Report-only requests remain report-only.
