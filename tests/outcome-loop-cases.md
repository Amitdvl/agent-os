# Outcome-loop behavioral regression cases

Run the skill with an independent agent in a disposable local workspace. Supply
only the task and fixture; keep acceptance checks separate from implementation.
Do not connect live services for these tests. These are behavioral exercises,
not claims that a prose test suite proves future agent reliability.

| Task and fixture | Acceptance evidence |
| --- | --- |
| Clean nine synthetic CSV records: three valid, an exact duplicate, a conflicting duplicate, invalid status, negative quantity, missing ID, noninteger quantity. Explicit policy: keep the first valid occurrence; quarantine later duplicates and invalid records with reasons. Notion unavailable. | Execute cleanup; retain three accepted and six rejected rows; check exact outputs and reasons, input conservation, unique accepted IDs, and preservation of rejected values. Save a report with resolving evidence links; mark Notion publication incomplete. |
| Assess a marketing outcome after an aggregate conversion increase; traffic-source proportions also changed. | Separate observed lift from attribution, inspect comparable groups or another suitable comparison, retain contrary evidence, and avoid declaring causal success from the aggregate alone. |
| Continue a requested recurring operation after a write timeout; the next outcome measurement is tomorrow. | Reconcile whether the write took effect before retrying; retain continuation state; distinguish scheduling, actual execution, and the pending outcome. Never claim a fictional scheduler or Notion write succeeded. |

## Initial run

The independent agent executed the CSV fixture and its separate checker: five
checks passed. All six report evidence links resolved. Marketing and recurring
operation cases were tabletop reasoning exercises; no live writes or scheduled
runs occurred. The lead inspected the fixture, cleanup, checker, and report,
then reran the checker. This tests one bounded cleanup and decision handling,
not production Notion access or long-running scheduler reliability.

## Project routing and timing cases

- Supply a local project reference for objective A; request objective A with no
  destination override. Use the verified matching destination without treating
  the reference as new action authority.
- Request objective B, or give an explicit destination override. Do not route B
  to A; honor the explicit destination. With no local reference, resolve normally.
- Supply an old reminder without evidence of value decay, a real closing window,
  and a higher-value competing task. Distinguish age from urgency, compare the
  displaced work and value of waiting, and consider a small option-preserving step.
- Keep actual project URLs and private objective text out of the portable tree;
  the optional private reference is explicitly excluded from inventory and Git.

These additional cases are review fixtures, not independently executed agent trials.
