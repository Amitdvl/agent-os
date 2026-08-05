# Commit/Push Watcher Template

This template demonstrates an optional macOS LaunchAgent flow for prompting before commit/push actions inferred from Codex session output.

Use environment variables rather than editing user-specific paths into the script:

- `CODEX_HOME`
- `CODEX_COMMIT_PUSH_WATCHER_LABEL`
- `CODEX_COMMIT_PUSH_WATCHER_PLIST`
- `CODEX_COMMIT_PUSH_WATCHER_SCRIPT`
- `CODEX_COMMIT_PUSH_WATCHER_STATE`
- `CODEX_COMMIT_PUSH_WATCHER_STDOUT`
- `CODEX_COMMIT_PUSH_WATCHER_STDERR`
- `CODEX_COMMIT_PUSH_WATCHER_LOG`

Install only after the user explicitly approves host-level automation.
