# Spotify CLI workflows within focus policy

Use Spogo for supported Spotify search/status, devices, queue, library/playlists, listening data and explicitly requested player actions. The standing focus policy still blocks Spotify website/service unblocking: never enable blocked sites/endpoints or suggest a bypass to make this tool work. A working existing CLI session does not authorize changing that block.

- Check installed version/help and `spogo auth status`; keep search/history limits bounded and prefer JSON. Reviewed examples include `status`, `device list`, `queue show`, search by media type and user history/top-track reads; verify current help rather than assuming an alias exists.
- Playback/pause/next/previous, queue, volume, shuffle/repeat, device transfer, library and playlist changes mutate player/account state. Execute only with clear requested intent and media/device target; library/playlist writes require exact target/content/action. Verify with the narrowest relevant supported read.
- Never inspect cookies, browser stores or secret-bearing Spogo configuration. Avoid debug diagnostics that could expose request/auth details. If authentication is unavailable, report the supported human-owned requirement and focus-policy constraint; do not direct the user to unblock a website or copy browser secrets.
- Playback/Connect transfers can require Premium and an active device. Query devices before selecting one; report genuine device/auth/subscription limitations. Do not silently switch accounts or retry player changes blindly.
