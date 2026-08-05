# Fresh-Mac Walkthrough

This is the recommended first-day setup for a nontechnical friend. Each command is local and reviewable; no command in this guide copies data from another Mac.

1. Install Git, Node.js 20+, and the desired host app(s) from their official sources. Sign in to Codex/Claude Code yourself.
2. Clone this repository, open Terminal in it, and run `./bin/agent-os validate`.
3. Run `./bin/setup --safe`. Read the destination list. It makes no changes.
4. If the list is correct, run `./bin/setup --safe --apply`. This installs only the core workflow into both hosts, preserving text outside Agent OS instruction blocks.
5. Run `./bin/doctor --json`. “Absent CLI” means no program is installed; it does not mean setup failed.
6. Pick one optional tool at a time. Run `./bin/agent-os install --tools <tool-id>` to review its pinned/source plan. Run the reviewed apply command only if you understand and want that tool.
7. Deploy matching optional tool templates with `./bin/setup --packs core,<chosen-pack> --apply`. This creates one managed local-tools registry under `~/.agent-os`, host skill symlinks, and Codex’s generated binary-prefix rules.
8. For a service that needs API values, run `./bin/agent-os vault init --tools <tool-id>` first. It is a plan. Create a new age identity or provide the new user’s public recipient only after review; never copy an old vault.
9. Complete each service login, browser extension, account consent, and macOS permission manually. Run `status` again to see the next human step.

| Agent OS copies | Each user configures personally |
|---|---|
| Policy, commands, first-party skills, tool templates | Host account login and host settings |
| Registry structure, managed symlinks, generated allow-prefix rules | Optional CLI binaries and source trust decision |
| Encrypted-vault file layout and requirement names | New age identity, encrypted values, service/API authority |
| Freshness, exact-intent, focus, and secret-safety rules | Browser sessions, account consent, archives, and macOS privacy permissions |

Do not copy host directories, browser profiles, keychain data, sessions, archives, recordings, vault files, or application-support folders.
