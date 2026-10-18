# Discord archive and supported writes

Use Discrawl for bounded Discord message/channel/DM/guild inspection, search and reports. Check the installed CLI's help before relying on a command.

Before answering from Discord message data, automatically run `discrawl sync --full`. Skip only when the user requests no sync or asks solely about installation/configuration/status. Then query supported Discrawl commands or the configured archive through read-only SQL. Prefer counts, names, date ranges and concise summaries unless message text is requested; do not expose private content beyond task scope.

Never use a separate Discord send helper. Send, edit or broadcast only when the user's request includes that write, exact target channel and exact message, and the installed Discrawl CLI actually supports the action. Do not infer write support from examples or tool registration.

After a successful supported Discord write, automatically run `discrawl sync --full` again, then verify through the archive or supported CLI result before reporting success. If freshness fails, distinguish readable stale data from unavailable current state.

Never inspect or expose bot tokens, credential stores or secret-bearing configuration. Use the documented account setup and sanitized errors; no credential recovery through file inspection.
