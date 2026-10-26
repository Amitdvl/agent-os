---
name: goal-supervisor
description: Recommend and, after explicit human approval, run a native goal supervisor with bounded subagents by default and separate worker chats when independent lifecycle is useful. Review outcomes and choose valuable follow-up work under a high-level objective.
---

# Goal Supervisor

Keep the high-level objective in the supervisor chat's native goal. Delegate
bounded passes to internal subagents by default. Use separate worker chats when
their independent lifecycle or direct human visibility provides a concrete
benefit. Review the actual result, then choose the next valuable pass. Finish
only after an independent final auditor accepts the current result with no
important actionable gap remaining.
Do not configure cycle, time or token budgets unless the human requests them.

## Define the outcome

Before dispatching, draft a short outcome brief from the human's objective and
the actual project. State who benefits, the main user journey, observable
success, constraints and non-goals, and important assumptions. For visual work,
use existing design conventions and supplied references; surface missing taste
preferences only when they materially change the result. The human should not
need to supply the technical task list.

Include this brief in the initial approval proposal. One approval covers the
brief and the run within the authority boundary below; avoid routine planning
or phase gates. If the human has already explicitly approved a concrete supervisor run, reuse that authority
and state any inferred details. Resolve material scope or product ambiguity
before dependent work. Refine implementation details from evidence without
silently replacing the approved outcome. Keep the brief in the existing run
note, rather than creating another planning system.

## Offer before starting

Once the human has defined an objective that benefits from iterative discovery,
proactively recommend this workflow in the native human question box. State the
objective and ask whether to start a supervisor that may delegate to subagents,
create and message separate worker chats when useful, review their results,
choose further in-scope work, and obtain an independent final audit with
corrections before completion. Offer “Start supervisor” and “Keep normal
execution.” Leave the run off until the human explicitly approves.

Loading this skill, defining an objective, ordinary implementation approval,
preselection, silence and a tool response saying a question was accepted are
not approval. Observe the actual human answer. If the native question tool is
unavailable, disclose that and ask in ordinary text; do not fake a question box
or dispatch workers while awaiting an answer. Do not repeat a declined offer
without a material scope change or a human request. A clear human approval of
the concrete supervisor proposal already given covers the run; do not ask again.

One approval covers dispatching, messaging and following up with subagent or
separate-chat workers and a final auditor for the agreed objective. Honor any
human restriction on worker type; the default does not override it.
Apply the human authority boundary below throughout the run.
Do not turn run approval into permission for unrelated external actions.

## Human authority boundary

Before dispatching each pass, authorizing a worker's proposed next step, or
executing it yourself, classify its actual effects against the approved brief.
Ask the human and wait for an explicit reply before either of these changes,
unless that human already explicitly approved the concrete target and action:

- **System-wide changes:** installing, updating, replacing or removing shared
  toolchains, SDKs, drivers, runtimes, global packages or services; changing
  global PATH, security settings or other machine configuration. This includes
  user-global installs that affect other projects and changes on remote hosts.
  Lack of administrator privileges does not make a shared install project-local.
- **Major scope expansions:** adding a material feature, integration, platform,
  workflow or operating commitment beyond the approved outcome/non-goals, or
  materially increasing its resource use, cost or risk. Implementation discovery
  within that outcome is routine; a new deliverable is not silently in scope.

A broad objective such as “migrate everything” or “make it work,” an
agent-drafted goal, supervisor technical review, worker recommendation or final
auditor acceptance does not supply this human approval. An OS/UAC prompt is
not a substitute for the supervisor asking before launching an installer.

Prepare a concrete, reviewable proposal first using read-only inspection,
metadata, dry runs or project-local prototypes. Explain the target host, exact
components/action and scope, why it is needed, expected impact (including
size, reboot, cost or persistence when known), and viable project-local or
reduced-scope alternatives. Use the native human question box when available;
otherwise ask in ordinary text. Do not run the install, dispatch the expanded
implementation or perform dependent mutations while waiting. Continue useful
independent work within the approved scope. Record the actual human reply and
what it authorizes in the run note, and pass that reference to the worker.
Recheck if the proposed action materially changes; do not ask again for the
same already-approved action. A human rejection or deliberate human
cancellation is not authority to retry through another installer, privilege path or worker.

Keep ordinary project-local work autonomous: source edits, local dependency
installs inside the project or its isolated environment, tests, builds and
reversible implementation choices within the approved outcome need no new
approval. Classify commands by effects, not names: a package script that changes
shared tools still crosses the boundary. This narrow human checkpoint takes
precedence over general local-work autonomy; it creates no routine phase gates.

Workers must stop the gated branch and report a concrete proposal to the
supervisor if authority is missing, even if a supervisor says “plan reviewed;
proceed.” The supervisor asks the human; an agent cannot approve for them. This
is an instruction-level safeguard, not a tool-enforced installation lock.

## Establish the supervisor

At the start or resumption of an approved supervisor run, use the supported
`set_thread_title` tool to name this chat `#SV <short outcome title>`. Keep exactly
one `#SV ` prefix on later renames and retain it after completion so supervisor
chats remain identifiable. Apply it to the supervisor, not its workers or auditor.

Verify native goal tools for the supervisor and supported coordination tools
for the chosen worker type. Subagents need spawn, follow-up, result/state and
stop controls; separate chats need app create, wait, read and message tools
and their own native goal tools. Use installed schemas. Verify each new worker's
actual access and requested model/reasoning
settings through supported runtime or host state. Local defaults, a role name and
prompt instructions do not establish inherited permissions. If a required setting
is missing, keep that assignment pending, report the exact supported correction
and continue independent work; do not silently relax the human's requirement.
Missing chat tools do
not block a run that can use subagents throughout. If a required capability has
no supported alternative, report it and leave the dependent work unstarted;
never substitute a private app bridge or a claimed native goal. Verify that an
independent agent can inspect the result before promising audited completion.

Use `get_goal` in this chat. Reuse a matching active objective; create the
approved high-level goal with `create_goal` if none is unfinished. Preserve an
unrelated unfinished goal and resolve the conflict with the human through
supported controls. Never mark another goal complete to replace it. A deliberate
pause requires human resume authority; context recovery does not grant it.

Keep a short, explicit run note in the project, for example
`work/goal-supervisor.json`: objective, scope, actual human approval reference,
supervisor identity, worker kind (`subagent` or `chat`), actual identity, assignment
and lifecycle state or pending dispatch, accepted results,
review evidence, remaining gaps and final reason for stopping. Track proposed
system-wide changes or major scope expansions, the actual human approval or
rejection references, and pending decisions separately from agent reviews.
Include auditor identity or pending dispatch, the reviewed state, verdicts, findings, corrections
and re-audit evidence; retain earlier findings and their resolution. Use the current
chat and this inspectable artifact for recovery, never a hidden memory store.

## Supervise

### Keep the active outcome visible

Keep the original approved brief and explicit human amendments as the authority.
In the existing run note, maintain a compact current milestone: observable
acceptance, relevant matrix/backlog items, established evidence, unresolved
critical uncertainty and next action. A matrix describes coverage; it does not
automatically determine work order or make unequal rows a progress percentage.
Prefer a thin complete main journey before broad supporting infrastructure when
dependencies permit. Completing that milestone does not complete the whole goal.

For a human amendment, identify what it adds, replaces or withdraws and invalidate
dependent assumptions. Preserve the remaining requirements. Treat questions and
status requests as questions, not silent scope changes or authority to restart
paused work. Do not reset the goal/chat merely because a run is long. On recovery,
read the approved brief, current state and needed evidence; expand historical
records only to resolve a specific gap, rather than replaying every report.

### Choose the worker type

Use an internal subagent for a bounded investigation, implementation, test or
review pass. Give it a focused assignment and the context needed to perform it;
choose fresh context or inherited history deliberately using the supported
spawn options. A subagent does not share the supervisor's native goal and is
not required to create one. Its final report is assignment evidence for the
supervisor to verify, not completion of the supervisor goal.

Use a separate worker chat when the pass needs its own persistent native goal
and independent continuation, direct human steering/revisiting, a different
project or host, or another concrete lifecycle/configuration benefit that the
available subagent interface cannot provide. Length or file count alone does
not require a new chat. Record the reason in the run note. If subagent tools
are unavailable, a supported separate chat is a fallback; disclose that reason.
Each chat worker creates and manages its own focused native goal.

When useful independent work is waiting at a team limit, verify the limit's actual
scope: nested agents may share one team limit, while separately scheduled chats
may provide additional capacity. Do not assume either arrangement. With human
authorization for worker chats, evaluate that option and verify simultaneous
execution before claiming extra capacity. Split broad work by independent regions
or domains where useful, give each group clear ownership and integration duties,
and keep finished batches flowing into the product. Avoid a fixed project-wide
worker count; expand only while useful work, resource capacity and integration
throughput support it. Worker count alone is not outcome progress.

Keep the supervisor's native goal active across passes. Neither worker type
shares it. Switching worker type must preserve the assignment, evidence and
authority records, and reconcile the previous worker before any replacement
can write. Do not create a second writer to work around an unknown launch,
unavailable worker state or deliberate pause.

### Dispatch and follow the pass

Inspect the project and intended behavior. Discover work from evidence. Before
each pass, identify the current obstacle to the outcome, the observation or
important uncertainty supporting it, the expected improvement, and how to check
whether it helped. Select the smallest useful next move accounting for
dependencies and risk; compare alternatives only when the choice warrants it.
Do not force numeric scores or a fixed research/code/design sequence.

A pass may investigate an assumption, research alternatives, prototype, simplify,
implement, design or verify. Choose the discipline from the obstacle. Research
earns its place when its answer could change a consequential decision. Avoid
speculative polish, local improvements that do not help the objective, repeated
attempts without new evidence and tasks invented merely to keep running.

For supporting research, harness, tooling, documentation or review work, name the
required milestone behavior it unblocks, the unresolved question, the cheapest
discriminating experiment/check and its exit condition. End or redirect that
branch when the question is answered or another attempt lacks a changed
hypothesis, input or useful observation. A valid negative result may resolve a
critical uncertainty; no feature commit is required on every pass. Do not invent
fidelity, weaken acceptance or bypass necessary verification to manufacture
visible progress. Do not let a support artifact silently become the deliverable.

Before launching, reconcile the run note against supported agent or chat state.
Follow an existing worker before creating another. Persist dispatch intent with
a unique marker, worker kind, focused task and project target before spawning
or `create_thread`; save the returned actual identity immediately. For an unknown
subagent launch, inspect the supported agent inventory/state and available
messages/results. For an unknown chat launch, inspect matching chats and their
initial prompts using `list_threads`/`read_thread`. Do not retry an uncertain
launch until resolved; if the interface cannot reconcile it, report the gap and
leave replacement dispatch pending. A queued client ID is not a ready thread ID.
Never guess identities or silently duplicate work.

Run independently actionable implementation, testing and review tracks in
parallel unless a concrete dependency, atomic shared-state operation, unavailable
capability or coordination/resource cost makes that counterproductive. Parallel
feature writers are the default; do not funnel all production work through the
supervisor or impose one writer for the whole project. Give each writer an
isolated worktree or disjoint mutable surface. Keep one writer per shared mutable
surface in a checkout, serialize only conflicting changes, and let the lead own
integration, conflict resolution and verification. Record the specific reason and
affected scope whenever useful parallel work is deferred; revisit it when the
constraint changes. Do not create filler tasks or unnecessary supervisor layers.
Workers may coordinate bounded internal subagents when useful and authorized,
within the same actual concurrency limit and explicit ownership boundaries.
For a project chat,
resolve its actual project through `list_projects`; preserve the current
checkout unless worktree isolation was requested. Projectless workers need
explicit allowed paths. Subagents use the approved checkout and explicit write
scope; spawning does not itself isolate files. Preserve normal model defaults:
subagents inherit the parent unless explicitly configured, and new chats use
the host's configured model unless the human requested one.
Read [the worker contract](references/worker-contract.md) when
dispatching or correcting a worker.

For subagents, use supported waits of at most 60 seconds and inspect delivered
reports and agent state; a notification alone is not a verified result. Use the
follow-up task control to start another turn for an idle subagent; a message
alone may not resume it. Persist accepted reports/evidence in the run note so
recovery does not depend on an old agent handle remaining available.

For chats, use cursor-aware `wait_threads` calls of at most 60 seconds. A timeout
or finished turn is a reason to inspect, not proof of a completed worker goal.
Chat workers create and inspect their own goals, never through a second
app-server client. A saved goal response is assistant-reported evidence; do not
label it independent telemetry when the reader omits native goal events.
For both kinds, check actual files/diff, behavior, tests and remaining limitations.

## Review the work and its contribution

Use evidence appropriate to the assignment:

- Research: verify consequential claims against relevant primary sources,
  check applicability and freshness, consider credible alternatives and
  counterevidence, and distinguish findings from assumptions.
- Implementation: inspect the diff and exercise the relevant behavior,
  including meaningful failure cases. Follow project test ownership rules.
  Passing tests alone do not establish that the user's outcome improved.
- Design and writing: inspect the actual rendered experience or finished
  artifact against its intended audience, journey, references and project
  conventions. Exercise changed interactions and applicable accessibility or
  responsive behavior. Describe subjective judgments honestly; do not infer
  visual quality from source code or fabricate a human preference.

After each pass, explain what changed for the beneficiary and whether the
expected improvement occurred. Check that research conclusions, implemented
behavior, copy and appearance agree where they interact. Update assumptions
that the evidence overturned. A worker's completion report is input to this
review, not its conclusion.

Record a short contribution receipt in the existing run note: milestone,
observed behavior improved or critical uncertainty resolved, evidence and its
source/artifact state, remaining gap and next action. Test/report/commit counts,
green checks and confident summaries alone do not establish contribution. For
research-only or non-software outcomes, use the corresponding decision or
deliverable evidence rather than imposing a playable/UI criterion.

Reuse accepted evidence while its relevant artifact, environment, assumptions
and scope remain valid. Recheck affected behavior after relevant changes,
failures or a concrete nondeterminism concern, and run required integration and
final checks. Preserve verified checkpoints and original failures; distinguish
a product correction from an oracle/harness correction. Do not rerun unchanged
successful checks or re-review the same candidate merely for greater certainty.

### Detect and correct drift proportionately

At pass boundaries, compare the contribution receipts with the active milestone.
Repeated investigation without a new decision-relevant observation, repeated
verification without a relevant change, and support work repeatedly postponing
the main journey are warning signals. Two consecutive passes without an
outcome improvement or resolved critical uncertainty are a default diagnostic
trigger, not a validated optimum, spending budget, automatic failure or stop.
One clearly contradictory action can warrant earlier diagnosis. Distinguish
ordinary long execution, necessary prerequisite work, access/usage failures and
deliberate pauses from drift. Do not infer token waste from wall-clock time.

First diagnose from current raw evidence and credible alternatives: justified
progress, uncertain, or drift supported by evidence. Allow a no-drift verdict;
do not ask an advisor to find waste or redesign a healthy run. Keep routine
diagnosis with the supervisor, using the independent challenge below only when
its disputed or consequential judgment earns it. Do not establish a standing
reviewer, scheduled LLM polling or another audit framework.

When drift is supported, choose a concrete next action toward the same outcome,
name support work to defer and the evidence that would justify resuming it, and
verify the correction through subsequent actions and artifacts. An admission,
new plan or apology is not recovery evidence. An unresolved warning should not
be followed by another unchanged support pass: use a discriminating experiment,
implementation, simplification or report the concrete missing decision/access.
Keep valid tests, honest unknowns, scope and human authority intact. No-drift
findings permit ordinary continuation; they do not authorize a paused actor to
resume. Optional improvements do not become new acceptance gates.

Keep diagnosis overhead proportional and do not repeatedly read full histories.
If the human requests a spending/time/token limit, verify the installed control
and which actors it actually covers before promising enforcement. Distinguish
runtime-enforced limits from prompt instructions and unavailable usage data;
never imply that a supervisor limit automatically includes its workers. Do not
configure a budget without the human's request.

Use an independent challenge for a consequential disputed or weakly supported
decision, with raw evidence and no desired verdict in the assignment. A
separate chat is not a guarantee of independent judgment. Keep routine review
with the supervisor; do not create standing specialist roles or a review
ceremony for every pass. The final audit below is required for every completed
supervisor run.

Reject a confident success claim if an acceptance check fails. Send specific
in-scope correction to the same worker and verify again. Resume an idle subagent
with a focused follow-up assignment. For a chat whose goal is still active,
observe its continuation; if completed prematurely, instruct that worker to
establish a new focused correction goal. Do not launch a competing writer.
Respect a deliberately paused/stopped worker of either kind and obtain human
resume authority before restarting it. Reconcile an unavailable worker's state
and write effects before replacing it, carrying forward unresolved findings.

After accepting a pass, update the run note, reconsider the whole objective,
and dispatch the next independently useful tracks for observed important gaps. Keep the
supervisor goal active across progress turns so native continuation can carry
the review forward without another human nudge. Native usage limits, app
lifecycle and ordinary permissions still apply; there is no background daemon.
Keep human-facing updates focused on outcomes, consequential findings and the
reason for the next move. Keep worker coordination in the run note.

## Final audit and correction loop

After the supervisor's whole-result review and before calling `update_goal`
with `status: complete`, obtain an independent final audit. Read
[the auditor contract](references/auditor-contract.md) when assigning or
correcting this review. Use a fresh internal subagent with bounded read-only
scope and fresh context (no inherited conversation where supported); otherwise
use a separate auditor chat under the approved chat authority. It must not be
the supervisor or an implementation worker, and
must not delegate further. If no independent reviewer is available, leave the
goal incomplete and report the missing capability; self-review is insufficient.

Give the auditor the original outcome brief, worker identities and actual
outcomes, raw artifacts/diff, verification records, human authority records for
system-wide changes and scope expansions, outstanding decisions and
the supervisor's proposed completion summary. Supply evidence locations and
access, not just a reassuring narrative or a requested verdict. Let it inspect
worker chats through supported readers or saved subagent assignments/results;
disclose omitted records or access limits. Record the actual state being reviewed, including
uncommitted changes and relevant artifact identities. Wait until writers have
stopped and keep that state stable while the auditor reviews it.

The auditor returns `accept`, `revise` or `incomplete`, with checks performed,
material findings, optional observations and evidence limits. Record its actual
response. Missing, failed, interrupted or unverifiable communication leaves the
audit pending or incomplete; a finished turn alone is not acceptance. Follow the
same dispatch-reconciliation and deliberate-pause rules as for workers; do not
launch a duplicate reviewer while a launch or review remains unresolved.

For `revise`, the supervisor triages each material finding against the objective,
sends concrete corrections to the existing worker where possible, and verifies
the changed result itself. Evidence or report defects may be corrected by the
supervisor. A disputed finding goes back to the auditor with counterevidence;
the supervisor cannot silently dismiss it or substitute its own acceptance.
Return the changed state and resolution evidence to the same auditor for
re-audit, including affected neighboring behavior. If that auditor is
unavailable, reconcile its state before assigning a replacement, and give the
replacement the original evidence and unresolved findings. An `incomplete`
review requires the missing evidence, access or decision before acceptance.

Keep this loop in scope. Optional polish does not block acceptance. If a material
finding cannot be resolved, report it and leave the goal incomplete; ask the
human only for a genuine decision or access need. Do not repeat unchanged work
or add a budget unless requested. Preserve stop and pause instructions.

Only an explicit auditor `accept` for the current outcome and result, with no
unresolved material finding and the supervisor's own checks satisfied, permits
completion. Any subsequent material artifact, scope or evidence change makes
that acceptance stale and requires re-audit. This is a required workflow
checkpoint, not an application-enforced lock on native goal tools.

## Finish, wait for decisions, or stop

Before completing, return to the outcome brief and exercise the main user
journey or inspect the complete deliverable as a whole. Check for important
omissions and contradictions between disciplines, and verify consequential
assumptions that still govern the result. Make the comparison with the initial
state explicit where evidence permits; mark an unknown baseline as unknown.

Complete the supervisor goal only when that review supports the approved
outcome, finds no remaining important actionable gap within scope, and the
final auditor has accepted the current result under the checkpoint above. Record
the evidence, residual limitations and why further work is unnecessary; leave
optional ideas alone. An untested material requirement remains incomplete,
even if every worker finished its assignment. If important work needs access or a product
decision, report exactly what remains and ask once. Do not dispatch dependent
work or claim completion while waiting. Use native blocked status only when
its actual tool criteria are satisfied, and paused only on human instruction.

On a human stop, launch nothing further. For an active subagent, communicate the
stop instruction and use its supported interrupt/stop control. Verify a stopped
or idle state with no active work, or an explicit stop acknowledgment; do not
wake it merely to obtain an acknowledgment. Do not send a follow-up that
restarts it. For an active chat worker, send an explicit stop-and-pause
instruction and inspect its acknowledgment/state and reported native goal status.
Pause this supervisor goal too when authorized by that stop.
Stop an active auditor too through its supported agent/chat controls and
inspect its acknowledgment or state; an internal auditor has no shared native
goal. Record a pending stop when neither supported state nor acknowledgment
establishes that work stopped; disclose any unresolved instruction delivery.
Messaging is cooperative and may wait for the current tool call to finish;
pausing the supervisor alone does not establish that another actor stopped.
Provide the available worker link/control if immediate manual intervention is
needed. Never promise an atomic global kill switch or silently undo a human pause.

Report the accepted worker outcomes, meaningful verification, final auditor
verdict and material corrections, remaining decisions or limitations, and why
further work is unnecessary. Do not describe pending or stale review as passed.
This is a discoverable Codex workflow, not a guaranteed application hook or an
enforcement boundary.
