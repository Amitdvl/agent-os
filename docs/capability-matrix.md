# Capability Matrix

| Capability | Portable behavior | User-configured value | Human-only checkpoint |
|---|---|---|---|
| Core policy and commands | Safe core setup and recovery-first command contracts | Host app sign-in | Host setup and managed-drift review |
| Custom CLI design | Go-based, non-interactive CLI contracts with help, pipeline, retry, and safety conventions | Project-specific framework choice | Project implementation and release review |
| Production repo baseline | Git initialization, safe repository defaults, and Dependabot; later adds pinned package tooling and lockfile-aware CI when a stack exists | Chosen product stack and existing verification scripts | Product scaffolding, deployment, data, auth, observability, GitHub publishing, and merge-policy choices |
| Document and EPUB production | Exact-input, explicit-output Pandoc conversion followed by EPUBCheck conformance validation | User-selected source files, metadata, media, and output destination | Review of overwrite intent, custom filters/engines, and publication-specific quality checks |
| Code-image production | Local rendering of exact bounded snippets with isolated config/cache and verified PNG output | User-selected source range, neutral title, visual preset, and destination | Review suspected secrets, overwrite intent, clipboard use, custom assets, and any external send |
| Nonfiction book workflow | Explicit-only research, one editorial approval gate, centralized drafting/revision, collision-safe EPUB build, and installed-copy tests | Subject commission, approved conception, research evidence, and final destination | Editorial approval and any destination filesystem permission |
| Task orchestration | Lead-owned acceptance, bounded role assignments, independent verification | Available model/agent selection | Review of any destructive or external action |
| Tool registry and templates | One rendered contract per selected tool, shared by both host symlinks | Selected packs and non-secret data-root placeholders | Review selected sources |
| Local CLI | Reviewed install plan and broad binary allow rule | Verified upstream install | CLI install/version help check |
| SOPS + age vault | Encrypted requirement placeholders and no-output crypto validation | New key/recipient and user-entered values | Key generation and secret entry |
| Service login | Explicit auth boundary in every contract | OAuth/account consent/browser profile | Login/extension approval |
| macOS privacy | Permission diagnosis and read-first fallback | Accessibility, Screen Recording, Reminders | System Settings approval |
| Archive integrations | Tool-specific sync-before-answer rules | User-owned archive and explicit refresh | Archive/import availability |
| Telegram channel digests | Read-only bounded channel history through pinned Telgo; provider summaries require explicit disclosure authority | Telegram app credentials, local personal-account session, and optional Anthropic key | Interactive authentication and approval to send selected content to Anthropic |
| External writes | Exact-intent, target, content, and verify-after-write rules | Requested target/content/action | User authorization |

All 24 selected tool identities are rendered from `manifest/tools.json`; the full per-tool contracts live in the managed local-tools folders.
