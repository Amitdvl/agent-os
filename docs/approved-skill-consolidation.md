# Approved workflow consolidation

## Canonical packages and discovery

| Previous entry | Maintained owner | Preserved behavior |
| --- | --- | --- |
| Cloudflare + Cloudflare Deploy | `skills/cloudflare`, web-development pack | Platform reference tree, 43 reconciled references, auth guide and focused deployment/account/verification checks |
| webapp-testing + frontend QA | `skills/frontend-testing-debugging`, creator pack | Rendered interaction/console/visual checks, multi-server helper/examples/license, current-runtime routing |
| find-skills | `commands/commands` + host skill-installer | Installed-first capability lookup, explicit external discovery, reviewed installation and registration |
| Broad agent-stack triggers | `skills/agents-sdk` and reviewed plugin overlays | Cloudflare/OpenAI/eve references within requested or established stacks |
| Outcome/bottleneck formatting | `skills/outcome-loop` and `skills/current-limiting-factor` | Objective/evidence/intervention/feedback, bounded retries, result reconciliation, requested scheduling and reporting |

Apple Suite and Windows Suite include the portable web-development pack; the
Strict Portable default remains unchanged.

A generic agent request does not select a provider. A one-shot local task does
not start an ongoing loop or require a Notion report. Matching explicitly
established Notion destinations remain usable; current request overrides them.
Supervisors and recurring execution still require their existing authorization.

Cloudflare platform references supersede older deployment variants; reviewed
hashes and choices are in `skills/cloudflare/reconciliation.json`. Restored
Wrangler auth routing and the deployment contract preserve useful unique behavior.
Snapshot references are retrieval starting points, never current API/limit proof.
Decorative vendor icons are not distributed. No credentials or project state travels.
Imported reference bytes retain upstream Markdown hard breaks and EOF spacing;
scoped Git attributes exempt only those trees from those whitespace checks.

The retained helper now terminates owned process groups (including background
children), rejects already occupied or duplicate ports before startup, preserves
test exit status and cleans up after startup failure, interrupts or completion.
Real loopback tests exercise these behaviors; no cloud deployment is needed.
Browser adapters, UI inspection/recording, Wrangler, Durable Objects and Workers
review skills remain distinct. The existing skill-installer is unchanged. The Commands catalogue now recognizes
physically installed portable skills even when their pack is not selected in the
installation ledger; missing skills still do not appear installed.

## Reviewed vendor overlays

Vendor reference trees remain vendor-owned. Three narrowly scoped entrypoint
replacements live in `templates/skill-overlays`, with exact version-relative paths
and before/after SHA-256 in `manifest/skill-overlays.json`. Provider overlays keep
the vendor's reference links and API instructions, but remove generic selection
signals/default architecture mandates. The frontend plugin entry routes to the
canonical local QA package, avoiding a second full policy.

```sh
node scripts/skill-overlays.mjs --plugin-root <installed-plugin-cache-root>
node scripts/skill-overlays.mjs --plugin-root <installed-plugin-cache-root> --check
node scripts/skill-overlays.mjs --plugin-root <installed-plugin-cache-root> --apply
```

Preview is read-only. Check fails until every overlay matches. Apply only follows
explicit authority for the reviewed targets. Every source and target is validated
before any write; unknown/missing versions or content refuse the batch. On plugin
updates, re-review and update source hashes rather than overwriting unknown code.
Run the check alongside the owner machine's full twin audit before completion.
These optional plugin overlays do not install plugins or authenticate accounts.
An interrupted apply is recoverable by checking and replaying only reviewed
original/matching files; no blanket plugin-cache deployment is implied.

Owner-specific enablement paths, backups and HUD/UI evidence stay local. Inspect
actual desktop discovery separately from standalone CLI discovery; a setting's
persistence does not prove desktop catalog behavior. The current session's injected
catalog is a snapshot, not proof of a subsequent reload. Retired local entries
stay recoverable outside discovery roots. OpenAI Aesthetic Images and standing
instructions are outside this approved change.
