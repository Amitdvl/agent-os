# Capability Matrix

This matrix is the human-readable view of `manifest/tools.json` and `manifest/packs.json`. “Test” means a future deployed-machine check; repository verification uses manifest/schema tests only.

| Capability | Pack | Dependency | Authentication | OS limit | Future test |
|---|---|---|---|---|---|
| Agent policy and profile | core | Codex or Claude Code | none | Host support | Rendered block and hash check |
| Capability catalogue | core | Agent OS CLI | none | Node 20+ | `status --json` |
| Safe finishing | core | Git | optional remote auth for push | none | Sandbox repository workflow |
| Secret-provider contract | core | optional Agent Vault adapter | agent-vault | local provider | Requirement names only; no value reads |
| Commit/push popup | core | optional LaunchAgent template | macos-permission | macOS | Disabled-by-default template validation |
| Dependency-doc guard | core | optional host hook support | none | Host-specific | Fixture tests |
| Agent Inbox | local-productivity | `agent-inbox` | local app | macOS app | `command -v`; app status manually |
| Notion API | local-productivity | `notion` | agent-vault | none | Binary plus named env requirements |
| Notion archive | local-productivity | `notcrawl` | human-login/agent-vault | desktop cache path on macOS | `notcrawl status --json` manually |
| Obsidian vault | local-productivity | `obsidian` | none | configured vault | Binary plus configured path existence |
| Apple Reminders | local-productivity | `remindctl` | macos-permission | macOS | `remindctl status` manually |
| UI inspection | local-productivity | `peekaboo` | macos-permission | macOS | `peekaboo permissions` manually |
| X archive | research | `birdclaw` | local archive; optional OAuth | archive-dependent | Binary and configured data root |
| Live X API | research, communication | `xurl`/`twitter` | OAuth/browser-session | provider-dependent | Manual auth status |
| Reddit | research, communication | `rdt` | browser-session | none | Manual account status |
| Browser-backed sites | research | `opencli` | browser-session | desktop Chrome/Chromium | `opencli doctor` manually |
| Public media | research, creator | `yt-dlp`, optional `ffmpeg` | none | none | Version checks; no download in doctor |
| Agent Reach alternative | research | `agent-reach` | channel-specific | upstream-dependent | Optional; unselected; manual install |
| WhatsApp archive | communication | `wacrawl` | local archive | macOS WhatsApp Desktop | Manual status/sync |
| WhatsApp live | communication | `wacli` | human-login | linked-device support | Manual doctor |
| Discord archive/live | communication | `discrawl` | human-login/token provider | none | Manual full sync/status |
| Instagram Direct | communication | `instagram-cli` | human-login | none | `auth whoami` manually; no website fallback |
| Phone bridge | communication, creator | `vox` | agent-vault/telecom-consent | local tunnel/provider | Help check only until explicit call setup |
| Screen video | creator | `opencap` | macos-permission/tool account | macOS | Manual record status; no recording in doctor |
| Spotify | creator | `spogo` | browser-session | desktop browser | Manual auth status; no playback in doctor |

