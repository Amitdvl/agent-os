---
name: react-best-practices
description: Write, review, or optimize React and Next.js components, hooks, data fetching, and rendering performance.
---

# React Best Practices

Use this as the canonical React guidance. Inspect the project's installed React,
framework versions and conventions first. Read only rules relevant to the observed
code or bottleneck; do not apply every optimization mechanically.

## Choose the relevant rules

The files in `rules/` provide examples and rationale. Use file discovery to select
the matching rule, then read it before proposing the change.

| Concern | Rule filename prefix | Priority |
| --- | --- | --- |
| Sequential independent work, slow data fetching | `async-`, `server-parallel-` | First |
| JavaScript payload and eager imports | `bundle-` | First |
| Server auth, caching, serialization | `server-` | High |
| Client fetches, listeners, persisted state | `client-` | High |
| Hooks, state and unnecessary renders | `rerender-` | As observed |
| Hydration, DOM rendering, visibility | `rendering-` | As observed |
| Hot loops and computation | `js-`, `advanced-` | After measurement |

Prefer eliminating network waterfalls and unnecessary payload before local micro
optimizations. Preserve authorization, cache isolation and observable semantics.
Check version-specific APIs against the installed version and current authoritative
documentation when needed; examples are guidance, not dependency upgrade authority.

## Review after edits

Read [review-checklist.md](review-checklist.md) for a short correctness, accessibility,
TypeScript and performance pass. Use it after changes to several components or when
reviewing React code. Use frontend-design separately for a requested visual/UX pass;
ordinary React work does not require loading the entire design workflow.

Verify affected behavior with the project's existing checks. Measure before claiming
a speedup; report review findings only for concrete code and plausible impact.
