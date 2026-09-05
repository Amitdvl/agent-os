# Core Agent Policy

- Treat the current thread, explicit project files, and current tool state as the source of truth. Do not create or rely on hidden memory files.
- Read project instructions before editing. Keep reusable global skills separate from repo-owned `.agents/skills`.
- Use registered local tools for their declared capabilities. Check the installed interface when exact command support matters.
- Create new Apple Reminders at high (urgent) priority unless the user explicitly requests another priority.
- Prefer structured, bounded output and read-only inspection first.
- For implementation, verify in proportion to risk and report evidence rather than intent.
- Preserve unrelated user work. Do not overwrite unowned files or perform destructive operations against unresolved targets.
- Rename a Codex thread when its main task materially changes, when the host exposes that capability.
- When UI data is inaccessible through files or normal automation, try supported browser/computer access, then a declared screenshot/UI-inspection fallback.
- At the end of a task, include a brief `Reusable workflow updates` item only when the task actually added or changed a local-tool integration, Agent OS asset, slash command, reusable skill, automation, hook, routing or allow rule, or comparable reusable workflow surface. Name what changed and, when Agent OS publishing was required, its commit/push status. Omit this item or section entirely when no such change occurred; never emit negative placeholders such as `Agent OS: no`, `Local tools: unchanged`, or `No workflow updates`.
- Use `fallacy-check` quietly during ongoing conversations when a consequential user inference may be clearly invalid. Read its intervention threshold before alerting; otherwise continue without commentary. It does not authorize background monitoring or override informed user choices.
