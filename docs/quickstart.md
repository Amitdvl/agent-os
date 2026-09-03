# Quickstart

Agent OS is preview-first. It can set up the portable core without installing software, contacting a service, logging in, granting a macOS permission, or modifying an existing unowned file.

## Before starting

- macOS or Windows, Git, and Node.js 20+
- a clone of this repository in a user-owned folder
- Codex and/or Claude Code installed and signed in through their normal user flows

## The safe first run

On macOS or a POSIX shell:

```sh
./bin/agent-os validate
./bin/setup --safe
./bin/setup --safe --apply
./bin/status --json
./bin/doctor --json
```

On Windows PowerShell, invoke the Node entry point directly:

```powershell
node .\bootstrap\cli.mjs validate
node .\bootstrap\cli.mjs setup --safe
node .\bootstrap\cli.mjs setup --safe --apply
node .\bootstrap\cli.mjs status --json
node .\bootstrap\cli.mjs doctor --json
```

`--safe` is real: it selects only the `core` pack and refuses installation, SOPS/age execution, and vault decryption. It creates only Agent OS policy, first-party skills, and commands. The first command is always a no-write preview; `--apply` is separately required.

Core setup also manages `~/.local/bin/agent-os` as a symlink to this checkout's
launcher, so the installed `/commands` and `/add` contracts can invoke
`agent-os`. An existing unowned launcher is a conflict rather than a file to
overwrite.

On Windows, the managed launcher is `%USERPROFILE%\.local\bin\agent-os.cmd`.
Windows setup deploys every compatible tool contract and reports every excluded
tool in its JSON plan and status. The Windows-compatible subset is Obsidian,
OpenCLI, rdt-cli, twitter-cli, wacli, wacrawl, xurl, yt-dlp, and the local
YouTube wrapper. Apple-specific tools and tools without a documented Windows
runtime remain excluded; live command cutover is also macOS-only.

## Add optional capabilities later

Preview a full tool deployment (managed registry, templates, symlinks, and Codex binary allow rules):

```sh
./bin/setup --packs core,local-productivity,research,communication,creator
./bin/setup --packs core,local-productivity --apply
```

On Windows PowerShell, preview and apply the full platform-compatible suite:

```powershell
node .\bootstrap\cli.mjs setup --json
node .\bootstrap\cli.mjs setup --apply --json
node .\bootstrap\cli.mjs status --json
```

Setup deploys contracts and host links only. It does not install, log into, or
read private state from external tools. Use the reviewed install plan for one
named compatible tool at a time; tools with release-only or manual Windows
installs remain a human checkpoint.

Preview installation of a pinned, supported tool source:

```sh
./bin/agent-os install --tools yt-dlp
```

Only after independently reviewing the source, license, and command may a user invoke the separately gated mode:

```sh
./bin/agent-os install --tools yt-dlp --apply --reviewed-install
```

This never logs in, grants access, installs browser extensions, or mutates remote accounts. A `manual-unresolved` source remains a human checkpoint.

## Optional owner-machine command cutover

This workflow is macOS-only.

The separate Codex-only cutover is for an owner machine that already has the
three legacy command links. It is not part of `setup`, does not adopt tool
links, and always previews first:

```sh
./bin/live-cutover --legacy-root <legacy-root>
./bin/live-cutover --legacy-root <legacy-root> --apply
./bin/live-rollback
./bin/live-rollback --apply
```

The first apply requires the declared legacy root. It accepts only the exact
legacy `add`, `commands`, and `trunk-finish` symlinks, creates `teach` only when
absent, and changes one recognized sentence in Codex `AGENTS.md`. It records
local rollback metadata and refuses unknown or drifted state.

See the [fresh-Mac walkthrough](fresh-mac-walkthrough.md) for the friend-friendly sequence and [troubleshooting](troubleshooting.md) for next actions.
