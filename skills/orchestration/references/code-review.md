# Evidence-based code review

Review a known source state and a bounded diff. Record the base and head or exact
working-tree scope so later changes do not inherit stale approval.

Start with the intended behavior, requirements and non-goals. Trace important
callers and observable effects. Check correctness, rejection without side effects,
recovery, isolation, compatibility, security and maintainability where relevant.
Evaluate the tests' ability to detect plausible failures, not their count alone.

Report actionable findings with location, trigger, impact and supporting evidence.
Distinguish a defect from a preference. Prioritize by actual consequences; avoid
speculative expansion or redesign unrelated to the requested outcome.

When receiving feedback, inspect the cited code and reproduce or reason through
the failure before changing it. Accept supported corrections, explain evidence
against mistaken findings, and ask only when the intended behavior is unresolved.
Do not apply suggestions mechanically or widen authority based on a review.

After correction, rerun relevant checks and review the final state. Follow the
repository's required review/CI process. No generic review menu replaces the
standing completion contract, and no external review service is required.

Adapted from Superpowers review guidance; see [license](superpowers-LICENSE.txt).
