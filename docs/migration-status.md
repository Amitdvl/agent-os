# Live Workflow Migration Status

**Snapshot:** 2026-08-06. The owner-machine cutover is complete. This is an
evidence inventory, not an installation plan. It names portable contracts and
logical source locations only; it never
contains a user name, credential, session, archive content, recording, account
identifier, or machine-specific absolute path.

## Cutover result

- The four live Codex command links (`add`, `commands`, `teach`, and
  `trunk-finish`) resolve to this Agent OS checkout.
- The normal shell launcher resolves to this checkout's `bin/agent-os`.
- The single reusable-source sentence in global guidance names Agent OS as the
  canonical portable source. All other global guidance was preserved.
- The two active reusable-workflow automations now run from the Agent OS
  checkout and target its Codex project. Their original TOML files have an
  owner-local, timestamped migration backup.
- The transactional cutover ledger and original guidance backup live under
  `~/.agent-os`. `agent-os live-rollback` previews restoration and
  `agent-os live-rollback --apply` restores the adopted legacy links, removes
  the newly created `teach` and launcher links, and restores the exact guidance
  backup. Automation TOML rollback uses the separately recorded timestamped
  owner-local backups.
- The legacy repository remains present and unchanged by the cutover. It is an
  archive/reference source, not the live source of portable commands,
  guidance, or active reusable-workflow automations.

## Classification key

- **active dependency** — currently used by the owner-machine workflow and
  still requires a governed destination.
- **portable source** — the Agent OS equivalent is the maintained,
  shareable source of the behavior.
- **local-only exclusion** — deliberately retained on the owner machine;
  never copied into Agent OS.
- **project-specific** — belongs in a consuming repository or project adapter,
  not the portable base.
- **obsolete** — no active portable destination; retain only as a named
  non-migration decision.
- **archive-only** — private local data used by a tool, never migration input.

## Surface inventory

| Category | Current live source / evidence | Classification | Agent OS target or disposition |
| --- | --- | --- | --- |
| Symlinks | `$CODEX_HOME/skills/<tool>` points at `$CODEX_HOME/local-tools/tools/<tool>` for managed tools; evidence: live registry `skill_symlink` fields | active dependency | **portable source:** rendered host links from `~/.codex/skills/<id>` and `~/.claude/skills/<id>` to `~/.agent-os/local-tools/tools/<id>`; [architecture](architecture.md) and `bootstrap/cli.mjs` |
| Command links | Before cutover, three links resolved to `$AGENT_SYSTEM/commands/*` and `teach` was absent; after cutover all four resolve to Agent OS | portable source, live applied | `commands/{add,commands,teach,trunk-finish}/SKILL.md`, declared by `manifest/commands.json`. The preview-first transaction adopted only those exact links and did not touch tool links. |
| Local-tool contracts and registry | `$CODEX_HOME/local-tools/registry.yaml`; `$CODEX_HOME/local-tools/tools/<id>/SKILL.md` | active dependency | **portable source:** `manifest/tools.json`, `manifest/sources.json`, `manifest/inventory-dispositions.json`, and generated templates/registry in `bootstrap/cli.mjs` |
| AgentInbox contract | `$CODEX_HOME/local-tools/tools/agent-inbox/SKILL.md` and its registry entry | local-only exclusion | Explicit exclusion: `manifest/inventory-dispositions.json` → `twin.excludedLiveTools[id=agent-inbox]`; no tool contract, source, or install path in Agent OS |
| Vox contract | `$CODEX_HOME/local-tools/tools/vox/SKILL.md` and its registry entry | local-only exclusion | Explicit exclusion: `manifest/inventory-dispositions.json` → `twin.excludedLiveTools[id=vox]`; telecom/provider configuration and call logs stay local |
| NoteBridge contract | `$CODEX_HOME/local-tools/tools/notebridge/SKILL.md` and registry entry | active dependency | **portable source:** `manifest/tools.json[id=notebridge]`, `manifest/sources.json[id=notebridge-manual]`, and `manifest/inventory-dispositions.json`; status is `external-local` / manual reviewed install. Its contract is portable; provider databases and Apple/Wispr content are **archive-only** |
| Policies and global guidance | `$CODEX_HOME/AGENTS.md`, including safety, freshness, focus, local-tool routing, and twin-sync sections | active dependency | **portable source:** `policies/*.md`, `profiles/strict-portable.md`, `manifest/policies.json`, and host rendering in `bootstrap/cli.mjs` |
| Rules and configuration | `$CODEX_HOME/rules/default.rules`; host configuration under `$CODEX_HOME` | active dependency | **portable source:** generated `~/.codex/rules/agent-os.rules` and `templates/config.example.json`; host-specific paths and transient login allowances are **local-only exclusion** / **archive-only** per `manifest/inventory-dispositions.json` |
| Scripts and packages | Legacy package/scripts were inspected as migration input; owner-local helpers remain local where explicitly excluded | archive/reference-only after cutover | **portable source:** `package.json`, `bootstrap/cli.mjs`, `bin/*`, and `scripts/twin-audit.mjs` |
| Templates | `$AGENT_SYSTEM/templates/*`, including hook templates | active dependency | **portable source:** `templates/config.example.json` and `templates/secret-requirements.md`; project application scaffolds remain **project-specific** |
| Hooks and workflows | `$CODEX_HOME/hooks/*`; legacy hook sources for ctx7 guard, commit/push watcher, and no-verify protection | mixed: active dependency | **portable source:** `templates/hooks/ctx7-guard/{ctx7_guard.py,ctx7_guard_config.example.json,tests/}`, `templates/hooks/commit-push-watcher/{codex_commit_push_watcher.py,manage_commit_push_hook.sh}`, and `templates/hooks/block-no-verify/block_no_verify.sh`. Runtime state, LaunchAgent files, logs, session data, and local configuration remain **local-only exclusion** / **archive-only**. |
| Active automation contracts | `$CODEX_HOME/automations/skill-cleaner-audit` and `$CODEX_HOME/automations/reusable-agent-tooling` now target and run from Agent OS | portable source, live applied | Portable paused templates are `templates/automations/{skill-cleaner-audit,reusable-agent-tooling}/automation.toml`; owner schedules, backups, run records, and machine-selected paths are **local-only exclusion** / **archive-only**. |
| Skill Cleaner workflow | Legacy global skill contract and analyzer | active dependency | **portable maintainer workflow:** `skills/skill-cleaner/SKILL.md` and `skills/skill-cleaner/scripts/skill-cleaner.ts`. It is read-only/advisory; reports do not authorize deletion, disablement, or edits. |
| Configuration project record | Legacy project configuration record | project-specific | **reference-only:** no runtime deployment or host routing is copied into Agent OS. A consuming project owns its configuration schema and values. |
| One-shot migration follow-up | `$CODEX_HOME/automations/agent-os-migration-followup` | project-specific | **one-shot reference-only / non-runtime:** it is not a reusable automation and is intentionally not ported; its run state and notes remain private. |
| Project commands/workflows | Project `AGENTS.md`, `.agents/skills`, CI, deployment, promotion, and business-metric workflows | project-specific | Do not migrate to the base. `margins` and `promote` are explicitly excluded from the base in `manifest/commands.json`; a project may own replacements. |
| Third-party/plugin skill links | `$CODEX_HOME/skills/gstack/*`, plugin-cache links, and optional external skill directories | active dependency | These remain active optional external integrations, not Agent OS core. Keep them as an explicit reviewed installation decision. Evidence: `manifest/inventory-dispositions.json` `skillGroups.gstack` and `other-symlinks`. |
| Private archives and tool state | Tool-owned archives, application databases, logs, browser profiles, recordings, and host sessions referenced by live registry fields | archive-only | Never copied, inspected for migration, or used as a portable source. Each destination Mac creates fresh state and authenticates independently. |

## Current-to-target ownership map

| Live ownership | Current source (logical path) | Target ownership | Agent OS source |
| --- | --- | --- | --- |
| Global reusable behavior | `$CODEX_HOME/AGENTS.md` | Agent OS policy/profile | `policies/`, `profiles/`, `manifest/policies.json` |
| Local-tool routing | `$CODEX_HOME/local-tools/registry.yaml` | Agent OS manifests and generated host adapter | `manifest/tools.json`, `manifest/sources.json`, `bootstrap/cli.mjs` |
| Managed tool instructions | `$CODEX_HOME/local-tools/tools/<id>/SKILL.md` | Agent OS rendered tool template | `bootstrap/cli.mjs` using `manifest/tools.json` |
| Portable commands | `$AGENT_SYSTEM/commands/{add,commands,teach,trunk-finish}/SKILL.md` | Agent OS commands | `commands/{add,commands,teach,trunk-finish}/SKILL.md` |
| Rule intent | `$CODEX_HOME/rules/default.rules` | Agent OS generated allow-prefix file | `bootstrap/cli.mjs`; contract documented in `docs/architecture.md` |
| Install/lifecycle behavior | owner-machine setup helpers | Agent OS lifecycle CLI | `bootstrap/cli.mjs`, `bin/{setup,install,update,safe-uninstall,doctor,status,vault,live-cutover,live-rollback}`. Normal setup manages the `~/.local/bin/agent-os` launcher; cutover creates it only when absent or preserves an already ledger-managed launcher. |
| Shared hook behavior | `$AGENT_SYSTEM/hooks` and hook templates | Agent OS policy/template decision | `manifest/inventory-dispositions.json`, `policies/strict-portable.md` |

## Boundary decisions

1. AgentInbox and Vox are intentional **local-only exclusions**. They may
   remain live dependencies on this owner machine, but Agent OS must not render
   their skills, install instructions, provider settings, records, logs, or
   authentication material.
2. NoteBridge is a portable **contract**, not portable user data. New Macs may
   install it manually and grant their own permissions; Wispr Flow data, Apple
   Notes data, database files, and any export contents remain **archive-only**.
3. The same boundary applies to all secrets, encrypted-vault values/identities,
   OAuth/browser sessions, private message archives, recordings, host logs,
   account identifiers, and absolute machine paths. The portable repository
   contains only requirement classes, placeholders, safety boundaries, and
   reviewed source metadata.
4. A new destination is not a clone of the owner machine. It receives the
   portable source, then independently chooses optional tools, creates a vault,
   grants permissions, and signs in.

## Verification evidence

- Portable inventory and exclusions: `manifest/inventory-dispositions.json`.
- Selected tool contracts and installation provenance: `manifest/tools.json`
  and `manifest/sources.json`.
- Portable command declarations: `manifest/commands.json`.
- Host-link and generated-state design: `docs/architecture.md`.
- Twin obligations and privacy restrictions: `policies/twin-sync.md` and
  `docs/migration.md`.
- Live evidence inspected for this snapshot: `$CODEX_HOME/AGENTS.md`,
  `$CODEX_HOME/local-tools/registry.yaml`, `$CODEX_HOME/skills`,
  `$CODEX_HOME/hooks`, `$CODEX_HOME/rules/default.rules`, and
  `$AGENT_SYSTEM/{commands,hooks,templates,workflows}`.
