# Portable Inventory

The manifest is the source of truth for the portable inventory:

- `manifest/tools.json` — 21 selected tool identities, binaries, safety, freshness, source IDs, and auth classes.
- `manifest/sources.json` — pinned/reviewable install provenance or an explicit `manual-unresolved` boundary.
- `manifest/secret-requirements.json` — requirement names and access classes only; it contains no values.
- `manifest/packs.json` — core, local productivity, research, communication, creator, macOS development, and web development packs.
- `skills/orchestration/` and `policies/orchestration.md` — default lead/worker workflow for substantial tasks.
- `skills/half-bounce/` — measured cold-start readiness workflow for native macOS apps, including a physical Dock-based acceptance gate.
- `skills/launch-video-studio/` — automatically discover named launch-video formats through a registered studio checkout, with `$launch-video-studio` as an explicit invocation. The repository catalog owns format names, aliases, guides, and verification status; the portable resolver contains no machine paths or private film assets. Install this skill through the creator pack and configure the checkout using `LAUNCH_VIDEO_STUDIO_ROOT` or the private workspace registry. A private active project may declare `managedRoot` and a trusted `controller`; discovery then validates installation/software ownership and returns structured local library and software locations, superseding obsolete remote-primary routing. Managed UI/CLI share the running server for durable saves, selective film sync, recovery and updates. New routine installations use durable per-user storage outside development/scratch/version folders; the default is the current home folder’s `.launch-video-studio`. Explicit existing roots remain preserved. Without a managed installation, a private `remotePrimaryProjects` entry can name the destination host/project; the resolver then refuses silent backup authoring. Explicit environment overrides remain available for deliberate local work. Routing labels, paths and host state never belong in this portable source. Quiet prompt-time maintenance reads freshness/health/enabled-film state, uses existing safe update/sync interfaces, and performs no actions when healthy.
- `skills/monochrome-workspace/` — `$monochrome-workspace`, a thin discovery skill for the self-contained [Monochrome Workspace design kit](design-kits.md). Creator-pack distribution includes native Impeccable context, scoped CSS, generic interactive reference and provenance. Direct file/code adoption requires neither Impeccable nor an installed skill.
- `skills/image-art-direction/` — iterative visual briefs and image edits. The former OpenAI Aesthetic Images skill is retained in full at `references/styles/openai-aesthetic-images.md`, loaded only for that requested look or a matching supplied reference. It preserves source links, composition, lighting, palette, prompting, edit guidance and acceptance checks without setting a default aesthetic. The creator pack distributes the reference with its parent; Commands registers `$image-art-direction` instead of a separate style skill.
- `skills/pamphlet/` — the `$pamphlet` skill: researched 300–1,000-word explanations, delivered as verified PDF and Markdown pairs. Codex custom slash commands are no longer supported; invoke this skill with `$pamphlet`.
- `skills/book/` — the explicitly invoked `$book` workflow, including its complete research, EPUB build, validation, and test package.
- `skills/sire/` — **Sire, what can we do?**, invoked explicitly with `$sire` after a blocker, question, or proposal. Research the desired state and viable solutions, recommend a path, present a counted goal objective, and wait for human approval before creating and executing a native goal in the same thread. Existing unfinished goals are preserved; unavailable native controls yield an honest paste-ready `/goal` fallback. Core distribution includes explicit-only invocation metadata and Commands catalog registration.
- `skills/cover-project/` — agent-callable coverage for a defined behavior, file, module, or project, with automatic invocation and explicit `$cover-project`. An early implementation checkpoint records test ownership before substantive suite expansion; parents assess independent behaviors, state transitions and rejection side effects, then default to a bounded worker for separable or high-risk testing using the included handoff template; workers return tests, scoped metrics, fault checks, and evidence for parent integration. Stable source and separate test ownership allow this even for an integrated feature. Concrete small-task, runtime, ownership and cost exceptions stay direct. Routine single-test work stays lightweight. Core distribution includes invocation metadata, agent handoff, and deeper-check/evaluation guides; no Superpowers dependency. The [forward-test record](coverage-workflow-evaluation.md) documents observed behavior and its limits.
- `skills/fallacy-check/` — a quiet conversational reasoning review that alerts only for clear, consequential inference errors.
- `skills/justification-audit/` — `$justification-audit` tests whether a component, requirement, plan, or workflow earns its place using Aristotle's four causes, explicit premises, and counterfactual contribution. It reports value separately from evidence strength and checks interactions and reversal conditions. When explicitly combined with Production Algorithm, both skills use one measurement plan and decision brief; justification checks sit within requirements and deletion, with later checks when the mechanism changes. The package includes source attribution and normal automatic discovery. Both skills have installed catalog entries recording purpose, dollar-sign invocation, source path, and status; the legacy Awareness HUD labels rows with a slash, so descriptions also state the supported invocation.
- `skills/goal-supervisor/` — human-approved hybrid supervision with a persistent supervisor goal, bounded internal subagents by default and separate worker chats when their independent goal/continuation, direct human steering or a concrete configuration/tool-availability benefit earns the extra coordination. Internal workers do not create native goals. Supervisor chat titles begin `#SV ` and retain the prefix after completion. Both routes require actual outcome review, corrections, actor-aware dispatch recovery/stop and one writer on shared state. A fresh independent read-only final auditor must accept the current result. Concrete human approval is required before shared/system-wide installs or major scope expansions, while ordinary project-local edits, isolated dependencies and tests stay autonomous. The boundary applies before dispatch/execution, in worker instructions and during final audit. Missing, unresolved or stale acceptance leaves the supervisor goal incomplete. The core package includes worker and auditor dispatch contracts; this checkpoint is agent guidance rather than an application-enforced native goal lock.
- `skills/outcome-loop/` — an evidence-driven feedback loop that owns iterative execution, verification, and durable reporting without expanding authority.
- `skills/production-algorithm/` — the explicitly invoked `$production-algorithm` skill, merged with the retired Engineer Algorithm package. One ordered five-step review uses a shared outcome measurement plan and a short decision brief. `references/sources.md` records provenance; `references/technical-safeguards.md` supplies protection and verification detail only for consequential proposed changes.
- `skills/production-repo-baseline/` — a preview-first repository foundation helper with its deterministic Go implementation and fixtures.
- `commands/archive/` — `/archive <project name or path>` resolves an exact local project and moves it into the current user's `Documents/ArchivedProjects`; broad stale-project requests require a reviewed candidate list.
- `commands/decision-queue/` — `/decision-queue <decision or uncertainty>` adds one unresolved record to a user-configured Notion Decision Queue. The database identifier is local configuration and is never distributed.
- `commands/pre-publication/` and `skills/publication-safety/` — context-resolved public GitHub release gate with an official Codex Security scan of the frozen candidate, independent history-capable secret scanning, remote/privacy review, a path-redacting repository guard, conflict-safe local hooks, and advisory repo-owned CI. The Codex skill is also invocable as `$pre-publication` where a custom slash UI entry is unavailable; no detector can promise zero future leaks.
- `manifest/compatibility.json` — macOS, Node, and two host adapters.

Every selected tool is rendered to a managed `SKILL.md` with a data-root placeholder, preflight, safe reads, guarded writes, limitation, and troubleshooting instruction. Its two host skill entries are symlinks to that one managed template.

The `remindctl` contract reflects the native limitation: there is no Urgent toggle. Use an alarm when timing matters and leave priority unset unless the user explicitly requests a supported priority.

The audited Homebrew source records currently cover Birdclaw 0.16.0, Discrawl 0.15.8, Notcrawl 0.6.6, Peekaboo 4.5.0, Remindctl 0.3.8, Spogo 0.13.1, Wacli 0.22.0, Wacrawl 0.4.3, and yt-dlp 2026.8.19. These pins document reviewed releases; their `automation: disabled` setting continues to prohibit unattended installation.

The portable core policy also makes reusable-workflow reporting conditional:
completion summaries name local-tool, Agent OS, command, skill, automation, hook,
or routing changes only when they occurred, and omit negative placeholder rows.

The local-productivity pack includes NoteBridge for local Wispr Flow and Apple Notes inspection, explicit exports, guarded Apple changes, and one-way Wispr-to-Apple mirroring. Apple body edits preserve the note's retrieved rich HTML, explicitly retain its title, and require a read-back check; a tool must not rewrite a normalized text body.

The research pack's OpenCLI contract treats named X bookmark folders as an authenticated adapter workflow: list folders, match the name, then read the folder. If X's folder index returns its known `bookmarkFoldersSlice` 404, it falls back to the current OpenCLI bookmark corpus and marks the outcome as corpus-wide rather than folder-attributed. It never derives folder IDs from cookies, browser storage, or traces.

Intentional exclusions include accounts, credentials, encryption identities, browser data, local archives, macOS privacy grants, host logs/sessions, remote publishing, automatic authentication, and any mechanism for weakening focus protections.

The owner's Codex permission profile, tool approval defaults and trusted project
scopes are explicitly machine-local. Agent OS does not distribute Full access or
automatic tool approval as defaults or copy host-specific permission selections
and project trust paths; each owner chooses their application permissions.

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
audit, reusable-tooling harvest, and a monthly Trashness cleanup with explicit authorization.
Its portable core policy and Trashness command also require build-artifact
hygiene: put non-deployed macOS app bundles under ignored `.noindex` roots,
inventory generated bundles, preserve active apps and unrelated worktrees,
remove task-created disposable products before completion, and use a fresh
exact manifest before deleting stale pre-existing outputs. Explicit Codex or
other AI agent deletion requests need no separate human approval; other runs
require exact human approval. The same authorization contract applies to the
Trashness monthly template; explicit wait-for-human instructions still prevail.
It also carries optional portable sources for
the ctx7 freshness guard, commit/push watcher/manager, and no-verify guard.
These are source contracts only: schedules, LaunchAgents, hook state, logs,
session data, Trashness protected-name lists, and project-specific configuration
are never deployed or copied automatically.

## Apple Suite

Select `--profile apple-suite` for the complete macOS workflow. The local-productivity pack includes `asc`, the [App Store Connect CLI](https://github.com/rorkai/App-Store-Connect-CLI), alongside Notes, Reminders, and UI inspection. The macos-development pack adds the reusable `half-bounce` skill for making the first useful surface of a native macOS app interactive before the Dock icon settles. Its portable scope is Darwin; Windows and Strict Portable profiles omit this macOS-specific pack.

The upstream installation route is `brew install asc`, but Agent OS does not install it or authenticate automatically. The source remains `manual-unresolved` until a release is deliberately reviewed and pinned. The contract starts with `asc version`, help, auth status/doctor, and current JSON app reads. Releases, uploads, pricing, invitations, submissions, and deletion require exact targets and action intent, followed by verification.

API credential names follow upstream [authentication documentation](https://github.com/rorkai/App-Store-Connect-CLI/blob/main/commands/auth.mdx). Team keys need an issuer ID; individual keys do not. Private key alternatives belong only in Agent Vault or user-owned supported credential storage. No account state, private keys, or web sessions are distributed. Upstream telemetry is enabled by default; `ASC_TELEMETRY_DISABLED=1` or `DO_NOT_TRACK=1` opts out.

Development guidance is consolidated in `skills/systematic-debugging/`,
`skills/react-best-practices/`, and `skills/frontend-design/`. Each complete package
is selected by its core/creator pack and registered in the command catalog.
See [skill consolidation](skill-consolidation.md) for retirement and host routing.

## Approved development cleanup

The core `goal-prompt` and `goal-supervisor` packages preserve outcome milestones,
explicit intent amendments and bounded supporting work. Supervision records
contribution in its existing run note, diagnoses repeated nonprogress with a
no-drift option, reuses valid evidence and verifies recovery through actions.
Worker/auditor contracts carry the same outcome and authority boundaries. Team
limits are distinguished from project capacity; approved separate chats require
observed execution and verified worker settings. Independent region/domain groups
own bounded integration, and finished playable batches take priority over
worker-count reporting. Each coherent verified batch moves immediately to
integration; shared blockers have one feature owner, finished workers take the
next valuable independent gap, and the lead coordinates broad validation while
preserving required checks and valid evidence. The Commands catalog describes
these packages and `orchestration` with their supported dollar-sign
invocation. See [engineering guidance](agentic-engineering.md#recognize-drift-without-manufacturing-it)
for neutral steering and research limits; this adds no scheduler or hard budget.

The web-development pack ships `cloudflare` (shared platform/deployment/auth
references) and provider-scoped `agents-sdk`. Creator ships canonical
`frontend-testing-debugging` with multi-server helper/examples; core ships
`current-limiting-factor`. Commands owns installed-first discovery and delegates
selected installs to the host installer. Outcome Loop retains retry/reconciliation
and requested reporting without making ordinary work depend on Notion.

Reviewed optional OpenAI/eve/frontend plugin entrypoint overlays, exact version
hashes, local verification and update recovery are documented in
[approved-skill-consolidation.md](approved-skill-consolidation.md). They do not
copy vendor reference trees or account state, install plugins, or choose an agent
provider for generic requests.

## REA

`rea` is the official `rea-agents` npm package, pinned to 6.7.0 and selected by
the research pack. Its generated skill and sibling routing contract require
explicit invocation through `$rea` or a request to use REA. Codex discovery
metadata disables implicit invocation while keeping the skill available. The
Commands catalog records invocation, purpose, source path and installed status.

Use `agent-os install --tools rea` to preview the pinned install and the existing
reviewed-install flow to apply it deliberately. Node ^22.19.0, ^24.11.0 or >=26
is required. Static JavaScript/Electron and built-in macOS metadata inspection
need no decompiler. Native decompilation and other optional providers need their
own configured tools. CLI use needs no credentials or MCP registration; encrypted
inventory remains local. Explicit invocation grants no authority for target
execution, instrumentation, account changes, license bypass or blocked sites.

The contract is independently authored; REA and its bundled upstream workflow
remain upstream-owned. Consult the [official installation guide](https://github.com/morluto/rea/blob/main/docs/installation.md)
and installed command help for current provider and side-effect details.
