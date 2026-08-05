---
name: commands
description: Use when the user invokes /commands or asks what slash commands, skills, local tools, automations, or reusable workflows are available.
---

# Commands

Use `/commands` to display the current locally available capability catalogue.

## Usage

```text
/commands
```

## Workflow

1. Resolve this command package's Agent OS root.
2. Run `agent-os status --catalog --json` from that root.
3. Run it without a query so the complete catalogue is shown.
4. Return the generated output without supplementing it from memory.

## Rules

- The catalogue is read-only.
- Keep the output in this order: personal slash commands, workflows, active automations, local tools, plugins, then standalone skills. Alphabetize entries within each group.
- Treat slash commands as user-added personal commands: command packages in `commands/`, locally cached personal plugin commands, and explicitly personal machine-global workflows. Do not list vendor/plugin commands such as Figma, Cloudflare, Vercel, Expo, or build-platform plugin commands in the slash-command group; summarize those under plugins instead.
- Derive entries from current command packages, installed and cached plugin commands and plugin summaries, workflow packages, the Codex local-tool registry, installed skills, and automation definitions.
- Do not inspect or expose environment values, credential files, secret paths, private message bodies, or automation prompt bodies.
- If a source is unavailable, show the remaining sources rather than failing the command.
