---
name: goal-prompt
description: Draft, critique, or refine compact Codex /goal prompts for long-running, measurable work.
---

# Goal Prompt

Use goal framing for multi-turn work, verification-heavy outcomes, meaningful tradeoffs, anti-gaming risk, iteration against tests/visuals/evals, or durable progress artifacts. For trivial work, say goal mode is probably unnecessary unless explicitly requested. Never start goal mode unless the user asks to create it.

## Workflow

1. Identify the actual outcome and convert it into measurable exit criteria.
2. Name authoritative starting points, realistic environment, and measurement loops (tests, benchmarks, previews, screenshots, devices, logs, or evals).
3. Forbid metric gaming: deleting tests, lowering coverage, stubbing behavior, hiding failures, hardcoding eval answers, weakening security, or using a reference image as a cropped/inlined substitute unless requested.
4. For visual work, require flows/states, design-system and responsive constraints, visual comparisons where useful, and manual polish review; images are context, not sole proof.
5. Require progress artifacts for long work (meaningful commits, status artifact, preview, or check-ins), final cleanup, diff review, evidence, and residual risks.

Ask at most three material clarifying questions; otherwise state reasonable assumptions. Keep the paste-ready prompt at 3,800 characters or fewer.

```text
Goal: [specific outcome and exit criteria].

Context and starting points:
- [authoritative files, docs, prior plan]

Measure progress with:
- [tests, benchmarks, previews, screenshots, logs]

Environment:
- [production-like setup, devices, data, flags]

Constraints:
- [preserve behavior/security; no gaming or hiding failures]

Progress reporting:
- [commits, status artifact, periodic evidence]

Completion:
- Run verification, inspect the final diff, remove failed experiments/temporary scaffolding, and report evidence plus remaining risks.
```
