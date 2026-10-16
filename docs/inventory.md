# Portable Inventory

The manifest is the source of truth for the portable inventory:

- `manifest/tools.json` — 20 selected tool identities, binaries, safety, freshness, source IDs, and auth classes.
- `manifest/sources.json` — pinned/reviewable install provenance or an explicit `manual-unresolved` boundary.
- `manifest/secret-requirements.json` — requirement names and access classes only; it contains no values.
- `manifest/packs.json` — core, local productivity, research, communication, creator, and macOS development packs.
- `skills/orchestration/` and `policies/orchestration.md` — default lead/worker workflow for substantial tasks.
- `skills/half-bounce/` — measured cold-start readiness workflow for native macOS apps, including a physical Dock-based acceptance gate.
- `skills/launch-video-studio/` — automatically discover named launch-video formats through a registered studio checkout, with `$launch-video-studio` as an explicit invocation. The repository catalog owns format names, aliases, guides, and verification status; the portable resolver contains no machine paths or private film assets. Install this skill through the creator pack and configure the checkout using `LAUNCH_VIDEO_STUDIO_ROOT` or the private workspace registry. A private `remotePrimaryProjects` entry can name the destination host/project; the resolver then refuses silent backup authoring. Explicit environment overrides remain available for deliberate local work. Routing labels, paths and host state never belong in this portable source.
- `skills/monochrome-workspace/` — `$monochrome-workspace`, a thin discovery skill for the self-contained [Monochrome Workspace design kit](design-kits.md). Creator-pack distribution includes native Impeccable context, scoped CSS, generic interactive reference and provenance. Direct file/code adoption requires neither Impeccable nor an installed skill.
- `skills/openai-aesthetic-images/` — portable art direction for abstract campaign artwork, based on documented reference links rather than a generic gradient preset.
- `skills/pamphlet/` — the `$pamphlet` skill: researched 300–1,000-word explanations, delivered as verified PDF and Markdown pairs. Codex custom slash commands are no longer supported; invoke this skill with `$pamphlet`.
- `skills/book/` — the explicitly invoked `$book` workflow, including its complete research, EPUB build, validation, and test package.
- `skills/sire/` — **Sire, what can we do?**, invoked explicitly with `$sire` after a blocker, question, or proposal. Research the desired state and viable solutions, recommend a path, present a counted goal objective, and wait for human approval before creating and executing a native goal in the same thread. Existing unfinished goals are preserved; unavailable native controls yield an honest paste-ready `/goal` fallback. Core distribution includes explicit-only invocation metadata and Commands catalog registration.
- `skills/cover-project/` — agent-callable coverage for a defined behavior, file, module, or project, with automatic invocation and explicit `$cover-project`. An early implementation checkpoint records test ownership before substantive suite expansion; parents assess independent behaviors, state transitions and rejection side effects, then default to a bounded worker for separable or high-risk testing using the included handoff template; workers return tests, scoped metrics, fault checks, and evidence for parent integration. Stable source and separate test ownership allow this even for an integrated feature. Concrete small-task, runtime, ownership and cost exceptions stay direct. Routine single-test work stays lightweight. Core distribution includes invocation metadata, agent handoff, and deeper-check/evaluation guides; no Superpowers dependency. The [forward-test record](coverage-workflow-evaluation.md) documents observed behavior and its limits.
- `skills/fallacy-check/` — a quiet conversational reasoning review that alerts only for clear, consequential inference errors.
- `skills/justification-audit/` — `$justification-audit` tests whether a component, requirement, plan, or workflow earns its place using Aristotle's four causes, explicit premises, and counterfactual contribution. It reports value separately from evidence strength and checks interactions and reversal conditions. When explicitly combined with Production Algorithm, both skills use one measurement plan and decision brief; justification checks sit within requirements and deletion, with later checks when the mechanism changes. The package includes source attribution and normal automatic discovery. Both skills have installed catalog entries recording purpose, dollar-sign invocation, source path, and status; the legacy Awareness HUD labels rows with a slash, so descriptions also state the supported invocation.
- `skills/goal-supervisor/` — human-approved supervision of sequential worker goals, with supervisor chat titles beginning `#SV ` and retaining the prefix after completion, with actual outcome review and a mandatory independent read-only final auditor. Concrete human approval is required before shared/system-wide installs or major scope expansions, while ordinary project-local edits, isolated dependencies and tests stay autonomous. The boundary applies before dispatch/execution, in worker instructions and during final audit. Material findings return through the supervisor for correction and re-audit; missing, unresolved or stale acceptance leaves the supervisor goal incomplete. The core package includes worker and auditor dispatch contracts; this checkpoint is agent guidance rather than an application-enforced native goal lock.
- `skills/outcome-loop/` — an evidence-driven feedback loop that owns iterative execution, verification, and durable reporting without expanding authority.
- `skills/production-algorithm/` — the explicitly invoked `$production-algorithm` skill, merged with the retired Engineer Algorithm package. One ordered five-step review uses a shared outcome measurement plan and a short decision brief. `references/sources.md` records provenance; `references/technical-safeguards.md` supplies protection and verification detail only for consequential proposed changes.
- `skills/production-repo-baseline/` — a preview-first repository foundation helper with its deterministic Go implementation and fixtures.
- `commands/archive/` — `/archive <project name or path>` resolves an exact local project and moves it into the current user's `Documents/ArchivedProjects`; broad stale-project requests require a reviewed candidate list.
- `commands/decision-queue/` — `/decision-queue <decision or uncertainty>` adds one unresolved record to a user-configured Notion Decision Queue. The database identifier is local configuration and is never distributed.
- `commands/pre-publication/` and `skills/publication-safety/` — context-resolved public GitHub release gate with an official Codex Security scan of the frozen candidate, independent history-capable secret scanning, remote/privacy review, a path-redacting repository guard, conflict-safe local hooks, and advisory repo-owned CI. The Codex skill is also invocable as `$pre-publication` where a custom slash UI entry is unavailable; no detector can promise zero future leaks.
- `manifest/compatibility.json` — macOS, Node, and two host adapters.

Every selected tool is rendered to a managed `SKILL.md` with a data-root placeholder, preflight, safe reads, guarded writes, limitation, and troubleshooting instruction. Its two host skill entries are symlinks to that one managed template.

The `remindctl` contract reflects the native limitation: there is no Urgent toggle. Use an alarm when timing matters and leave priority unset unless the user explicitly requests a supported priority.

The audited Homebrew source records currently cover Birdclaw 0.15.0, Discrawl 0.15.6, Notcrawl 0.6.4, Peekaboo 4.5.0, Remindctl 0.3.8, Spogo 0.13.1, Wacli 0.20.0, Wacrawl 0.4.2, and yt-dlp 2026.8.19. These pins document reviewed releases; their `automation: disabled` setting continues to prohibit unattended installation.

The portable core policy also makes reusable-workflow reporting conditional:
completion summaries name local-tool, Agent OS, command, skill, automation, hook,
or routing changes only when they occurred, and omit negative placeholder rows.

The local-productivity pack includes NoteBridge for local Wispr Flow and Apple Notes inspection, explicit exports, guarded Apple changes, and one-way Wispr-to-Apple mirroring. Apple body edits preserve the note's retrieved rich HTML, explicitly retain its title, and require a read-back check; a tool must not rewrite a normalized text body.

The research pack's OpenCLI contract treats named X bookmark folders as an authenticated adapter workflow: list folders, match the name, then read the folder. If X's folder index returns its known `bookmarkFoldersSlice` 404, it falls back to the current OpenCLI bookmark corpus and marks the outcome as corpus-wide rather than folder-attributed. It never derives folder IDs from cookies, browser storage, or traces.

Intentional exclusions include accounts, credentials, encryption identities, browser data, local archives, macOS privacy grants, host logs/sessions, remote publishing, automatic authentication, and any mechanism for weakening focus protections.

The portable workspace-navigation contract tells agents to consult an optional
machine-local `~/.agent-os/workspaces.json` before broad discovery. The live
registry's absolute paths and project names are intentionally excluded; only a
placeholder schema lives in `templates/workspaces.example.json`.

The live owner machine also has explicit inventory exclusions for `agent-inbox`,
`epubcheck`, `pandoc`, `silicon`, `summarize`, `telgo`, and `vox`; these are
either owner-specific or not yet covered by a reviewed portable tool contract.
The owner-specific `no-temptation-lockin` skill is separately inventoried as an
intentional machine-only identity/focus exclusion; Agent OS does not copy its
content.

## Portable workflow templates

Agent OS includes paused, parameterized templates for a read-only Skill Cleaner
audit, reusable-tooling harvest, and an approval-gated monthly Trashness cleanup.
Its portable core policy and Trashness command also require build-artifact
hygiene: put non-deployed macOS app bundles under ignored `.noindex` roots,
inventory generated bundles, preserve active apps and unrelated worktrees,
remove task-created disposable products before completion, and obtain fresh
exact approval before deleting stale pre-existing outputs.
It also carries optional portable sources for
the ctx7 freshness guard, commit/push watcher/manager, and no-verify guard.
These are source contracts only: schedules, LaunchAgents, hook state, logs,
session data, Trashness protected-name lists, and project-specific configuration
are never deployed or copied automatically.

## Apple Suite

Select `--profile apple-suite` for the complete macOS workflow. The local-productivity pack includes `asc`, the [App Store Connect CLI](https://github.com/rorkai/App-Store-Connect-CLI), alongside Notes, Reminders, and UI inspection. The macos-development pack adds the reusable `half-bounce` skill for making the first useful surface of a native macOS app interactive before the Dock icon settles. Its portable scope is Darwin; Windows and Strict Portable profiles omit this macOS-specific pack.

The upstream installation route is `brew install asc`, but Agent OS does not install it or authenticate automatically. The source remains `manual-unresolved` until a release is deliberately reviewed and pinned. The contract starts with `asc version`, help, auth status/doctor, and current JSON app reads. Releases, uploads, pricing, invitations, submissions, and deletion require exact targets and action intent, followed by verification.

API credential names follow upstream [authentication documentation](https://github.com/rorkai/App-Store-Connect-CLI/blob/main/commands/auth.mdx). Team keys need an issuer ID; individual keys do not. Private key alternatives belong only in Agent Vault or user-owned supported credential storage. No account state, private keys, or web sessions are distributed. Upstream telemetry is enabled by default; `ASC_TELEMETRY_DISABLED=1` or `DO_NOT_TRACK=1` opts out.
