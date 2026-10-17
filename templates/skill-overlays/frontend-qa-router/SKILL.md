---
name: frontend-testing-debugging
description: Route rendered frontend QA through the installed canonical frontend-testing-debugging workflow, preserving browser transport choice and project test conventions.
---

# Frontend QA routing

Load the canonical local `frontend-testing-debugging` skill from the current
skill catalogue for rendered interaction, console, screenshot and responsive QA.
It includes the retained multi-server helper and examples. Do not load a second
parallel QA policy. Preserve an explicitly selected browser and use its installed
instructions; otherwise use an available supported runtime or project e2e suite.
Authorized local fallback needs no new phase approval and must not bypass access
denials. Verify the actual interaction and rendered state after edits; a passing
build alone is insufficient. If the canonical package is unavailable, report that
missing package and perform independently supported checks without claiming the
helper or full QA workflow ran.
