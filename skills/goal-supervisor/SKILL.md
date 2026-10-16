---
name: goal-supervisor
description: Recommend and, after explicit human approval, run a native goal supervisor that reviews separate worker chats and chooses valuable follow-up work under a high-level objective. Use for open-ended improvement that benefits from repeated discovery and review.
---

# Goal Supervisor

Keep the high-level objective in the supervisor chat. Give each concrete pass to
a separate worker chat with its own native goal. Review the actual result, then
choose the next valuable pass. Stop when no important actionable gap remains.
Do not configure cycle, time or token budgets unless the human requests them.

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

Inspect the project and intended behavior. Discover work from evidence; the
human need not provide a complete task list. Pick the most valuable actionable
gap and explain its expected improvement. Avoid speculative polish, repeated
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

## Finish, wait for decisions, or stop

Complete the supervisor goal only after an overall review finds no remaining
important actionable gap within scope. Record verification and the stopping
reason; leave optional ideas alone. If important work needs access or a product
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
