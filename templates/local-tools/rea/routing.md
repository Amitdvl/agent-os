# REA investigation routing

## Automatic selection

Use automatically, without an explicit REA request, when the current task needs
reverse engineering of an identified app, native binary, JavaScript/Electron
bundle, package, or recorded artifact. Good triggers include explaining a feature
without source, tracing IPC or module relationships, comparing packaged versions,
and recovering implementation behavior with evidence. Stay within the user's
selected target and objective. Do not run REA for ordinary source edits or sweep
installed apps in the background. Explicit invocation: `$rea`.

## Preflight and installation

The official package is `rea-agents`, binary `rea`; reviewed version 6.7.0.
Install deliberately with `npm install --global rea-agents@6.7.0`, then verify
`command -v rea`, `rea --version`, command help and `rea capabilities --json`.
Node ^22.19.0, ^24.11.0 or >=26 is required. No account or API key is needed for
local static inspection. There is no integration-owned configuration or archive;
input artifacts and output Evidence stay in the selected task's workspace.
The binary lives under the configured npm global prefix's bin directory.

CLI-first use is sufficient. Do not run `rea setup` automatically: it changes
client MCP registrations and can install a bundled skill; provider installation
is separate. Upstream setup, update, uninstall and optional provider installation
require a concrete maintenance request. Do not enable global npm lifecycle
scripts to resolve an optional Frida dependency. Keep provider limitations clear.

## Static investigation

1. Resolve the exact target and question from the current task. Start static.
2. Inspect `rea inspect-artifact /absolute/path/to/artifact --json` for inventory
   and available probes. Inspect only the selected artifact; avoid broad roots.
3. For JS/Electron, use `rea analyze-javascript-application /absolute/path/to/app
   --source-path relative/file.js --json` for exact inventoried sources; check
   help for semantic, memory and timeout bounds. Omit the source filter only
   when an application overview is needed. This reads without running the app.
4. On macOS, `rea inspect-macho /absolute/path/to/binary --json` inspects native
   metadata without launching Hopper. Deep decompilation needs an existing,
   configured Hopper/Ghidra/IDA or another supported provider.
5. Use installed help for managed, Go/Rust, WASM, SQLite or recorded-capture
   commands and their platform/provider prerequisites. Use `--json` and
   `--filter-output` to bound structured results. Do not combine `--token-limit`
   or `--token-offset` with structured JSON; use filters or pagination instead.
6. Retain full Evidence privately in task-local `work/` when useful. Report
   digests, locations, confidence and limitations that support the answer.
   Pseudocode and inferred relationships are not original source or proof that
   reconstructed behavior matches. Verify any reconstruction in its own project.

## Effects and authority

Automatic selection authorizes relevant inspection within the current task; it
is not standing permission for every REA command. Consult `rea capabilities
--json` and exact command help before non-static probes. Executing a target,
attaching debuggers, Frida scripts, process capture, browser/native UI scenarios,
adb/device changes, network activity and patch/annotation operations require
clear task authority for their exact target and effects. Prefer bounded,
read-only probes; do not execute unknown targets merely to identify them.

Local exports or extraction use an exact task-owned destination and preserve
existing files. Remote writes, uploads, installs, purchases and account changes
need the same explicit targets and intent as other local tools. REA is not an
alternative route around Focus Protection, authentication, licenses, app privacy
permissions or another tool's boundaries. Never inspect browser sessions,
cookies, keychains, credential stores or unrelated private app data. Secret
material encountered in a legitimate artifact must not be printed or copied;
use Agent Vault for any authorized credential integration.

## Diagnostics and maintenance

Audit-wide `rea doctor --json` also checks optional engines, all supported client
registrations and the upstream skill. Its aggregate failure does not establish
that static CLI analysis is broken. Prefer task-specific capabilities and a
small static probe; use scoped `rea doctor --target /absolute/path` when relevant.
No upstream skill/MCP registration is required by this integration. Missing
provider, Frida, JDK/JADX or browser support remains a capability limitation;
report it accurately. Review official release notes, repin Agent OS and repeat
smoke checks before updating; do not auto-update during unrelated tasks.
