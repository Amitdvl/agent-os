# Spotify routing requirements

- Spotify: use `spogo` for Spotify search, playback control, currently-playing status, queue, devices, library/playlists, and listening data. Run `spogo auth status` before authenticated work and import from the user's logged-in browser only when needed. Treat playback, queue, volume, shuffle, repeat, device transfer, library changes, and playlist changes as Spotify state changes; write only when the user's intent and target are clear. Do not expose Spotify cookies, browser cookie stores, or Spogo credential files.
