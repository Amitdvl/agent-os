# Reddit CLI research and interactions

Use `rdt` for Reddit browsing, search, post/comment/user reads, feeds, saved/upvoted review, exports and explicit interactions. Check version/help and authenticated `rdt status --json` before relying on reviewed command examples.

- Keep requests bounded and **sequential**; do not bypass built-in account-protection delays or rate limiting. Prefer JSON/YAML and compact listings. Reviewed limits use `-n N`; confirm installed flags instead of assuming another tool's `--max` syntax.
- Short numeric indexes refer to a local listing cache. Use an index only after a fresh listing in the same task and verify the target; prefer stable IDs for writes. Reading a selected post can expand more comments when needed rather than fetching everything initially.
- Upvotes/downvotes/undo votes, saves/unsaves, subscribes/unsubscribes and comments are writes requiring exact target/action. Public comments additionally need exact text. Account-state/auth changes are not implied by a read. Verify successful interactions through narrow supported reads.
- Exports require bounded source/scope and task-local output unless a destination is specified. Do not expose private account content unnecessarily.
- Never inspect browser cookies, credential caches or session stores, or request cookies in chat. Avoid verbose diagnostics. Missing auth requires the supported user-owned browser/login flow; do not silently log out or switch accounts to recover a session. A locked browser database is an access failure, not permission to inspect it.
- Back off for rate limits and report auth/network errors. Reviewed limitations include no Reddit DMs, live streaming or media download and a single-account cache; verify current installed support before making new capability claims.
