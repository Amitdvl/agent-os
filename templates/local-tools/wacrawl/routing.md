# WhatsApp Desktop archive workflows

Use Wacrawl for read-only Desktop history, chats/unread triage, message slices, media metadata and explicitly requested backup inspection. Wacli owns linked-device/live state, messages, reactions/presence, mark-read/archive/pin/mute and group/channel/account writes. Verify installed version/help before relying on reviewed command examples.

- Before any answer from archive messages, automatically `wacrawl sync` unless the user requests no sync or asks only installation/configuration/status. Then query the local archive using bounded JSON status/chats/unread/messages/search. Sync mutates its own archive, never WhatsApp's app container. Distinguish stale readable data from unavailable fresh state if sync fails.
- Prefer stable chat IDs, exact date bounds and narrow media filters. Report freshness, relevant date ranges/counts and known archive gaps. Disclose only private message text needed for the requested answer.
- Wacrawl never sends or mutates WhatsApp state and must never write into the app container. Do not print, commit, upload or share raw archive databases, backup identities or container files.
- Media copying/import, backup push and restore require the user's requested scope/destination/action. A backup push is a remote archive action requiring clear remote authority, not an implicit message send. After a requested backup operation, verify through supported status, using no-sync mode when necessary to inspect without another refresh.
- Health checks use supported doctor/status. The user's own Desktop archive and access must exist; do not recover it by inspecting sessions or copying another owner's state.
