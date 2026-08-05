# Advanced Guide

## CLI

```text
agent-os setup [options]
agent-os status [--catalog] [--json]
agent-os doctor [--json]
agent-os update [options]
agent-os safe-uninstall [--apply]
agent-os validate [--json]
```

Common options:

- `--profile amit-strict`
- `--packs core,local-productivity,research,communication,creator`
- `--hosts codex,claude-code`
- `--home <path>`
- `--state-dir <path>`
- `--codex-home <path>`
- `--claude-home <path>`
- `--config <non-secret-json>`
- `--safe`
- `--apply`
- `--json`

Every destination must resolve underneath the selected `--home`. This provides a hard boundary for sandbox tests and prevents broad accidental targets.

## Preview and ownership

`setup` and `update` preview by default. `--apply` is required to write. Existing instruction files may receive a delimited Agent OS block; content outside it is preserved. Existing skill or command files are conflicts unless the state ledger proves Agent OS owns them.

The state ledger records hashes, not secrets. If a managed file or block drifts, update and uninstall refuse to overwrite/remove it.

## Packs and optional tools

The profile chooses packs. Pack tools are external declarations; setup generates routing/safety skills but does not install binaries. Third-party workflow skill sets such as gstack remain external and are not copied from caches.

## Updating

Agent OS never runs `git pull`. Update the private checkout through your normal reviewed Git workflow, then run:

```sh
./bin/update
./bin/update --apply
```

The same conflict and backup rules as setup apply.

## Uninstalling

Preview first:

```sh
./bin/safe-uninstall
./bin/safe-uninstall --apply
```

Only ledger-owned unchanged files and matching managed blocks are removed. Modified or unowned files remain with a conflict report. Backups and non-secret local configuration are retained.

## Development verification

Repository tests use only `.sandbox/` under the checkout:

```sh
npm test
npm run validate
```
