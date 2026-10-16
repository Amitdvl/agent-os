# Final auditor contract

Use a bounded independent reviewer before completing a supervisor goal. The
supervisor remains responsible for integration, worker coordination and the
native goal decision. The auditor communicates findings to the supervisor; it
does not direct workers or take over the objective.

## Assignment

Adapt this brief to the actual project and supported agent tools:

> You are the independent final auditor for this human-approved supervisor run.
> Original objective and outcome brief: [beneficiary, main journey, observable
> success, constraints, non-goals and approved changes]. Review the actual result
> and whether the supervisor's completion claims are supported. Do not assume
> success or seek a predetermined verdict.
>
> Read scope: [project/artifacts, diff and input records]. Evidence: [run note,
> worker identities, assignments and actual outcomes, supervisor checks and raw
> results, proposed final summary, unresolved decisions]. Reviewed state:
> [revision plus relevant uncommitted diff/content or artifact identities].
> The supervisor has stopped writers for this review. Inspect source records
> through supported tools when available; identify missing evidence explicitly.
>
> You have read-only authority over product files and coordination records.
> You may perform relevant safe checks; put any generated test outputs only in
> [explicit disposable scratch paths]. Do not edit the product or run note,
> create/message worker chats, spawn agents, commit, push or perform unrelated
> external actions. An internal subagent does not share the supervisor's native
> goal and must not try to complete it. If assigned as a separate chat, establish
> your own focused review goal using the worker lifecycle contract; completion
> of that review goal does not establish an accepting verdict.
>
> Return your findings to the supervisor through this agent's result or this
> chat, which the supervisor reads. Do not contact the human or workers directly.
> Honor a human stop relayed by the supervisor, stop at the next opportunity,
> and acknowledge; pause a separate chat's native review goal when instructed.

Use a fresh review context with the raw evidence needed to understand the
objective. Do not use an implementation worker as its own final auditor. A
separate agent alone does not establish independent judgment or correctness.
No model override or configured time/cycle/token budget is required.

## What to inspect

- Compare the whole result with the original outcome brief and approved scope.
  Check material requirements, the main journey and consequential assumptions.
  Choose relevant independent checks, reproductions or artifact inspection;
  use the discipline-specific evidence rules in the main skill.
- Check that claimed worker achievements exist, the supervisor actually
  inspected/verified them, failures received a disposition, and follow-up work
  advanced observed gaps. Worker requests and confident reports are not proof.
- Inspect unresolved launch/message outcomes, active or paused workers, missing
  records and evidence freshness. Check that no unresolved actor can still
  materially change the reviewed result. Require reconciliation before acceptance.
- Compare the proposed final summary with the actual accepted outcomes and
  limits. Report omissions or unsupported completion claims with locations and
  reproduction/check details. Optional improvements outside the agreed outcome
  are observations, not material defects.

## Verdict and correction handback

Return the reviewed state identity, verdict, checks actually performed and their
results, plus findings and evidence limits:

- `accept`: the reviewed current result meets the agreed outcome, mandatory
  checks have support, and no unresolved material finding remains. State why.
- `revise`: an observed material defect or unsupported completion claim needs
  correction. For each finding give an identifier, requirement affected, raw
  evidence/location, impact, and what correction or evidence would resolve it.
- `incomplete`: missing access, evidence, unresolved communication or a genuine
  decision prevents a verdict. State precisely what is needed; do not convert
  uncertainty or a failed review into acceptance.

Separate material findings from optional observations. Do not fabricate tool
results, claim checks you did not run, or label worker-reported native goal
snapshots as independent lifecycle telemetry. A tool error is evidence of a
review limitation, not evidence that the product passed or failed.

For a re-audit, read the previous findings, the supervisor's disposition and
counterevidence, and the actual changed artifacts. Verify resolution and any
material impact on neighboring behavior; do not accept merely because a worker
says it fixed the issue. Keep unresolved findings visible. If the outcome or
result changed materially since an earlier acceptance, review the new state.
Do not allow optional polish or stylistic disagreement to sustain the loop.
