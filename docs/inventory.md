# Effective Workflow Inventory

Audit date: 2026-08-05. This inventory was built from the live instruction and metadata surfaces named in the goal. No credential store, browser profile, message archive, private database, decrypted SOPS document, or tool-owned state directory was inspected.

## Disposition vocabulary

- **Portable core**: ship an original, host-neutral rule, schema, command, or skill in this repository.
- **`amit-strict` profile**: preserve the opinionated behavior, but parameterize identity, paths, accounts, and machine state.
- **Private machine/account state**: never package; create or authenticate locally after installation.
- **Third-party dependency**: declare an install source and compatibility requirement; do not vendor without confirmed redistribution rights.

## Audit summary

- The live local-tool registry contains 19 tools and all 19 skill symlinks resolve.
- The live `doctor.sh` checks only 12 binary names and is stale relative to the registry. Agent OS must generate diagnostics from manifests rather than maintain a second list.
- `/Users/amitdvl/agent-system` already contains useful reusable schemas, commands, policies, and a 14-tool source mirror. It is an upstream/reference dependency, not the Agent OS installation target. Its worktree was dirty during audit and its local-tool mirror lacked five live tools: `instagram-cli`, `opencap`, `rdt-cli`, `spogo`, and `vox`.
- The global skill root contained 89 entries: 45 symlinks and 44 real directories. Symlinks comprised 19 local tools, 21 gstack workflows, three installed personal commands, one cached plugin skill, and one external `.agents` skill.
- Installed personal command links: `/add`, `/commands`, `/trunk-finish`. `/teach` exists in source but was not linked into the live global skill root. `margins` and `promote` are explicitly rejected/source-only concepts.
- The commit/push popup LaunchAgent was disabled and not loaded. Hook source remains present.
- The current task workspace had no repo-local `AGENTS.md` or `.agents/skills`. The relevant source repository, `agent-system`, has its own `AGENTS.md` but no live `.agents/skills` subtree at the audited depth.

## Global instruction policy

| Surface | Purpose | Disposition | Portability decision and concern |
|---|---|---|---|
| Identity and praise language | Personal conversational tone | `amit-strict` profile | Keep as optional profile variables; never impose Amit's identity on another user. |
| Thread naming | Keep Codex task list legible | Portable core | Adapter must no-op when the host lacks thread-title tooling. |
| Local automation preference | Prefer Codex App automations for local workflows | `amit-strict` profile | Keep the decision rule; host-specific storage stays external. |
| Memory disabled | Avoid hidden continuity stores | `amit-strict` profile | Preserve exactly for this profile; do not create `memory.md`. |
| Distraction-site protection | Refuse weakening distraction blocks; bounded YouTube; CLI-only Instagram | `amit-strict` profile | Preserve without shipping an unblock path. Enforcement configuration is private host state. |
| Repo skill ownership | `.agents/skills` is canonical for consuming repos | Portable core | Keep; `agent-system` is an upstream reference, not a runtime path. |
| Local-work autonomy | Proceed on clear local work without approval theater | `amit-strict` profile | Preserve while retaining exact-target safeguards for external writes and destructive operations. |
| Agent Vault discipline | Never request/print secrets; maintain encrypted inventory | Portable core | Ship only the interface contract and secret requirement names. Vault implementation and records remain private. |
| Accessibility fallbacks | Browser/Computer Use, then Peekaboo | Portable core | Capability-gated; no UI action without task authority. |
| Archive freshness | Sync Discrawl, WhatsApp, Birdclaw, and Notion archives before fresh answers | Portable core | Encode per-tool freshness policies in manifests. |
| Local CLI routing | Prefer registered CLIs and exact intent for writes | Portable core plus packs | Generate from tool manifests; paths and accounts are configuration. |
| New-tool onboarding | Update registry, skills, rules, source mirror, and Agent Vault | Portable core command | `/add` must adapt to the target installation and stop before unapproved login. |

## Local tools

Each row classifies the binary separately from the reusable routing/safety contract. Unknown or unpublished sources must remain manual until Phase 2 provenance verification.

| Tool | Purpose | Source/install evidence | Pack | Disposition | Authentication, security, and licensing concern |
|---|---|---|---|---|---|
| `agent-inbox` | Local Agent Inbox reads and explicit sends/status changes | `/usr/local/bin/agent-inbox`; source unresolved | local-productivity | Third-party dependency; portable skill contract | Local app database is private; writes require exact intent; redistribution unverified. |
| `birdclaw` | X archive analysis plus guarded live actions | Homebrew `birdclaw` 0.9.4 | research, communication | Third-party dependency; portable skill contract | `~/.birdclaw`, DMs, tokens, and archive are private; upstream license/source must be pinned. |
| `discrawl` | Discord archive sync/search and supported writes | Homebrew `discrawl` 0.11.4 | communication | Third-party dependency; portable skill contract | Bot token/archive private; full sync is the freshness boundary; redistribution unverified. |
| `instagram-cli` | Instagram Direct/profile reads and exact messaging actions | Homebrew tap, 2.0.1 | communication | Third-party dependency; portable skill contract | Interactive user-owned session; unofficial client/ToS risk; website access remains disallowed by profile. |
| `notcrawl` | Notion local archive, sync, SQL, export, private share | Homebrew `openclaw/tap/notcrawl` 0.5.1 | local-productivity | Third-party dependency; portable skill contract | Local cache/database and Notion token private; publishing requires explicit push intent. |
| `notion` | Notion API reads and explicit page creation/append | `/opt/homebrew/bin/notion`; local source snapshot | local-productivity | External/local dependency; portable skill contract | Agent Vault env is private; source ownership/license must be recorded before distribution. |
| `obsidian` | Vault search, links, reads, and explicit note edits | Binary absent during audit; install source unresolved | local-productivity | Third-party dependency; portable skill contract | Vault path/content private; read-only default; source/license unresolved. |
| `opencap` | Screen video recording, events, upload/share/edit | dedicated `~/.opencap` install, 0.1.4 documented | creator | Third-party dependency; portable skill contract | Credentials and recordings private; remote/share/delete actions guarded; source/license unresolved. |
| `opencli` | Browser-backed site adapters and Browser Bridge | npm `@jackwener/opencli` 1.8.6 | research | Third-party dependency; portable skill contract | Browser sessions/cookies private and powerful; extension/login remains manual; package license audit required. |
| `peekaboo` | macOS screen/window inspection and UI automation | Homebrew `peekaboo` 3.7.1 | local-productivity, creator | Third-party dependency; portable skill contract | macOS Accessibility/Screen Recording permissions are human-granted; UI writes need exact authority. |
| `rdt-cli` | Reddit browsing, exports, account reads/writes | uv Git install, 0.4.2 / commit prefix `5e4fb37` | research, communication | Third-party dependency; portable skill contract | Browser-cookie cache private; pin full upstream commit and confirm license before install automation. |
| `remindctl` | Apple Reminders reads and explicit mutations | Homebrew `remindctl` 0.3.2 | local-productivity | Third-party dependency; portable skill contract | macOS-only permission; UI fallback helper is first-party candidate but must be path-neutral. |
| `spogo` | Spotify search, playback, queue, library/playlists | Homebrew `steipete/tap/spogo` 0.10.0 | creator | Third-party dependency; portable skill contract | Browser cookies private; playback is a user-visible write; upstream license audit required. |
| `twitter-cli` | Live X timelines/search/bookmarks and writes | uv `twitter-cli` 0.8.5 | research, communication | Third-party dependency; portable skill contract | Cookie/keychain access private; avoid verbose auth output; pin package/source before automation. |
| `vox` | Local Twilio/OpenAI Realtime phone bridge | local launcher; vendored source commit documented | communication, creator | Third-party source reference; portable skill contract | Phone numbers, API keys, logs, consent and telecom obligations are private; license file exists but redistribution must be confirmed. |
| `wacli` | Live WhatsApp linked-device reads and writes | Homebrew `wacli` 0.11.2 | communication | Third-party dependency; portable skill contract | Linked-device state private; sends and group/account mutations require exact target/action. |
| `wacrawl` | Read-only WhatsApp Desktop archive | Homebrew `wacrawl` 0.3.1 | communication | Third-party dependency; portable skill contract | App container/archive private; sync before fresh answers; no WhatsApp mutations. |
| `xurl` | X OAuth/API transport and guarded live actions | Homebrew or npm source declared in skill; installed version unresolved | research, communication | Third-party dependency; portable skill contract | `~/.xurl` private; no inline auth or verbose headers; pin exact upstream release. |
| `yt-dlp` | Public-media metadata/subtitles and authorized downloads | Homebrew `yt-dlp` 2026.7.4; `ffmpeg` 8.1.2 | research, creator | Third-party dependency; portable skill contract | Public/authorized media only, bounded downloads, no cookies/proxy bypass; licenses must be retained if redistributed. |

## Slash commands

| Command | Effective state | Purpose | Disposition |
|---|---|---|---|
| `/add` | Installed symlink; source has uncommitted work | Onboard a machine-local CLI across registry, skills, policy, and vault metadata | Portable core, rewritten around Agent OS manifests and deployment boundary. |
| `/commands` | Installed symlink; source has uncommitted work | Derive the capability catalogue from live sources | Portable core, manifest-driven. |
| `/trunk-finish` | Installed symlink | Verify, commit, and finish trunk-based work | Portable core with repo-specific configuration. |
| `/teach` | Source-only, not installed globally | Socratic teaching loop | Portable core; include as available but disabled-by-default migration candidate. |
| `margins` | Rejected document | Business-specific reporting | Intentionally excluded; reference only. |
| `promote` | Rejected document | Project-specific production promotion | Intentionally excluded; reference only. |

## Installed global skills

All 89 entries have a disposition below. Names are listed explicitly to prevent silent omission.

### Local-tool skill symlinks — portable contracts, external binaries

`agent-inbox`, `birdclaw`, `discrawl`, `instagram-cli`, `notcrawl`, `notion`, `obsidian`, `opencap`, `opencli`, `peekaboo`, `rdt-cli`, `remindctl`, `spogo`, `twitter-cli`, `vox`, `wacli`, `wacrawl`, `xurl`, `yt-dlp`.

Disposition: represented by Agent OS tool manifests and generated first-party routing/safety skills. Existing personal paths, setup snapshots, archives, and credential hints are excluded.

### Personal command symlinks — portable core

`add`, `commands`, `trunk-finish`.

Disposition: ship adapted command packages. The source repository remains an upstream reference and is not modified.

### gstack symlinks — third-party workflow pack

`browse`, `careful`, `codex`, `design-consultation`, `design-review`, `document-release`, `freeze`, `gstack-upgrade`, `guard`, `investigate`, `office-hours`, `plan-ceo-review`, `plan-design-review`, `plan-eng-review`, `qa`, `qa-only`, `retro`, `review`, `setup-browser-cookies`, `ship`, `unfreeze`.

Disposition: external optional pack. Do not copy until source, version, and license are pinned. Agent OS records availability and gives installation guidance only.

### Other symlinks — third-party dependencies

- `last30days`: cached plugin skill; install through its plugin/source, never copy cache state.
- `remotion-best-practices`: external `.agents/skills` source; pin provenance/license or omit.

### Real skill directories — grouped disposition

- **System/runtime, never vendor:** `.system`, `codex-primary-runtime`. Detect host availability.
- **Portable profile/core candidates, provenance required before copying:** `agent-secrets`, `cli-for-agents`, `current-limiting-factor`, `engineer-algorithm`, `goal-prompt`, `gstack`, `hatch-pet`, `make-interfaces-feel-better`, `mentor`, `viral-sense`. Agent OS implements compatible policy/manifest entries; source content is copied only if ownership or license is confirmed.
- **External platform/development skills:** `agents-sdk`, `chatgpt-apps`, `cloudflare`, `cloudflare-deploy`, `cloudflare-email-service`, `cloudflare-one`, `cloudflare-one-migrations`, `doc`, `durable-objects`, `figma`, `figma-code-connect-components`, `figma-create-design-system-rules`, `figma-create-new-file`, `figma-generate-design`, `figma-generate-library`, `figma-implement-design`, `figma-use`, `gh-address-comments`, `gh-fix-ci`, `imagegen`, `playwright`, `render-deploy`, `sandbox-sdk`, `screenshot`, `security-best-practices`, `security-threat-model`, `sentry`, `speech`, `turnstile-spin`, `web-perf`, `workers-best-practices`, `wrangler`. Detect/install from authoritative upstream packages or plugins; do not vendor caches or unverified code.

## Hooks and rules

| Asset | Effective state | Disposition | Concern |
|---|---|---|---|
| Commit/push watcher | Source present; LaunchAgent disabled and unloaded | `amit-strict` optional macOS hook | Parameterize label/paths; never enable during repository setup without explicit apply and confirmation. |
| `manage_commit_push_hook.sh` | Present | `amit-strict` optional hook manager | Current file hardcodes Amit paths and deletes logs/state on disable; ship only a generated, scoped equivalent. |
| Context7 dependency-docs guard | Source/config/tests present; reusable mirror exists in `agent-system`; live activation not proven | Portable core optional guard | Config-driven; hook host support required. Never infer activation from source presence. |
| No-`--no-verify` guard | Script present; Codex hook trust state for an onboard git guard exists | Portable core guard | Installation manifest origin was not found in audited paths; package as opt-in and test failure messages. |
| `.DS_Store`, `__pycache__`, hook runtime logs/state | Runtime residue | Private machine state | Ignore and never package. |
| Broad local-tool allow rules | Present for registered binaries and several development commands | `amit-strict` generated policy | Generate from manifests; avoid copying absolute paths. Broad rules still require tool-level write safeguards. |
| Transient login URL rules and one-off install commands | Present in live rules | Private/transient state | Never copy. They may embed expired verification context and are not durable policy. |

## Private state exclusions

The following are represented only by requirement names and human setup steps: Agent Vault records; OAuth/API tokens; browser cookies and keychain values; Notion/Discord/WhatsApp/X/Instagram/Spotify sessions; local archives and message bodies; Obsidian vault contents; recordings; phone numbers and call logs; account/workspace IDs; application-support databases; Codex sessions/logs/memories; generated hook state; and all user-specific absolute paths.

## Phase 2 obligations derived from drift

1. Generate doctor/status checks from manifests so registry and diagnostics cannot diverge.
2. Keep live configuration untouched unless a later user explicitly runs an apply command.
3. Install into a dedicated state directory and manage only recorded files.
4. Render user identity, paths, vault adapter, and accounts from local configuration.
5. Preserve `amit-strict` focus, memory, autonomy, freshness, write-intent, and secret rules.
6. Declare every external skill/tool as pinned, manual, or intentionally unavailable; never silently fall back to copying local caches.
7. Treat fresh-Mac authentication and macOS permissions as human checkpoints, not installer success.
