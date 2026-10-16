# Worker dispatch contract

Send a focused assignment, adapted to the actual project:

> You are a worker in a human-approved supervisor run. High-level objective:
> [objective]. Your task: [observed gap and intended result]. Create your own
> native goal in THIS chat for this focused task, without configuring budgets.
> If native goal tools are unavailable or creation fails, report the exact
> limitation and stop; do not pretend that a final turn is a completed goal.
>
> Work in [actual project/checkout or explicit allowed paths]. Preserve unrelated
> work. Scope/non-goals: [boundaries]. Acceptance checks: [observable checks].
> Relevant context: [files, reproduction and existing decisions]. Follow the
> project's test ownership and repository completion instructions. Ask before
> materially changing intended behavior. Do not create further user-visible
> chats or message the supervisor; it will read this chat directly.
>
> Inspect your goal with native tools and verify the actual result before
> completing it. Return changed files, commands/checks and results, unresolved
> limitations, and the actual native goal status/response with your chat ID in
> your final report. Never fabricate a tool response. Report an active/paused/
> blocked goal honestly. If asked to stop, cease work at the next opportunity,
> pause the goal under that human instruction, and acknowledge it here.

The supervisor should include just the context needed to execute, without
prejudging an independent review's conclusion. Only one worker writes shared
state at a time. A correction stays with the same worker where possible.

The supervisor independently checks the result. Goal snapshots in a worker's
report help identify lifecycle state but do not prove semantic correctness.
Where the supported chat reader omits native goal events, describe snapshots
as reported tool results rather than independently authenticated telemetry.
