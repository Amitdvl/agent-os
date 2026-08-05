# Quickstart

Agent OS is preview-first. These commands are for a future deployment; building this repository did not run them against the current Mac.

## 1. Requirements

- macOS
- Git
- Node.js 20 or newer
- a private clone of this repository

From the repository:

```sh
./bin/agent-os validate
./bin/setup --profile amit-strict --safe
```

The second command prints every planned destination and changes nothing.

## 2. Review

Confirm:

- the selected home, Codex, Claude Code, and state directories;
- the `amit-strict` profile and selected packs;
- any unowned-file conflicts;
- external tools you actually want;
- human login, encrypted-vault, browser-session, and macOS permission checkpoints.

## 3. Apply later

Only after reviewing the preview:

```sh
./bin/setup --profile amit-strict --safe --apply
./bin/status
./bin/doctor
```

Apply installs Agent OS-owned instruction blocks, commands, and generated skills. It does not install external CLIs, authenticate accounts, import archives, grant permissions, enable hooks, or change focus-blocking infrastructure.

For another user's Mac, edit the generated non-secret config in their Agent OS state directory before re-running setup. Do not copy Amit's local state.

See the [fresh-Mac walkthrough](fresh-mac-walkthrough.md), [advanced guide](advanced.md), and [troubleshooting](troubleshooting.md).

