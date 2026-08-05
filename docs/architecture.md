# Architecture

## Design contract

Agent OS is a source-controlled distribution that renders a personal agent workflow onto a Mac. The repository owns portable intent; the destination machine owns identity, paths, credentials, accounts, permissions, application state, and archives.

The default profile is `amit-strict`. Setup is preview-first and fail-closed: without `--apply`, it produces a plan only. Even with `--apply`, it does not install external packages, authenticate services, extract browser state, weaken focus protections, or overwrite unowned files.

## Canonical repository layout

```text
agent-os/
  bin/                 executable entry points
  bootstrap/           standard-library implementation
  commands/            portable slash-command packages
  docs/                inventory, guides, evidence, and status
  manifest/            tools, commands, packs, profiles, sources, compatibility
  policies/            portable core and profile policy modules
  profiles/            profile documentation and generated instruction entrypoints
  skills/              first-party skills shipped by Agent OS
  templates/           local config, secret requirements, rendered-file templates
  tests/               repository-only validation and sandbox integration tests
```

Manifests are JSON so the Node standard library can parse them without package installation. `manifest/schema-version.json` is the compatibility anchor. All manifest records have stable IDs, explicit disposition, and an install/authentication status.

## Runtime and generated state

Default deployment locations are derived at runtime and may be overridden:

| Logical value | Default | Purpose |
|---|---|---|
| `AGENT_OS_REPO` | current repository | Immutable portable source |
| `AGENT_OS_STATE_DIR` | `${userHome}/.agent-os` | State ledger, rendered output, backups |
| `CODEX_HOME_DIR` | `${userHome}/.codex` | Codex destination |
| `CLAUDE_HOME_DIR` | `${userHome}/.claude` | Claude Code destination |
| `AGENT_OS_PROFILE` | `amit-strict` | Selected opinionated behavior |
| `AGENT_OS_PACKS` | profile defaults | Selected capabilities |
| `AGENT_OS_USER_NAME` | unset | Optional conversational identity |
| `AGENT_OS_VAULT_ADAPTER` | unset | Optional local secret-provider command |
| `AGENT_OS_OBSIDIAN_VAULT` | unset | Optional private vault path |

Generated state contains no secret values:

```text
~/.agent-os/
  config.json          user choices and non-secret paths
  state.json           files managed by Agent OS and their hashes
  plans/               latest preview plan
  rendered/            generated instruction/skill files
  backups/<timestamp>/ files displaced by an explicit apply
```

The installer must accept `--home`, `--state-dir`, `--codex-home`, and `--claude-home`. Tests always point these values at a sandbox inside the repository.

## Profile model

Profiles select policies and packs; they do not contain credentials. `amit-strict` preserves:

- local-work autonomy when target and intent are clear;
- explicit authority for external writes, sends, destructive actions, and account mutations;
- Agent Vault-first secret handling without asking for secrets in chat;
- memory disabled;
- non-negotiable distraction protections, including no unblock mechanism;
- freshness-before-answer rules for local archives;
- proactive thread naming where supported;
- Codex App automation preference for local workflows;
- read-only-first accessibility fallbacks;
- concise, evidence-backed completion and verification.

Identity and praise language is a configurable profile extension. It is not inherited by another person unless they select it and provide their own wording.

## Capability packs

- **core**: global instruction rendering, command catalogue, secrets contract, goal prompting, finishing, verification, hook templates, status/doctor.
- **local-productivity**: Agent Inbox, Notion, Notion archive, Obsidian, Apple Reminders, Peekaboo.
- **research**: Birdclaw, X transports, Reddit, OpenCLI, public media, and external research skills.
- **communication**: WhatsApp live/archive, Discord, X writes, Instagram CLI, Vox.
- **creator**: OpenCap, Spotify control, media processing, image/speech/video skill declarations.

Packs declare external dependencies but do not automatically install or authenticate them. `amit-strict` selects all five packs to represent Amit's workflow; unavailable dependencies remain visible warnings rather than being hidden.

## Host adapters

Codex and Claude Code receive the same generated policy with host-specific placement:

- Codex: managed instruction block in `AGENTS.md`; managed skills under `skills/<id>`.
- Claude Code: managed instruction block in `CLAUDE.md`; managed skills under `skills/<id>` and commands under `commands/<id>.md` when supported.

Agent OS never replaces an entire host instruction file. It owns only a delimited block:

```text
<!-- agent-os:start profile=amit-strict -->
...
<!-- agent-os:end -->
```

Existing content outside that block is preserved byte-for-byte. A conflicting pre-existing skill/command path is reported and skipped unless its recorded hash proves Agent OS already owns it.

## Bootstrap lifecycle

### `setup`

1. Load and validate manifests.
2. Resolve profile, packs, home directories, and host targets.
3. Detect dependencies with `command -v`; never read credential stores.
4. Render instructions and skills into a staging directory under state.
5. Compare planned destinations with the state ledger.
6. Print a plan. Stop here unless `--apply` is present.
7. On apply, create destination parents, back up only files that will change, write atomically, and record hashes.
8. Print human login and macOS permission checkpoints separately from setup success.

`--safe` guarantees no package-manager or authentication command can execute. The initial implementation never executes either, so safe mode also serves as an explicit contract for future versions.

### `status`

Reports selected profile/packs, managed-file drift, unowned conflicts, missing binaries, and outstanding human checkpoints. It does not contact remote services.

### `doctor`

Validates manifests, platform/runtime, managed hashes, skill presence, binary availability, and declared non-secret configuration. Auth checks are named instructions, not commands executed automatically.

### `update`

Compares the installed state ledger's repository version and manifest digest to the current checkout. Default is preview. `--apply` re-renders through the same setup engine and backup rules. It never runs `git pull` or a package manager.

### `uninstall`

Default is preview. `--apply` removes only files whose current hashes still match the state ledger, removes only Agent OS-managed instruction blocks, and leaves modified/unowned files in place with warnings. Backups and user config are retained unless a future explicit purge operation is designed.

## Conflict and backup policy

- No unrecorded overwrite.
- Managed blocks are updated in place; surrounding text is untouched.
- Existing destination paths without matching ledger ownership are conflicts.
- Backups live under the dedicated state directory and contain only files the user explicitly applied.
- Atomic writes use sibling temporary files followed by rename.
- A failed apply leaves the previous state ledger unchanged and reports recovery paths.

## Secrets and authentication

`manifest/secrets.json` contains requirement names, owning tool, access class, and human setup instructions only. The repository never stores values or encrypted personal records. A vault adapter may later execute a user-configured command, but Agent OS itself does not decrypt or print results.

Authentication classes:

- `none`: no login expected;
- `human-login`: user completes an interactive login;
- `browser-session`: user deliberately connects an existing browser session;
- `agent-vault`: a separately installed vault injects named environment variables;
- `macos-permission`: user grants OS permission in System Settings;
- `telecom-consent`: phone/call setup additionally requires disclosure, consent, and regulatory review.

## Upgrade and compatibility

- Repository and manifest schema versions are independent.
- Unknown major schema versions fail closed.
- Tool versions may be exact pins or explicitly `manual-unresolved`; unresolved tools cannot be auto-installed.
- Agent OS does not promise byte-identical behavior across Codex and Claude Code; it promises policy and capability parity where both hosts expose equivalent features.
- macOS is the supported Phase 2 platform. Apple Silicon and Intel Homebrew prefixes are detected rather than hardcoded.

## Non-goals

- Copying accounts, archives, sessions, browser state, or Agent Vault records.
- Automatically granting Accessibility, Screen Recording, Reminders, or browser-extension permissions.
- Publishing the repository or creating a remote.
- Replacing upstream tools with a wrapper.
- Claiming a fresh-Mac installation has succeeded before it is run on a separate environment.
