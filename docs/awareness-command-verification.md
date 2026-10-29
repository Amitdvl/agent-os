# Awareness command verification

Use the native verifier when an installed skill or command must be refreshed and
visibly verified in Awareness. It uses macOS accessibility through System Events
and an exact-window Peekaboo capture; it does not use CUA.

From the Agent OS source checkout:

```sh
node scripts/verify-awareness-command.mjs --id open-brief --output work/awareness-verification
```

The command requires an already running Awareness installation, the existing
`~/.local/bin/agent-os` launcher, Peekaboo, and the owner's existing accessibility
and screen-recording permissions. Its default app path is
`~/Applications/Awareness.app`; use `--app APP_PATH` for another installation.
It neither installs software nor changes permissions.

The verifier checks one installed catalog entry and reads its installed skill,
binds to the running process for the exact app bundle path, opens the named
**Codex Commands** window if needed, clicks **Refresh**, and finds the command's
actual table row. It scrolls that row into view and checks its full label,
description and bounds against the window and viewport. It then saves a PNG of
the exact Commands window. The legacy HUD displays `/name`; the catalog receipt
also preserves the supported invocation, such as `$open-brief`.

`COMMAND-verification.json` records the installed source hash, current native
evidence and screenshot hash. Success exits zero with `status: verified`.
Missing, mismatched, inaccessible or offscreen evidence exits nonzero and records
`status: incomplete`; a new attempt first invalidates an old success receipt.
Read the receipt and inspect the saved screenshot before reporting visible HUD
verification. These checks establish this installed catalog/UI state, not the
behavioral quality of the skill or its availability on another machine.

The adapter does not select the floating timer, use screen coordinates, copy a
command to the clipboard, or change monitoring settings. Keep receipts and
screenshots in private task outputs. Do not commit evidence containing local
paths, process identities or unrelated visible content.
