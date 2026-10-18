# Instagram CLI workflows

Use only `instagram-cli` for Instagram Direct inbox/search/read, profile lookup and explicitly requested messaging actions. There is no Instagram website or browser-automation fallback. Verify installed help before relying on these command examples.

- Preflight `command -v instagram-cli`, `instagram-cli --version`, `instagram-cli auth whoami`. Sessions/configuration are credential-bearing and opaque. Missing/expired auth requires the user's own interactive `instagram-cli auth login`; do not log in on their behalf or inspect session files.
- Prefer bounded `inbox --limit N --output json`, optionally with `--search`, then use the stable thread ID returned by that fresh response for `read`, send/reply or unsend. Avoid fuzzy-title targets.
- `send`, `reply`, `unsend`, `auth logout`, `auth switch`, configuration and cleanup mutate state; require exact target/action. Message/reply content must be the exact text or file path requested. Do not switch accounts silently.
- `read --mark-seen` is a remote-state change and requires an explicit mark-read request. `read --download` writes media and requires a specific destination. Ordinary verification reads must omit mark-seen unless requested.
- After a successful send/reply, verify with the narrowest relevant read. JSON `ok: false` is a failure even when transport succeeded. Do not blindly retry writes.
- Refresh inbox IDs after no-match errors. Back off narrowly for rate/network errors; do not bypass account protections. The unofficial client's service restrictions still apply.
