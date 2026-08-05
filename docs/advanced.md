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
agent-os live-cutover --legacy-root <legacy-root> [--apply]
agent-os live-rollback [--apply]
```

All destination options (`--home`, `--state-dir`, `--codex-home`, `--claude-home`, and `--vault-dir`) must remain under `--home`. This makes isolated testing and recovery bounded.

Normal setup/update/safe-uninstall also manage the single local launcher at
`~/.local/bin/agent-os`. It is a symlink to this checkout's `bin/agent-os` and
uses the same ledger conflict/drift rules as other generated local state.

`status` reports ledger drift, registry presence, CLI availability, vault requirements, and outstanding human auth/permission checkpoints without inspecting private state. `doctor` validates the portable bundle and gives the next safe command. Neither command contacts a service.

`live-cutover` is a separate Codex-only transaction, not a setup/update mode.
It manages only the four command links and one exact guidance sentence. The
first apply requires `--legacy-root`; it also creates the managed local launcher
when absent (or recognizes the normal lifecycle's managed launcher). Its state
and private guidance backup stay under the local Agent OS state directory. `live-rollback` restores only a
verified, undrifted transaction and otherwise refuses to write.

Generated allow rules use one broad prefix per selected binary because command-specific rules make normal local operation fragile. They do not authorize external writes: every tool template and global policy still requires exact user intent.
