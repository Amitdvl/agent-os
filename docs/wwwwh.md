# WWWWH

`$wwwwh` supplies adaptive inquiry guidance for understanding, discovery, creation,
relationships, decisions and action. What, Why, When, Whether and How generate
questions; their content, count, sequence and lifespan arise from the situation.
A revisable working goal directs attention without prescribing conclusions.

The taste layer pairs purpose with context, receptivity with discrimination,
grounding with revision, clarity with fidelity, attention with proportion,
imagination with resourcefulness, and care with appreciation. Methods are selected
for a contribution rather than applied as a checklist. The requested output can be
an artifact or an action; exploration need not conclude with a plan.

## Invocation and fit

The safe core distributes the self-contained [skill](../skills/wwwwh/SKILL.md) to
supported host skill roots. The installed Commands catalog advertises `$wwwwh`
only when the Codex entry point exists. Use the dollar-sign invocation or explicitly
request WWWWH; there is no custom executable or separate slash-command parser.
Automatic invocation is disabled by `agents/openai.yaml`
(`policy.allow_implicit_invocation: false`). The skill remains installed for
explicit use and is not selected automatically for other requests.

```text
$wwwwh Here is the situation and evidence: …
My working aim is … The constraints are … Please produce …
```

These details are optional. Do not make users formulate a research project to get
help. Exact edits, extraction and settled procedures usually need ordinary direct
assistance. Use specialized skills, sources and testing when the subject requires
them. WWWWH does not supply domain expertise or authority to take external actions.

## Evaluation status

A predeclared paired evaluation used eight development cases and four sealed
holdouts, with fresh sessions, matched inputs and two independent blinded judges.
Both judges found all twelve pairs tied against ordinary assistance, with no
critical regression. The fixed practical-value threshold was not met. Three
exploratory comparisons with the original draft also tied. This supports usable
behavior on the tested tasks; it does not establish incremental benefit,
population-level equivalence, reduced effort or universal usefulness.

The bank covered technical investigation, planning, causal inference, uncertain
decisions, creative work, conceptual exploration, interpersonal response,
misleading goals and simple controls. Sources were real repository snapshots with
replayed or synthetic circumstances, not production telemetry. Additional isolated
workflow checks exercised a code repair and an offline handout. No live user
outcome was measured. The evaluation artifacts and frozen rubrics are retained
with the originating authoring task. Do not market the skill as a proven reasoning
upgrade. Its defensible scope is optional guidance chosen by the user.

## Maintainer checks

Run `npm run validate`, `npm test`, `git diff --check` and the configured twin audit.
`tests/wwwwh.test.mjs` exercises package bytes on both hosts, preview safety,
idempotence, installed-only discovery, and rejection of unowned files or managed
drift without partial writes. These distribution checks do not establish reasoning
quality. Any behavioral revision needs new held-out cases; the published bank is
usable for regression only.
