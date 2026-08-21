# Capability Matrix

| Capability | Portable behavior | User-configured value | Human-only checkpoint |
|---|---|---|---|
| Core policy and commands | Safe core setup and recovery-first command contracts | Host app sign-in | Host setup and managed-drift review |
| Custom CLI design | Go-based, non-interactive CLI contracts with help, pipeline, retry, and safety conventions | Project-specific framework choice | Project implementation and release review |
| Production repo baseline | GitHub-default project founding from a short stack brief, then pinned package tooling, lockfile-aware CI, and Dependabot | Chosen project shape and existing verification scripts | Deployment, data, auth, observability, and merge-policy choices |
| Task orchestration | Lead-owned acceptance, bounded role assignments, independent verification | Available model/agent selection | Review of any destructive or external action |
| Tool registry and templates | One rendered contract per selected tool, shared by both host symlinks | Selected packs and non-secret data-root placeholders | Review selected sources |
| Local CLI | Reviewed install plan and broad binary allow rule | Verified upstream install | CLI install/version help check |
| SOPS + age vault | Encrypted requirement placeholders and no-output crypto validation | New key/recipient and user-entered values | Key generation and secret entry |
| Service login | Explicit auth boundary in every contract | OAuth/account consent/browser profile | Login/extension approval |
| macOS privacy | Permission diagnosis and read-first fallback | Accessibility, Screen Recording, Reminders | System Settings approval |
| Archive integrations | Tool-specific sync-before-answer rules | User-owned archive and explicit refresh | Archive/import availability |
| External writes | Exact-intent, target, content, and verify-after-write rules | Requested target/content/action | User authorization |

All 20 selected tool identities are rendered from `manifest/tools.json`; the full per-tool contracts live in the managed local-tools folders.
