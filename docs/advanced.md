# Advanced Guide

```text
agent-os setup [--safe] [--apply] [--profile strict-portable] [--packs a,b] [--hosts codex,claude-code]
agent-os install --tools a,b [--apply --reviewed-install]
agent-os vault init --tools a,b [--age-recipient age1… | --generate-age-key] [--apply]
agent-os vault validate [--verify-crypto]
agent-os status [--catalog] [--json]
agent-os doctor [--json]
agent-os update [--apply]
agent-os safe-uninstall [--apply]
```

All destination options (`--home`, `--state-dir`, `--codex-home`, `--claude-home`, and `--vault-dir`) must remain under `--home`. This makes isolated testing and recovery bounded.

`status` reports ledger drift, registry presence, CLI availability, vault requirements, and outstanding human auth/permission checkpoints without inspecting private state. `doctor` validates the portable bundle and gives the next safe command. Neither command contacts a service.

Generated allow rules use one broad prefix per selected binary because command-specific rules make normal local operation fragile. They do not authorize external writes: every tool template and global policy still requires exact user intent.
