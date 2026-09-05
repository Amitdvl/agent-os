# Portable Inventory

The manifest is the source of truth for the portable inventory:

- `manifest/tools.json` — 24 selected tool identities, binaries, safety, freshness, source IDs, and auth classes.
- `manifest/sources.json` — pinned/reviewable install provenance or an explicit `manual-unresolved` boundary.
- `manifest/secrets.json` — requirement names and access classes only; it contains no values.
- `manifest/packs.json` — core, local productivity, research, communication, and creator packs.
- `skills/book/` — an explicit-only, research-first nonfiction book workflow with one editorial gate, deterministic workspace/QA helpers, and validated EPUB delivery. Its manifest opts its fixture-backed test suite into host installation so the deployed copy can be verified with the real Pandoc/EPUBCheck toolchain.
- `skills/production-repo-baseline/` — a preview-first foundation for new GitHub projects: initialize local Git, safe defaults, and Dependabot without scaffolding product code; later adds reproducible dependencies and CI when the chosen stack exists.
- `skills/orchestration/` and `policies/orchestration.md` — default lead/worker workflow for substantial tasks.
- `manifest/compatibility.json` — macOS, Node, and two host adapters.

Every selected tool is rendered to a managed `SKILL.md` with a data-root placeholder, preflight, safe reads, guarded writes, limitation, and troubleshooting instruction. Its two host skill entries are symlinks to that one managed template.

The `remindctl` contract creates new reminders with high (urgent) priority by default, unless the user explicitly specifies another priority.

The portable core policy also makes reusable-workflow reporting conditional:
completion summaries name local-tool, Agent OS, command, skill, automation, hook,
or routing changes only when they occurred, and omit negative placeholder rows.

The local-productivity pack includes NoteBridge for local Wispr Flow and Apple Notes inspection, explicit exports, guarded Apple changes, and one-way Wispr-to-Apple mirroring. Apple body edits preserve the note's retrieved rich HTML, explicitly retain its title, and require a read-back check; a tool must not rewrite a normalized text body.

The research pack's OpenCLI contract treats named X bookmark folders as an authenticated adapter workflow: list folders, match the name, then read the folder. If X's folder index returns its known `bookmarkFoldersSlice` 404, it falls back to the current OpenCLI bookmark corpus and marks the outcome as corpus-wide rather than folder-attributed. It never derives folder IDs from cookies, browser storage, or traces.

The research pack includes Summarize: a Homebrew CLI that extracts user-supplied URLs or files and can route a model summary through an existing coding CLI. Its portable contract relays successful model-backed CLI stdout verbatim—without a second agent-written recap—treats provider configuration and `~/.summarize` as private, keeps direct provider keys in the user's independent vault, and requires explicit scope for slide files or cache deletion.

The communication pack includes Telgo for read-only Telegram channel listing and bounded history reads. Its portable contract pins the reviewed Go source, prefers exact channel usernames, limits agent reads to 1–200 messages, keeps app credentials and personal-account sessions outside Agent OS, and requires explicit user intent before selected channel content is sent to Anthropic for summarization.

The creator pack includes Silicon for private local code-image production and
Pandoc plus EPUBCheck for a guarded document-production pipeline. Silicon
renders only exact bounded snippets to new explicit PNG destinations, isolates
ambient config/cache, and validates the artifact because upstream runtime errors
can still exit zero. Pandoc converts only exact user-supplied inputs to explicit
outputs, never trusts filters or external engines implicitly, and sends generated
EPUBs through EPUBCheck. EPUBCheck validation is read-only by default; durable
reports and expanded-archive rebuilds require explicit destinations.

Intentional exclusions include accounts, credentials, encryption identities, browser data, local archives, macOS privacy grants, host logs/sessions, remote publishing, automatic authentication, and any mechanism for weakening focus protections.

## Portable workflow templates

Agent OS includes paused, parameterized templates for a read-only Skill Cleaner
audit, reusable-tooling harvest, and an approval-gated monthly Trashness cleanup.
It also carries optional portable sources for
the ctx7 freshness guard, commit/push watcher/manager, and no-verify guard.
These are source contracts only: schedules, LaunchAgents, hook state, logs,
session data, Trashness protected-name lists, and project-specific configuration
are never deployed or copied automatically.

## Consequential reasoning checks

`skills/fallacy-check/SKILL.md` is a first-party core skill, authored from a reasoning-review requirement and informed by the linked fallacy taxonomy. Core policy routes conversational checks through its high-confidence, material-consequence threshold. It has no executable, credentials, data store, or background process. Behavioral examples distinguish actionable errors from preferences, exploration, and acknowledged tradeoffs.
