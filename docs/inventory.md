# Portable Inventory

The manifest is the source of truth for the portable inventory:

- `manifest/tools.json` — 20 selected tool identities, binaries, safety, freshness, source IDs, and auth classes.
- `manifest/sources.json` — pinned/reviewable install provenance or an explicit `manual-unresolved` boundary.
- `manifest/secrets.json` — requirement names and access classes only; it contains no values.
- `manifest/packs.json` — core, local productivity, research, communication, creator, and macOS development packs.
- `skills/orchestration/` and `policies/orchestration.md` — default lead/worker workflow for substantial tasks.
- `skills/half-bounce/` — measured cold-start readiness workflow for native macOS apps, including a physical Dock-based acceptance gate.
- `skills/openai-aesthetic-images/` — portable art direction for abstract campaign artwork, based on documented reference links rather than a generic gradient preset.
- `skills/pamphlet/` — the canonical `/pamphlet` command and `$pamphlet` skill: researched 300–1,000-word explanations, delivered as verified PDF and Markdown pairs.
- `manifest/compatibility.json` — macOS, Node, and two host adapters.

Every selected tool is rendered to a managed `SKILL.md` with a data-root placeholder, preflight, safe reads, guarded writes, limitation, and troubleshooting instruction. Its two host skill entries are symlinks to that one managed template.

The `remindctl` contract creates new reminders with high (urgent) priority by default, unless the user explicitly specifies another priority.

The portable core policy also makes reusable-workflow reporting conditional:
completion summaries name local-tool, Agent OS, command, skill, automation, hook,
or routing changes only when they occurred, and omit negative placeholder rows.

The local-productivity pack includes NoteBridge for local Wispr Flow and Apple Notes inspection, explicit exports, guarded Apple changes, and one-way Wispr-to-Apple mirroring. Apple body edits preserve the note's retrieved rich HTML, explicitly retain its title, and require a read-back check; a tool must not rewrite a normalized text body.

The research pack's OpenCLI contract treats named X bookmark folders as an authenticated adapter workflow: list folders, match the name, then read the folder. If X's folder index returns its known `bookmarkFoldersSlice` 404, it falls back to the current OpenCLI bookmark corpus and marks the outcome as corpus-wide rather than folder-attributed. It never derives folder IDs from cookies, browser storage, or traces.

Intentional exclusions include accounts, credentials, encryption identities, browser data, local archives, macOS privacy grants, host logs/sessions, remote publishing, automatic authentication, and any mechanism for weakening focus protections.

The live owner machine also has explicit inventory exclusions for `agent-inbox`,
`epubcheck`, `pandoc`, `silicon`, `summarize`, `telgo`, and `vox`; these are
either owner-specific or not yet covered by a reviewed portable tool contract.

## Portable workflow templates

Agent OS includes paused, parameterized templates for a read-only Skill Cleaner
audit, reusable-tooling harvest, and an approval-gated monthly Trashness cleanup.
It also carries optional portable sources for
the ctx7 freshness guard, commit/push watcher/manager, and no-verify guard.
These are source contracts only: schedules, LaunchAgents, hook state, logs,
session data, Trashness protected-name lists, and project-specific configuration
are never deployed or copied automatically.

## Apple Suite

Select `--profile apple-suite` for the complete macOS workflow. The local-productivity pack includes `asc`, the [App Store Connect CLI](https://github.com/rorkai/App-Store-Connect-CLI), alongside Notes, Reminders, and UI inspection. The macos-development pack adds the reusable `half-bounce` skill for making the first useful surface of a native macOS app interactive before the Dock icon settles. Its portable scope is Darwin; Windows and Strict Portable profiles omit this macOS-specific pack.

The upstream installation route is `brew install asc`, but Agent OS does not install it or authenticate automatically. The source remains `manual-unresolved` until a release is deliberately reviewed and pinned. The contract starts with `asc version`, help, auth status/doctor, and current JSON app reads. Releases, uploads, pricing, invitations, submissions, and deletion require exact targets and action intent, followed by verification.

API credential names follow upstream [authentication documentation](https://github.com/rorkai/App-Store-Connect-CLI/blob/main/commands/auth.mdx). Team keys need an issuer ID; individual keys do not. Private key alternatives belong only in Agent Vault or user-owned supported credential storage. No account state, private keys, or web sessions are distributed. Upstream telemetry is enabled by default; `ASC_TELEMETRY_DISABLED=1` or `DO_NOT_TRACK=1` opts out.
