# Portable Inventory

The manifest is the source of truth for the portable inventory:

- `manifest/tools.json` — 20 selected tool identities, binaries, safety, freshness, source IDs, and auth classes.
- `manifest/sources.json` — pinned/reviewable install provenance or an explicit `manual-unresolved` boundary.
- `manifest/secrets.json` — requirement names and access classes only; it contains no values.
- `manifest/packs.json` — core, local productivity, research, communication, and creator packs.
- `skills/production-repo-baseline/` — a preview-first project-founder baseline for GitHub projects: scaffold a chosen stack in an empty repo, then add reproducible dependencies, secret hygiene, CI, and Dependabot without product-infrastructure guesses.
- `skills/orchestration/` and `policies/orchestration.md` — default lead/worker workflow for substantial tasks.
- `manifest/compatibility.json` — macOS, Node, and two host adapters.

Every selected tool is rendered to a managed `SKILL.md` with a data-root placeholder, preflight, safe reads, guarded writes, limitation, and troubleshooting instruction. Its two host skill entries are symlinks to that one managed template.

The `remindctl` contract creates new reminders with high (urgent) priority by default, unless the user explicitly specifies another priority.

The portable core policy also makes reusable-workflow reporting conditional:
completion summaries name local-tool, Agent OS, command, skill, automation, hook,
or routing changes only when they occurred, and omit negative placeholder rows.

The local-productivity pack includes NoteBridge for local Wispr Flow and Apple Notes inspection, explicit exports, guarded Apple changes, and one-way Wispr-to-Apple mirroring. Apple body edits preserve the note's retrieved rich HTML, explicitly retain its title, and require a read-back check; a tool must not rewrite a normalized text body.

The research pack's OpenCLI contract treats named X bookmark folders as an authenticated adapter workflow: list folders, match the name, then read the folder. If X's folder index returns its known `bookmarkFoldersSlice` 404, it falls back to the current OpenCLI bookmark corpus and marks the outcome as corpus-wide rather than folder-attributed. It never derives folder IDs from cookies, browser storage, or traces.

The research pack includes Summarize: a Homebrew CLI that extracts user-supplied URLs or files and can route a concise model summary through an existing coding CLI. Its portable contract treats provider configuration and `~/.summarize` as private, keeps direct provider keys in the user's independent vault, and requires explicit scope for slide files or cache deletion.

Intentional exclusions include accounts, credentials, encryption identities, browser data, local archives, macOS privacy grants, host logs/sessions, remote publishing, automatic authentication, and any mechanism for weakening focus protections.

## Portable workflow templates

Agent OS includes paused, parameterized templates for a read-only Skill Cleaner
audit, reusable-tooling harvest, and an approval-gated monthly Trashness cleanup.
It also carries optional portable sources for
the ctx7 freshness guard, commit/push watcher/manager, and no-verify guard.
These are source contracts only: schedules, LaunchAgents, hook state, logs,
session data, Trashness protected-name lists, and project-specific configuration
are never deployed or copied automatically.
