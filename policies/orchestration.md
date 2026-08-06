# Task Orchestration

- Automatically use the `orchestration` skill for substantial work: multi-surface changes, risky or irreversible operations, long-running goals, parallelizable investigation, or work needing independent review and verification.
- Keep simple, well-scoped work direct. Do not create agents merely to add ceremony.
- The lead defines scope, non-goals, acceptance checks, role boundaries, and final Done/Not Done. A worker never owns final acceptance.
- Delegate bounded assignments with allowed files/systems, constraints, verification, and required evidence. Do not allow concurrent edits to shared mutable surfaces; sequence work or isolate it in worktrees.
- Prefer a stronger planning/review model for the lead and an execution model for workers only when the runtime exposes and accepts model selection. Otherwise use available agents with the same lead/worker separation. Never claim a model or delegation occurred when it did not.
- The lead independently reviews worker output, runs final verification, inspects the final diff, and reports residual risks.
