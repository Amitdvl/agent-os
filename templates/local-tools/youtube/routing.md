# YouTube inspection and Watch Later

Use the local YouTube wrapper for URL inspection, bounded Watch Later listing and explicit saves. It delegates metadata to yt-dlp and saves through an already logged-in OpenCLI browser session. YouTube is allowed by the standing focus policy; no obsolete daily allowance is introduced here. Verify current wrapper help before relying on examples.

- `youtube inspect URL` uses read-only `yt-dlp --no-playlist --skip-download`. Listing `youtube watch-later --limit N` is a bounded account read. Neither requires copying browser state.
- Before browser-backed saves run `opencli doctor` and confirm the intended existing profile. `youtube save URL --yes` is an account write requiring the exact YouTube URL and explicit save intent. Use `--dry-run` when validation without mutation is requested; do not mistake its output for a saved item.
- Report a successful save only when the supported result verifies `watch_later: selected`. An already-selected item is a no-op. If the bridge is disconnected or profile unauthenticated, report the required supported session restoration; never inspect/manufacture cookies or session data.
- The vault record may be inventory-only: do not invent a requirement for new credentials when an existing browser session is the designed path. Keep wrapper source/tests and dependencies at their configured locations; do not move them while consolidating guidance.
