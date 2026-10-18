# Live X through Twitter CLI

Use `twitter` for current browser-session-backed X timelines, bookmarks, search, tweet/article/profile reads and supported explicit account actions. Prefer Birdclaw for historical archive analysis; named bookmark folders route through OpenCLI's folder workflow. Verify installed help and bounded `twitter status` before relying on examples.

- Prefer YAML for agent reads or JSON for parsing and use supported bounded `--max`. Use full-text output when truncation would hide material evidence; bounded task-local files can support larger analysis.
- Posts/replies/quotes/deletion, likes/unlikes, retweets/unretweets, bookmarks/unbookmarks and follows/unfollows are writes requiring exact target/content/action. After a write verify with a narrow relevant read before reporting success. Do not replay a potentially successful write just because transport failed.
- Never inspect cookies, browser keychain values, API/OAuth tokens, secret-bearing environment values or credential stores. Avoid verbose auth/browser diagnostics. Supported auth can use injected `TWITTER_AUTH_TOKEN`/`TWITTER_CT0` or a user-owned browser session; the agent does not obtain these by reading stores.
- Browser/profile preferences are configured privately; do not guess accounts or switch silently. Local keychain/login UI assistance must be authorized for that task. Proxy configuration never authorizes bypassing standing focus protections.
- Missing/expired auth requires supported human-owned login or vault setup; no secrets in chat. Back off on 429/network failures. For upstream GraphQL changes, retry a narrow read once, then report the failure and supported upgrade route rather than repeatedly hammering the account.
