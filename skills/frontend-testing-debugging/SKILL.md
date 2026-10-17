---
name: frontend-testing-debugging
description: Test and debug rendered frontend apps, UI interactions, console errors, responsive layouts and visual regressions using the available browser runtime or project Playwright workflow.
---

# Frontend Testing and Debugging

Infer the target flow from the request, repo scripts, current URL or local dev
server. Establish entry route, action and expected rendered result. For a UI fix,
reproduce the failure, make the focused change and rerun that interaction.
A passing build alone does not verify rendered behavior.

## Runtime and server lifecycle

Honor an explicitly selected browser/tool. Otherwise use the available supported
browser runtime and read its current skill/API instructions before actions;
do not assume a particular Browser plugin, API or language exists. Existing
project e2e scripts are preferred for repeatable assertions. Playwright,
browser-act and registered site adapters remain separate transports.

If a runtime is absent or fails, record the actual failure and use an available
supported alternative for authorized local validation. Local fallback needs no
new approval. Do not bypass an access denial or broaden external-action authority.
Try computer/UI inspection when browser access cannot expose the needed state.

Keep the requested host exact and reuse an already-running server. For owned
servers, invoke `<SKILL_ROOT>/scripts/with_server.py --help` first. The helper
starts one or more commands, waits for their ports, runs a test command, propagates
its exit status, and cleans up its owned process groups. Do not stop unrelated
servers. Example:

```sh
python3 <SKILL_ROOT>/scripts/with_server.py \
  --server "npm run dev" --port 5173 -- python3 interaction_check.py
```

Use project-supported tooling; the helper does not require Python Playwright.
The retained [examples](examples/) illustrate optional Python Playwright DOM
discovery, console logging and static HTML checks. Inspect rendered state before
choosing locators. Wait for the meaningful ready state or control rather than
unconditionally using networkidle on polling/WebSocket apps.

## Evidence and checks

Verify the page identity, meaningful nonblank content, absent framework error
overlay, relevant console errors/warnings, and the target interaction followed by
an observable state assertion. Capture/inspect a screenshot for visual claims.
After edits reload and repeat the failing path. For layout work, check desktop
and a mobile viewport where practical: clipping, overlap, text, assets, stacking,
scrolling and loading/error/empty states. Compare reference-driven work against
its reference and explain material remaining differences.

Keep artifacts in task-local work/evidence directories, outside committed product
source unless requested. Close owned browser resources and servers. Report the
changed behavior, actual interaction/result, runtime and meaningful limitations;
include useful screenshot evidence. Scale the report to the task instead of
forcing a fixed QA template or installation pitch. Use frontend-design for design
creation and the canonical React guidance when React correctness is relevant.
