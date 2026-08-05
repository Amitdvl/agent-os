---
name: add
description: Use when the user invokes /add to onboard a machine-local CLI or external tool for automatic agent use across Codex local tools, AGENTS guidance, Agent Vault inventory, and the Agent OS portable registry.
---

# Add

Use `/add` when the user wants a new machine-local CLI, website adapter, external
tool, or service-backed command prepared for automatic future agent use.

## Usage

```text
/add <tool-name-or-url>
/add https://github.com/openclaw/notcrawl
/add rdt-cli
```

No argument: ask for the target tool name, package, repository, documentation
URL, or binary.

## Operating Principle

Deliver a working agent-facing local-tool integration, not just notes. Discover
the tool's real install path, commands, auth model, data roots, write surfaces,
and safety boundaries before editing shared instructions. Preserve unrelated
dirty work and never expose secrets.

## Workflow

1. Inspect current state:
   - Check `git status --short` in the Agent OS repository.
   - Check whether the tool already exists in the live Codex local-tools registry, the Agent OS tool manifest, and the live Codex skill symlink root.
   - Check `command -v <binary>` when a likely binary name is known.
2. Discover the upstream tool:
   - For repository or documentation URLs, inspect README, install docs, release notes, package manifests, and CLI help.
   - Identify binary names, install methods, version command, help command, config paths, data roots, credential sources, structured output flags, read commands, write commands, and destructive/account-mutating commands.
   - Prefer primary docs and the installed CLI's own help over inferred behavior.
3. Install or configure only what is needed for agent use:
   - Use the upstream-recommended package manager when it matches this machine.
   - Do not silently install browser extensions, grant OAuth access, log into accounts, or mutate remote state.
   - For auth, use Agent Vault before asking the user; never ask for pasted secrets in chat.
4. Create or update local tool integration:
   - Write the live Codex local-tools skill file for `<tool>`.
   - Add or update the `<tool>` entry in the live Codex local-tools registry.
   - Create the live Codex skill symlink for `<tool>` pointing at the local-tools skill folder.
5. Mirror into Agent OS:
   - In the same task, update the Agent OS portable tool manifest, source metadata, capability pack, canonical tool contract, generated registry/symlink/allow-rule behavior, secret-requirement metadata, documentation, and tests.
   - If the tool is intentionally machine-only or cannot be shared safely, record a specific Agent OS inventory exclusion and reason; never silently omit it.
   - Run Agent OS validation, tests, `git diff --check`, and `./bin/twin-audit` against the live registry, command source, goal-prompt skill, and global instructions. Commit the intended Agent OS change locally.
6. Update global routing guidance:
   - Add concise guidance to the live Codex `AGENTS.md` under `Local Machine CLIs`.
   - Include when to use the tool, freshness/sync expectations, write-safety boundaries, and secret-safety rules.
7. Update Agent Vault when needed:
   - Use the global `agent-secrets` skill for credentials, tokens, OAuth, browser sessions, SaaS accounts, package registries, deploy targets, databases, webhooks, or secret-bearing config paths.
   - Add or update encrypted inventory under the Agent Vault tools directory.
   - Capture env var names, scopes, source paths, account/project names, and agent-vs-human access classification.
   - Store actual values only when safe under Agent Vault rules.
   - Verify the Agent Vault tmp directory is empty after secret operations.
8. Verify the integration:
   - Run `command -v <binary>`.
   - Run the tool's version and help commands.
   - Validate the live local-tool registry and Agent OS tool manifest.
   - Run `npm run validate` and `npm test` in the Agent OS repository.
   - Verify the `.codex/skills/<tool>/SKILL.md` symlink resolves.

## Skill Document Requirements

Each local-tool `SKILL.md` must include:

- Frontmatter with `name`, `description`, and install metadata when available.
- Local setup notes: install command, binary path, setup version, config paths,
  data roots, and credential sources.
- Safety rules: secrets, read/write boundaries, remote mutations, destructive
  commands, and exact-user-intent requirements.
- Preflight commands.
- Common read commands and, when applicable, guarded write commands.
- Troubleshooting and limitations.

## Registry Requirements

Each registry entry must include:

- `purpose`: concise routing summary.
- `binary`: executable agents should call.
- `skill`: live Codex local-tools skill path for `<tool>`.
- `skill_symlink`: live Codex skill symlink path for `<tool>`.
- `data_root`: concrete path, `tool-owned`, external service name, or `none`.
- `secrets`: `none`, `external`, a specific Agent Vault path, or a concise
  description of browser/tool-owned credentials.
- `removable: false`.

## Verification Commands

Resolve the registry and skill-root variables from the active machine's
`AGENTS.md` and local-tool registry before running:

```bash
command -v <binary>
<binary> --version || <binary> version
<binary> --help
ruby -ryaml -e 'ARGV.each { |f| YAML.load_file(f); puts "ok #{f}" }' "$CODEX_LOCAL_TOOLS_REGISTRY"
npm run validate
npm test
test -f "$CODEX_SKILL_ROOT/<tool>/SKILL.md"
```

When Agent Vault is touched, verify decryptability without printing plaintext
and confirm the Agent Vault tmp directory is empty.

## Stop Conditions

- The target tool cannot be identified from the user's input.
- Installation requires an account login, OAuth grant, browser extension, or
  paid/remote action that the user has not explicitly requested.
- Upstream docs conflict with installed CLI behavior in a way that affects safe
  operation.
- Existing dirty changes overlap the files that must be edited and ownership
  cannot be determined.
- Secrets are required but unavailable through Agent Vault and cannot be safely
  created during the task.

## Output Contract

- `Tool`: name, binary, version, and install source.
- `Integration`: local skill, registry, AGENTS guidance, source mirror, Agent OS
  twin status, symlink, and Agent Vault status.
- `Verification`: exact commands and results.
- `Blocked`: exact blocker and next action, if not completed.
