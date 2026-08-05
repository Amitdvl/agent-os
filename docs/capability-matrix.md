# Capability Matrix

| Capability | Portable deployment | User checkpoint | Doctor distinction |
|---|---|---|---|
| Core policy and commands | Safe core setup | Host app sign-in | not installed / managed drift |
| Tool registry and templates | Selected non-safe pack | Review selected tools | registry absent / present |
| Local CLI | Reviewed install plan | Install from verified source | CLI absent / available |
| SOPS + age vault | Vault plan and encrypted placeholders | New key and user-entered values | missing vault requirement / present |
| Service login | Tool contract only | OAuth, account consent, browser session | human checkpoint |
| macOS privacy | Tool contract only | Accessibility, Screen Recording, Reminders | permission checkpoint |
| Archive integrations | Freshness rules and templates | User-owned archive and sync | CLI state only; never archive inspection |
| External writes | Exact-intent policy | Exact target/content/action | never inferred from binary presence |

All 19 audited tool identities are rendered from `manifest/tools.json`; the full per-tool contracts live in the managed local-tools folders.
