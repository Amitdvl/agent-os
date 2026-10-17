---
name: frontend-design
description: Create, review, or polish frontend interfaces, including layout, typography, accessibility, interaction states, and motion.
---

# Frontend Design

One entry point for interface creation, UX/visual review, and detailed polish. The
references combine frontend-design, Impeccable and make-interfaces-feel-better.
Use the user's target and requested depth to select a mode; do not load every mode.

## Context and shared guidance

Read project instructions, available PRODUCT.md/DESIGN.md and representative UI code
or tokens. Existing identity and explicit user direction take precedence over generic
aesthetic preferences in references. Missing context files alone do not block a
clear local change or require an onboarding interview.

`<SKILL_ROOT>` in references means the absolute directory containing this SKILL.md,
not a project-relative installation. Substitute that directory before running a command.
Bundled helpers run from the target project's working directory. The optional
`scripts/context.mjs` reads existing project context; missing docs are a signal to
infer from the brief/code or ask only for genuinely missing product decisions.
Before using detectors or live helpers, read [helper capabilities](reference/helpers.md).
Their optional parser/browser dependencies are not bundled; limited scans are not
full DOM/CSS analysis. Use the existing browser tools when those dependencies are absent.

Read [design-principles](reference/design-principles.md), then the matching register:
[brand](reference/brand.md) for marketing, campaigns and portfolios; [product](reference/product.md)
for app UI, tools and dashboards. Use only the register relevant to the target.

## Modes

| User intent | Read |
| --- | --- |
| Create or redesign a page/component | [creation](reference/creation.md), then [craft](reference/craft.md) when building a whole feature |
| Shape the flow before implementation | [shape](reference/shape.md) |
| Review UX, hierarchy or visual quality | [critique](reference/critique.md) |
| Check accessibility/responsiveness/performance | [audit](reference/audit.md) |
| Refine a working interface | [polish](reference/polish.md) and selected [detail references](reference/polish-details/index.md) |
| Capture tokens or existing conventions | [document](reference/document.md) or [extract](reference/extract.md) |
| Explicit live browser variants | [live](reference/live.md); inspect supported browser capabilities first |

For targeted requests, read the matching file in `reference/`: `layout`, `typeset`,
`animate`, `colorize`, `clarify`, `adapt`, `harden`, `onboard`, `optimize`, `distill`,
`bolder`, `quieter`, `delight` or `overdrive`. Explicit context setup uses
[init](reference/init.md). These are modes of `$frontend-design`, not extra global skills.

Clear implementation requests authorize routine local design decisions and edits.
Proceed with a reasonable direction from the existing brief; optional interviews,
menus and approval checkpoints in inherited references do not override that authority.
Honor plan-only, audit-only and report-only requests. Ask only when a missing decision
materially changes the outcome. Do not automatically install tools, expose a dev server,
change CSP/security settings or create shortcut skills as part of visual polish.

## Verify the result

Verify the actual target in a browser when available: responsive layout, long copy,
keyboard/focus behavior, interaction states and reduced motion. Detector output is
supporting evidence, not proof of good design. Report edits and actual verification;
identify inaccessible checks. Keep functional fixes ahead of cosmetic refinements.
