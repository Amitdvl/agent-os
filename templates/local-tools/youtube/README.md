# YouTube Watch Later Wrapper

This portable contract defines a small local `youtube` CLI that keeps two jobs separate:

- `youtube inspect <url>` delegates public metadata inspection to `yt-dlp`.
- `youtube save <url> --yes` uses the user's existing authenticated OpenCLI Browser Bridge session to open YouTube's visible **Save to playlist** control and verify that **Watch later** is selected.

The wrapper must be implemented in Go, provide `--help`, `--dry-run`, and non-interactive `--yes` support, accept only a single HTTPS `youtube.com` or `youtu.be` URL, and be idempotent. It must never read, export, or accept browser cookies, tokens, or session files.

Before a save, run `opencli doctor`; require exact user intent and URL. A consumer machine independently builds the wrapper, enables the Browser Bridge, and logs into its own YouTube account. No authentication material belongs in Agent OS.
