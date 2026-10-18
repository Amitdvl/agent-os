# WhatsApp live state and actions

Use Wacrawl for read-only WhatsApp Desktop history/search/unread/media metadata and local archive/backup checks. Use Wacli for linked-device/current protocol state, contacts/chats/groups/channels, automation, sending/reactions/presence, archive/pin/mute/mark-read and account/device actions.

Check installed `wacli version` and help before relying on reviewed commands; prefer JSON for sync/chats/messages/doctor. Use supported `--read-only` exploration when not writing. Linked-device login remains user-owned; never read session files from disk or inspect credentials.

Sends require exact chat/contact/group and exact message or media/content. Reactions, polls, presence, archive/pin/mute/mark-read, group/channel changes and account/device mutations need the requested target/action; a read request does not authorize these changes. Resolve ambiguous targets with fresh bounded reads and verify supported writes through the same system before reporting success.

For Desktop archive answers, Wacrawl must sync unless the user opts out or asks only setup/status. Keep live state distinct from archived history and report the actual freshness/source. Do not substitute a live account mutation for an archive refresh.
