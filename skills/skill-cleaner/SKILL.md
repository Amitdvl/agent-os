---
name: skill-cleaner
description: Audit Agent OS and configured skill roots for prompt-budget pressure, duplicate contracts, and stale candidates without changing them.
---

# Skill Cleaner

Use this advisory workflow to inspect configured skill roots, compact long
descriptions, and identify duplicates or stale candidates. It is read-only:
never delete, disable, rewrite, commit, or move a skill unless the user later
requests a specific reviewed cleanup.

## Workflow

Run the full analyzer from the Agent OS checkout:

```sh
node --experimental-strip-types skills/skill-cleaner/scripts/skill-cleaner.ts --months 3
node --experimental-strip-types skills/skill-cleaner/scripts/skill-cleaner.ts --no-live --no-logs
node --experimental-strip-types skills/skill-cleaner/scripts/skill-cleaner.ts --months 6 --max-log-mb 800 --deep-logs
node --experimental-strip-types skills/skill-cleaner/scripts/skill-cleaner.ts --context-tokens 272000 --budget-percent 2 --no-logs
node --experimental-strip-types skills/skill-cleaner/scripts/skill-cleaner.ts --root <configured-skill-root> --json
```

The analyzer reads `codex debug prompt-input` when available, discovers plugin,
configured, Agent OS, and requested roots, calculates context/budget pressure,
compares duplicate bodies and descriptions, and uses recent logs only within
the selected age and byte budget. It emits text or JSON reports. Do not print
raw logs, private skill content, credentials, or session data.

## Decision rules

- Keep the loaded or policy-owning copy when duplicate names exist.
- Preserve trigger nouns and safety conditions when proposing a shorter
  description.
- Treat disabled roots, archives, plugins, and host-provided skills as separate
  ownership domains.
- Report recommendations only. A later cleanup must name exact files and retain
  its own verification and rollback plan.
