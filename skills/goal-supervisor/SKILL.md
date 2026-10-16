---
name: goal-supervisor
description: Recommend and, after explicit human approval, run a native goal supervisor that reviews separate worker chats and chooses valuable follow-up work under a high-level objective. Use for open-ended improvement that benefits from repeated discovery and review.
---

# Goal Supervisor

Keep the high-level objective in the supervisor chat. Give each concrete pass to
a separate worker chat with its own native goal. Review the actual result, then
choose the next valuable pass. Stop when no important actionable gap remains.
Do not configure cycle, time or token budgets unless the human requests them.

## Define the outcome

Before dispatching, draft a short outcome brief from the human's objective and
the actual project. State who benefits, the main user journey, observable
success, constraints and non-goals, and important assumptions. For visual work,
use existing design conventions and supplied references; surface missing taste
preferences only when they materially change the result. The human should not
need to supply the technical task list.

Include this brief in the initial approval proposal. One approval covers the
brief and the run; avoid separate planning or phase gates. If the human has
already explicitly approved a concrete supervisor run, reuse that authority
and state any inferred details. Resolve material scope or product ambiguity
before dependent work. Refine implementation details from evidence without
silently replacing the approved outcome. Keep the brief in the existing run
note, rather than creating another planning system.

## Offer before starting

Once the human has defined an objective that benefits from iterative discovery,
proactively recommend this workflow in the native human question box. State the
objective and ask whether to start a supervisor that may create and message
separate worker chats, review their results, and choose further in-scope work
until important work is complete. Offer “Start supervisor” and “Keep normal
execution.” Leave the run off until the human explicitly approves.

Loading this skill, defining an objective, ordinary implementation approval,
preselection, silence and a tool response saying a question was accepted are
not approval. Observe the actual human answer. If the native question tool is
unavailable, disclose that and ask in ordinary text; do not fake a question box
or dispatch workers while awaiting an answer. Do not repeat a declined offer
without a material scope change or a human request. A clear human approval of
the concrete supervisor proposal already given covers the run; do not ask again.

One approval covers creating and messaging workers for the agreed objective.
Ask before materially changing intended product behavior or expanding scope.
Do not turn that approval into permission for unrelated external actions.

## Establish the supervisor

Verify native goal tools and supported app tools for creating, waiting for,
reading and messaging chats are available. Use their installed schemas. If a
required capability is missing, report it and leave supervision unstarted;
never substitute a private app bridge or a claimed native goal.

Use `get_goal` in this chat. Reuse a matching active objective; create the
approved high-level goal with `create_goal` if none is unfinished. Preserve an
unrelated unfinished goal and resolve the conflict with the human through
supported controls. Never mark another goal complete to replace it. A deliberate
pause requires human resume authority; context recovery does not grant it.

Keep a short, explicit run note in the project, for example
`work/goal-supervisor.json`: objective, scope, actual human approval reference,
supervisor identity, active worker or pending dispatch, accepted results,
review evidence, remaining gaps and final reason for stopping. Use the current
chat and this inspectable artifact for recovery, never a hidden memory store.

## Supervise

Inspect the project and intended behavior. Discover work from evidence. Before
each pass, identify the current obstacle to the outcome, the observation or
important uncertainty supporting it, the expected improvement, and how to check
whether it helped. Compare plausible next moves and choose the one that best
advances the whole outcome, accounting for dependencies and risk. Do not force
numeric scores or a fixed research/code/design sequence.

A pass may investigate an assumption, research alternatives, prototype, simplify,
implement, design or verify. Choose the discipline from the obstacle. Research
earns its place when its answer could change a consequential decision. Avoid
speculative polish, local improvements that do not help the objective, repeated
attempts without new evidence and tasks invented merely to keep running.

Before launching, reconcile the run note against supported chat state. Follow
an existing worker before creating another. Persist dispatch intent with a
unique marker, focused task and project target before `create_thread`; save the
returned chat identity immediately. If the call's outcome is unknown, inspect
matching chats and their initial prompts using `list_threads`/`read_thread`.
Do not retry an uncertain launch until it is resolved. A queued client ID is
not a ready thread ID. Never guess or silently duplicate it.

Use one worker writer at a time in the approved project. For a project chat,
resolve its actual project through `list_projects`; preserve the current
checkout unless worktree isolation was requested. Projectless workers need
explicit allowed paths. Use the host's configured model unless the human
requested one. Read [the worker contract](references/worker-contract.md) when
dispatching or correcting a worker.

Use cursor-aware `wait_threads` calls of at most 60 seconds. A timeout or a
finished turn is a reason to inspect, not proof of a completed worker goal.
Read relevant results and check actual files/diff, behavior, tests and remaining
limitations. Native goals belong to their own chats: workers create and inspect
their own goals, never through a second app-server client. A worker's saved goal
response is assistant-reported evidence; do not label it independent goal
telemetry when the read interface omits native goal events.

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

Use an independent challenge for a consequential disputed or weakly supported
decision, with raw evidence and no desired verdict in the assignment. A
separate chat is not a guarantee of independent judgment. Keep routine review
with the supervisor; do not create standing specialist roles or a review
ceremony for every pass.

Reject a confident success claim if an acceptance check fails. Send specific
in-scope correction to the same worker and verify again. If its goal is still
active, observe its continuation; do not launch a competing writer. If its goal
was completed prematurely, explicitly instruct that worker to establish a new
focused correction goal. Respect a paused worker and ask before resuming it.

After accepting a pass, update the run note, reconsider the whole objective,
and choose another worker only for an observed important gap. Keep the
supervisor goal active across progress turns so native continuation can carry
the review forward without another human nudge. Native usage limits, app
lifecycle and ordinary permissions still apply; there is no background daemon.
Keep human-facing updates focused on outcomes, consequential findings and the
reason for the next move. Keep worker coordination in the run note.

## Finish, wait for decisions, or stop

Before completing, return to the outcome brief and exercise the main user
journey or inspect the complete deliverable as a whole. Check for important
omissions and contradictions between disciplines, and verify consequential
assumptions that still govern the result. Make the comparison with the initial
state explicit where evidence permits; mark an unknown baseline as unknown.

Complete the supervisor goal only when that review supports the approved
outcome and finds no remaining important actionable gap within scope. Record
the evidence, residual limitations and why further work is unnecessary; leave
optional ideas alone. An untested material requirement remains incomplete,
even if every worker finished its assignment. If important work needs access or a product
decision, report exactly what remains and ask once. Do not dispatch dependent
work or claim completion while waiting. Use native blocked status only when
its actual tool criteria are satisfied, and paused only on human instruction.

On a human stop, launch nothing further. Send the active worker an explicit
stop-and-pause instruction through the supported messaging tool, inspect its
acknowledgment/state, and pause this goal too when authorized by that stop.
Record a pending stop if delivery or worker acknowledgment is unresolved.
Messaging is cooperative and may wait for the current tool call to finish;
pausing the supervisor alone does not pause another chat. Provide the active
worker link/control if immediate manual intervention is needed. Never promise
an atomic global kill switch or silently undo a human pause.

Report the accepted changes, meaningful verification, remaining decisions or
limitations, and why further work is unnecessary. This is a discoverable Codex
workflow, not a guaranteed application hook or an enforcement boundary.
