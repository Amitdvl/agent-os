---
name: commands
description: Use when /commands should show the current portable and installed capability catalogue.
---

# Commands

Run `agent-os status --catalog --json` and return that generated read-only catalogue without supplementing it from memory. It discovers from manifest records and safe directory names only; it never reads environment values, credential files, secret paths, private content, or automation prompt bodies.

Present entries in this deterministic order, alphabetized within each group: personal slash commands, workflows, active automations, local tools, plugins, then standalone skills. Attribute every item to its manifest, host directory, or generated local-tools registry. If a source is absent, show the remaining sources rather than failing.
