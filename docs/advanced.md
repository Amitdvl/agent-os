# Advanced Guide

```text
agent-os setup [--safe] [--adopt-existing] [--apply] [--profile strict-portable] [--packs a,b] [--hosts codex,claude-code]
agent-os install --tools a,b [--apply --reviewed-install]
agent-os vault init --tools a,b [--age-recipient age1… | --generate-age-key] [--apply]
agent-os vault validate [--verify-crypto]
agent-os vault bind --kind agent-secrets --root /absolute/user-owned/vault [--helper scripts/agent-secrets] [--apply]
agent-os vault unbind [--apply]
agent-os status [--catalog] [--json]
agent-os doctor [--json]
agent-os update [--apply]
agent-os reconcile-instructions [--apply]
agent-os reconcile-ownership [--apply] [--json]
agent-os safe-uninstall [--apply]
agent-os live-cutover --legacy-root <legacy-root> [--apply]
agent-os live-rollback [--apply]
```

`vault bind` is preview-first and invokes only the adapter's metadata-only
`list` operation. Status never opens or decrypts a record: filenames are
reported as `present-unverified`, while credential usability remains `unknown`
until the relevant tool preflight is explicitly requested. The binding is
machine-local configuration and is never copied into the portable repository.

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

`setup --adopt-existing` is a one-time compatibility migration for exact
portable files and existing host tool symlinks. It adopts byte-identical
portable files into the normal ledger and redirects only the declared portable
tool links to generated Agent OS contracts; it refuses a mismatched or
non-symlink destination. It never replaces a local adapter such as the vault
skill, host registry, hook configuration, or `default.rules`.

`reconcile-instructions` is the narrow repair for a stale managed-instruction
hash. It examines only the selected host instruction block and its ledger
record, and updates ledger metadata only when the live block is byte-for-byte
identical to the freshly rendered portable block. It never writes guidance or
touches skills, tools, rules, hooks, or other managed outputs; any content
difference stays a conflict.

`reconcile-ownership` repairs stale or missing ownership metadata without
writing any generated target, configuration, source package or discovery link.
It requires an existing valid ledger. Preview lists exact-content adoptions,
unchanged records and retirement of obsolete absent targets. Apply rechecks the
whole plan and ledger, saves an exact ledger backup, and updates only the ledger.
Any content difference, missing selected output, arbitrary symlink ancestor,
changed unselected managed target or ambiguous record refuses the entire repair.
Custom content must first be reviewed and preserved in its appropriate portable
source or explicit machine-local contract; reconciliation never blesses arbitrary
local content just to clear a conflict.

Existing skill/command directory links resolving exactly to their declared
checkout source are represented as discovery-link ownership. Their literal link
spelling is preserved; descendant files are not owned through them. Ordinary
update leaves source packages untouched, and uninstall removes only the discovery
link. Same-content copies at a different link target are not canonical source
links and remain protected conflicts. Copied installations retain file ownership.
This recognizes existing source links; it does not convert copied installations.

Lifecycle applies use an exclusive `~/.agent-os/lifecycle.lock` directory and
reload configuration and ownership after acquiring it. A competing CLI writer
refuses before mutation; the lock is released on success or error. After a
crash, inspect for an active writer before manually removing its stale lock.
Do not edit managed targets or the ledger using other processes during apply:
the lock coordinates Agent OS CLI writers using the same state directory,
not arbitrary external editors. Independent installations with overlapping host
targets and different state directories also require external serialization.
Ownership repair also refuses redirected backup storage, non-normalized ledger
paths, and repeated or malformed instruction markers. Ordinary update and
uninstall reject file records reached through symlinks even before reconciliation.

Generated allow rules use one broad prefix per selected binary because command-specific rules make normal local operation fragile. They do not authorize external writes: every tool template and global policy still requires exact user intent.

The portable drift guard audits every top-level symlink in the configured live
skill roots before inventory filtering. It also checks registered local-tool
`SKILL.md`/`routing.md` pairs, absolute skill references in live instructions,
and the governed ctx7 hook test copy. An unknown but valid live skill must be
added to the portable inventory or named as an explicit machine-only exclusion;
a dangling link is always a failure.

Registry `skill` and discovery `skill_symlink/SKILL.md` must resolve to the same
file, even if competing copies have identical text. Tool setup/update generates
both `SKILL.md` and `routing.md`; `render-tool <id> --routing` prints the latter.
Twin audit compares both with portable source. Preserve private supplemental
helpers, executables and configuration in older directories; aliases may replace
duplicate documents, never whole tool directories.

The live managed instruction block must exactly match the policies selected by
its profile. Missing, repeated or malformed markers and policy drift fail the
audit, even if an outside paragraph repeats a required phrase. A renderer-owned
`Local Identity` appendix remains machine-only. See
[instruction consolidation](standing-instructions.md) for the preservation map.
