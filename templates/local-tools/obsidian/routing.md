# Obsidian vault workflows

Use the registered `obsidian` CLI with the user's configured vault for searches, note reads, aliases, backlinks, bases/bookmarks, daily notes and graph/link inspection. Vault paths and contents are user-owned and are never migrated by Agent OS.

Check `command -v obsidian`, version and installed help before relying on examples. Reviewed named-argument forms include `obsidian search query="..."`, `backlinks file="..."`, `daily:read`, `create name="..." content="..."` and `append file="..." content="..."`; current installed help determines actual support.

Treat the vault as read-only by default. Search/list/read/summarize/link inspection can proceed in scope. Create, edit, append, delete, rename or move only when the user requests the specific target/action and intended content. Preserve unrelated notes and verify supported writes with a narrow read. Configure a non-secret vault binding after the user chooses it; never inherit another owner's private vault directory.
