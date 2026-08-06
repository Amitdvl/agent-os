# Task Orchestration

- Automatically use the `orchestration` skill only when the task has multiple independently valuable workstreams with separate deliverables and evidence, or when a sensitive/irreversible external change needs independent risk review.
- Do **not** use orchestration merely because work spans multiple files, has several steps, is lengthy, uses `/goal`, or could theoretically be split. Keep normal features, bug fixes, refactors, UI components, and one-system migrations direct unless they clearly meet an activation condition. When uncertain, keep the work single-agent.
- The lead defines scope, non-goals, acceptance checks, role boundaries, and final Done/Not Done. A worker never owns final acceptance.
- Delegate bounded assignments with allowed files/systems, constraints, verification, and required evidence. Do not allow concurrent edits to shared mutable surfaces; sequence work or isolate it in worktrees.
- Prefer a stronger planning/review model for the lead and an execution model for workers only when the runtime exposes and accepts model selection. Otherwise use available agents with the same lead/worker separation. Never claim a model or delegation occurred when it did not.
- The lead independently reviews worker output, runs final verification, inspects the final diff, and reports residual risks.
