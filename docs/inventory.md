# Portable Inventory

The manifest is the source of truth for the portable inventory:

- `manifest/tools.json` — 24 selected tool identities, binaries, safety, freshness, source IDs, and auth classes.
- `manifest/sources.json` — pinned/reviewable install provenance or an explicit `manual-unresolved` boundary.
- `manifest/secrets.json` — requirement names and access classes only; it contains no values.
- `manifest/packs.json` — core, local productivity, research, communication, and creator packs.
- `skills/book/` — an explicit-only, research-first nonfiction book workflow with one editorial gate, deterministic workspace/QA helpers, and validated EPUB delivery. Its manifest opts its fixture-backed test suite into host installation so the deployed copy can be verified with the real Pandoc/EPUBCheck toolchain.
- `skills/pamphlet/` — the canonical `/pamphlet` command and `$pamphlet` skill: per-commission questions about learning objective, prior knowledge, and one versus multiple pamphlets; researched 300–1,000-word information-first explanations; verified PDF/Markdown pairs. The command and skill manifests share one source. Core setup installs the complete package and tests, avoiding duplicate Codex writes while providing a separate Claude command entrypoint. Requires a host question tool (or one batched text fallback), external research, Python with ReportLab and pypdf, and PDF page rendering. No new CLI, credentials, background process, or service integration. Source: the compact knowledge-acquisition workflow specification; reader answers and generated publications remain local.
- `skills/production-repo-baseline/` — a preview-first foundation for new GitHub projects: initialize local Git, safe defaults, and Dependabot without scaffolding product code; later adds reproducible dependencies and CI when the chosen stack exists.
- `skills/orchestration/` and `policies/orchestration.md` — lead/worker workflow for every `/goal` and independently valuable or sensitive non-goal work. Authorized multi-task execution retains one parent goal, one accountable lead, isolated writes, tracked evidence, and whole-goal acceptance; runtime tool restrictions still apply. The goal-prompt contract carries permission explicitly without dispatching tasks during drafting.
- `skills/openai-aesthetic-images/` — a composition-first visual direction skill for clean abstract light fields, including quiet-field and diffused freeform compositions, faithful blur/stretch edits, terminology provenance, and visual acceptance checks.
- `manifest/compatibility.json` — macOS, Node, and two host adapters.

Every selected tool is rendered to a managed `SKILL.md` with a data-root placeholder, preflight, safe reads, guarded writes, limitation, and troubleshooting instruction. Its two host skill entries are symlinks to that one managed template.

The `remindctl` contract creates timed reminders with an EventKit alarm at their due date/time by default and keeps priority as `none` unless specified. The CLI cannot set Apple's native Urgent toggle; an alarm is a separate notification and must not be described as native Urgent.

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
The [Frontier of Useful prompt](../templates/automations/frontier-of-useful/prompt.md)
provides a fortnightly, advisory research heartbeat for meaningful workflow
improvements. Resolve its local path placeholders and create it through the
Codex App automation tool in the intended task. It prioritizes primary sources,
current setup fit, measurable experiments and quiet runs without useful findings;
it does not install or change tools. Schedule and task state stay machine-local.
It also carries optional portable sources for
the ctx7 freshness guard, commit/push watcher/manager, and no-verify guard.
These are source contracts only: schedules, LaunchAgents, hook state, logs,
session data, Trashness protected-name lists, and project-specific configuration
are never deployed or copied automatically.

## Consequential reasoning checks

`skills/fallacy-check/SKILL.md` is a first-party core skill, authored from a reasoning-review requirement and informed by the linked fallacy taxonomy. Core policy routes conversational checks through its high-confidence, material-consequence threshold. It has no executable, credentials, data store, or background process. Behavioral examples distinguish actionable errors from preferences, exploration, and acknowledged tradeoffs.

## Outcome loops

[`outcome-loop`](../skills/outcome-loop/SKILL.md) is a first-party core skill for
turning a requested objective into an operated feedback loop and a verified Notion
report. Invoke `$outcome-loop` with the operation and desired outcome. It uses
existing domain skills and tools; installation creates no runtime or schedule.
Notion access and the report destination belong to each consuming environment;
without access, the agent retains a local report and marks publication incomplete.

The contract was authored from an outcome-ownership requirement and reviewed
against the [fallacy taxonomy](https://en.wikipedia.org/wiki/List_of_fallacies),
particularly proxy substitution, selective evidence, causal inference, and sunk
costs. It carries no copied article text, private operations, or account state.
Behavioral regression cases live in `tests/outcome-loop-cases.md`; installation
coverage verifies the skill reaches both supported hosts intact.

Outcome-loop also compares evidenced cost of delay with displaced work and the
value of waiting when timing affects the outcome. Consuming installations may
keep explicitly established destinations in
`skills/outcome-loop/references/projects.local.md`. The skill checks this optional
local file only for matching objectives; current user instructions win. The file
is excluded from portable inventory and Git because project URLs and private
context belong to the consuming environment. Source: the requirement to remember
an explicitly created loop project without exporting private operation details.
