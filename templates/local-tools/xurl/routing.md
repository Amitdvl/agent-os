# Direct X API workflows

Use Xurl for authenticated X API transport, recent search, DMs/media and supported explicit account actions. Prefer Birdclaw for archive history and Twitter CLI for supported browser-backed live tasks. Verify installed help; check auth with bounded `xurl auth status` without verbose mode or inline secrets.

- Never inspect the tool's auth store, tokens, cookies or secret files, request secrets in chat, print auth headers, or pass secret values inline. Use the configured vault/human-owned auth workflow; keep app/account selection explicit and do not switch silently.
- Post/reply/quote/delete, like/unlike/repost/bookmark/follow/block/mute and their inverse actions, DMs, media uploads and app/auth/account mutations need exact target/content/action. Read back supported results narrowly before reporting success. A raw API method inherits the endpoint's mutation boundary; it is not automatically a read.
- Use shortcuts when supported, otherwise current v2 raw API interfaces. Keep complex JSON payloads in task-local files with no embedded secrets. Poll media-processing status before attaching a video when required by the current API.
- OAuth2 may request a fixed broad scope set, including email/DM scopes. Do not broaden app access unless required and explicitly authorized for live API work. Local Birdclaw analysis needs neither Xurl nor API credits. Diagnose consent failures through documented OAuth settings, never secret inspection.
- 401/403 can indicate auth/scope/app mismatch; use sanitized auth status. CreditsDepleted blocks that live API call while archive reads may remain available. Back off on 429/network failures; validate media type/size/processing on upload failures.
