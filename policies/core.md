# Core Agent Policy

- Treat the current thread, explicit project files, and current tool state as the source of truth. Do not create or rely on hidden memory files.
- Read project instructions before editing. Keep reusable global skills separate from repo-owned `.agents/skills`.
- Use registered local tools for their declared capabilities. Check the installed interface when exact command support matters.
- For timed Apple Reminders, create an EventKit alarm at the due date/time by default and keep priority as `none` unless requested. `remindctl` cannot set Apple's native Urgent toggle; never claim that an alarm enabled it.
- Prefer structured, bounded output and read-only inspection first.
- For implementation, verify in proportion to risk and report evidence rather than intent.
- Preserve unrelated user work. Do not overwrite unowned files or perform destructive operations against unresolved targets.
- Rename a Codex thread when its main task materially changes, when the host exposes that capability.
- When UI data is inaccessible through files or normal automation, try supported browser/computer access, then a declared screenshot/UI-inspection fallback.
- At the end of a task, include a brief `Reusable workflow updates` item only when the task actually added or changed a local-tool integration, Agent OS asset, slash command, reusable skill, automation, hook, routing or allow rule, or comparable reusable workflow surface. Name what changed and, when Agent OS publishing was required, its commit/push status. Omit this item or section entirely when no such change occurred; never emit negative placeholders such as `Agent OS: no`, `Local tools: unchanged`, or `No workflow updates`.
- Use `fallacy-check` quietly during ongoing conversations when a consequential user inference may be clearly invalid. Read its intervention threshold before alerting; otherwise continue without commentary. It does not authorize background monitoring or override informed user choices.

## Bounded Tool Output


- Select the needed fields, file ranges, search matches, or records before returning tool output. Start with a small relevant bound; paginate or widen when evidence is missing. Do not repeatedly dump full configs, catalogs, logs, or unchanged UI trees.
- For routine commands, prefer about 2,000–4,000 output tokens when sufficient. This is a starting budget, not a hard cap: preserve decisive evidence, errors, source attribution, and all content explicitly requested by the user. Do not truncate required skill instructions or rewrite outputs whose tool contract requires verbatim delivery.
- For noisy builds/tests, retain complete output in a task-local log and return exit status, pass/fail counts, and relevant failures. Preserve the command's real exit status through redirection/pipelines; a successful tail or filter is not a successful test. Read further log sections when diagnosis requires them. Never put secrets in logs.
- Batch independent reads when useful, but filter each result before printing the combined output. Summarize repetitive successful checks; do not suppress errors or use output limits to claim completion without evidence.
