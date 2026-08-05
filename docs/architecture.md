# Architecture

Agent OS owns portable policy and rendered integration structure. A destination Mac owns its identity, accounts, encryption keys, permissions, private archives, and application state.

## Layout and deployment

```text
agent-os/                         # portable source checkout
~/.agent-os/                      # generated state, ledger, backups
  local-tools/
    registry.json                 # path-resolved portable registry
    tools/<id>/SKILL.md           # one complete managed template per tool
  vault/                          # optional, independently created SOPS + age vault
~/.codex/skills/<id> -> ~/.agent-os/local-tools/tools/<id>
~/.claude/skills/<id> -> ~/.agent-os/local-tools/tools/<id>
~/.codex/rules/agent-os.rules     # broad binary-prefix rules for selected tools
```

The local-tools root is the sole rendered tool source. Both hosts link to it instead of receiving divergent copies. The state ledger records hashes for files and targets for symlinks. Any unowned path or changed managed target is a conflict; setup, update, and uninstall refuse to overwrite it. Changed content is backed up under `~/.agent-os/backups` before a managed replacement.

## Modes

- Preview is the default for setup, update, install, vault init, and uninstall.
- `--apply` writes only the reviewed plan.
- `--safe` is core-only, excludes tool registry/symlinks/rules, and refuses package installation, SOPS/age execution, and vault decryption.
- `install` is separate from setup. It plans only selected tools; execution additionally requires `--apply --reviewed-install` and supports only resolved install sources.
- `vault init` creates a new SOPS + age configuration plus encrypted non-secret inventory/env placeholders. `vault validate --verify-crypto` decrypts to `/dev/null` only; it never prints values.

## Host adapters

Codex receives an Agent OS-delimited block in `AGENTS.md`, first-party skills, tool symlinks, and generated allow-prefix rules. Claude Code receives the same block, first-party skills/tool symlinks, and Markdown command files. Content outside the delimited block is unchanged.

## Safe boundaries

Tool templates preserve each tool’s preflight, data-root placeholder, freshness requirement, auth class, read/write boundary, limitation, and troubleshooting step. They never contain credential paths or values. “Exact intent” remains required for all external writes. Archive tools retain sync-before-answer requirements; Instagram retains its CLI-only rule.
