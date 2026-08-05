# Core Agent Policy

- Treat the current thread, explicit project files, and current tool state as the source of truth. Do not create or rely on hidden memory files.
- Read project instructions before editing. Keep reusable global skills separate from repo-owned `.agents/skills`.
- Use registered local tools for their declared capabilities. Check the installed interface when exact command support matters.
- Prefer structured, bounded output and read-only inspection first.
- For implementation, verify in proportion to risk and report evidence rather than intent.
- Preserve unrelated user work. Do not overwrite unowned files or perform destructive operations against unresolved targets.
- Rename a Codex thread when its main task materially changes, when the host exposes that capability.
- When UI data is inaccessible through files or normal automation, try supported browser/computer access, then a declared screenshot/UI-inspection fallback.

