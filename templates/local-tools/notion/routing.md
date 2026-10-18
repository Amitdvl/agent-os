# Notion API reads and explicit creates/appends

Use the registered `notion` CLI for API auth checks, search, page/block reads and explicit page creation/text or Markdown append. Use Notcrawl for local archive work. Verify current version/help before relying on these reviewed examples.

- Preflight `command -v notion`, `notion version`, `notion auth status`, preferably JSON where supported. Check the existing vault record before asking for setup or creating replacement credentials. The local adapter may auto-load `NOTION_API_TOKEN`, `NOTION_API_VERSION` and `NOTION_WORKSPACE_ID`; configure its vault binding on the owner machine rather than copying another owner's workspace/account values.
- Examples: bounded `notion search QUERY --page-size N --json`, `notion page get ID --json`, `notion blocks children ID --json`; use current help for supported pagination and flags.
- Creates/appends require requested page/database target and content/action. Reviewed examples are `page create --parent ID --title TITLE --content-file FILE` and `page append-text ID --file FILE`. Verify the result through supported reads. Do not delete/archive/move unless installed command support and the user's exact action are both established.
- `404 object_not_found` commonly means the page/database was not shared with the configured integration. Report the specific sharing requirement without inventing another integration identity. If the requested workflow uses logged-in UI, use supported Browser Use/Computer Use; switch access paths when unreliable and record the path that succeeded or failed.
- Never print injected environment values, decrypted vault files, API tokens or secret-bearing configuration. Missing access is a sharing/auth checkpoint, not permission to recover credentials from stores.
