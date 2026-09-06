# YouTube routing requirements

- YouTube: use `youtube` for `inspect`, read-only Watch Later listing, and an explicit `youtube save <url> --yes` request. It delegates metadata to `yt-dlp` and saves through the already logged-in OpenCLI browser session without reading cookies or session files. Run `opencli doctor` first for saves, require the exact YouTube URL and save intent, use `--dry-run` when requested, and report success only when it confirms `watch_later: selected`. Its Agent Vault record is `<agent-vault>/tools/youtube.sops.yaml`; it is inventory-only and stores no credential values.
