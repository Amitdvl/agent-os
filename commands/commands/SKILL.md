---
name: commands
description: Use when the user invokes /commands or asks what slash commands, skills, local tools, automations, or reusable workflows are available, or explicitly asks to find an additional skill.
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
4. For `/commands`, return the generated output without supplementing it from memory. For a capability question, select relevant installed entries and explain their current status.
5. For explicit external skill discovery, follow the discovery workflow below. Ordinary requests for help are instructions to perform the task, not to install a skill.

## Rules

- The catalogue is read-only.
- Keep the output in this order: personal slash commands, workflows, active automations, local tools, plugins, then standalone skills. Alphabetize entries within each group.
- Treat slash commands as user-added personal commands: command packages in `commands/`, locally cached personal plugin commands, and explicitly personal machine-global workflows. Do not list vendor/plugin commands such as Figma, Cloudflare, Vercel, Expo, or build-platform plugin commands in the slash-command group; summarize those under plugins instead.
- Derive entries from current command packages, installed and cached plugin commands and plugin summaries, workflow packages, the Codex local-tool registry, installed skills, and automation definitions.
- Do not inspect or expose environment values, credential files, secret paths, private message bodies, or automation prompt bodies.
- If a source is unavailable, show the remaining sources rather than failing the command.

## Discover additional skills

Check the current installed capability catalogue first; reuse a matching skill,
plugin or registered tool before proposing a duplicate. Distinguish installed,
disabled, available-to-install and unavailable states. Do not infer disuse from
missing telemetry. A generic "help me with React" request is not an installation
request.

For explicit requests to extend capabilities, inspect the host skill-installer's
current instructions and use its curated listing or an identified repository/path.
For wider ecosystem discovery, search current source repositories/skills.sh with
specific task terms, inspect candidates' SKILL.md, licenses, helpers and invocation
metadata, and compare their incremental benefit with existing capabilities.
Do not run an unreviewed package's setup/update command merely to search.

If a search CLI is already installed, verify its interface before using its
read-only search. An installation request must identify the chosen source/scope;
then use the existing skill-installer rather than a parallel global `npx skills
add -g -y` route. Keep repo skills in `.agents/skills` and reusable global assets
in Agent OS. Preserve source/pin/license metadata, register Commands/HUD, sync the
portable twin, and verify discovery. Respect supervisor authority for shared
installs. No useful candidate is not a blocker to performing an ordinary task.
