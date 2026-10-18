# Peekaboo visible macOS inspection

Use Peekaboo for macOS screenshots, app/window inventory, accessibility inspection and authorized UI actions. Prefer it as the visual fallback when supported Browser Use/Computer Use screenshots are blank, stale, cropped, inaccessible or do not match the visible UI.

Check the installed version/help and `peekaboo permissions`. Begin with read-only apps/windows inventory and current image/see capabilities; reviewed examples include `list apps --json`, `list windows --json`, `image --help` and `see --help`.

Inspect current visible state immediately before a UI action. Clicks, typing, scrolling, menus, dialogs and clipboard operations require a clear target and task authority. Avoid destructive or broad UI actions unless specifically requested; verify resulting visible state when practical. Accessibility and Screen Recording access stay under the user's control; report the exact missing permission rather than silently broadening access. Screenshots and clipboard data may contain private material: disclose only what the task needs.
