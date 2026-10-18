# Public media inspection and bounded downloads

Use yt-dlp for public metadata/formats/subtitles and explicitly requested authorized downloads. Verify installed version/help and current source support before relying on examples. Respect applicable rights and service restrictions without inventing new account access.

- Default to one submitted URL, `--no-playlist` and a bounded format. Metadata examples include `--skip-download --print ...`, `-F` and `--list-subs`. Inspection without output-file flags is read-only.
- Media, subtitles, thumbnails, info-json, download archives and postprocessing all write local files, even with `--skip-download`. Require the requested source, bounded scope and destination; use a task-local output directory when the requested task permits that default. Do not start full playlist/channel scraping or background/bulk downloads implicitly.
- Never use cookies, cookies-from-browser, login options, password/netrc files, proxies, impersonation, geo-bypass or other access-control workarounds through this integration. Authentication/bot prompts are failures to report, not reasons to import browser credentials. Never expose private media URLs, account details or config secrets.
- Authorized examples use `--no-playlist -P DESTINATION` with a selected format, extraction/audio settings or explicit subtitle languages. Verify actual outputs and preserve unrelated destination files. Do not claim a metadata-only dry run downloaded media.
- Follow the configured package manager's update route; do not self-update a package-managed installation. Format merge/conversion failures may need supported ffmpeg inspection and compatible format selection. Unsupported/private URLs should be reported without bypassing access controls.
- YouTube is allowed by current standing policy; the old tool-local daily allowance is superseded. Existing blocks for other sites remain intact, and no automated download may be used to evade a standing focus protection.
