---
name: ai-software-design
description: Guide non-trivial AI-assisted implementation or refactoring around a clear design concept, shared domain language, deliberate module boundaries, and fast feedback. Do not use for isolated mechanical edits.
---

# AI Software Design

Use this skill to keep AI-assisted code changes easy to understand, verify, and evolve. The objective is not more planning; it is a design precise enough that small, well-tested changes become straightforward.

## Establish The Design Before Implementation

For work with meaningful ambiguity, architectural impact, or several interacting parts:

1. Inspect the relevant code and tests, then identify the change's goal, constraints, non-goals, and affected boundaries.
2. Resolve material unknowns with targeted questions. If a reasonable assumption lets work proceed safely, state it rather than blocking on a ceremonial planning phase.
3. Define a compact design concept: the system behavior, key invariants, primary interactions, and a short vocabulary for domain terms. Reuse the project's established terms; do not introduce competing names for the same concept.

Do not pretend a prose specification removes the need to understand the codebase. The code, tests, and operational behavior are part of the specification.

## Design For Change And Verification

Choose boundaries that make the feature's important behavior simple to explain and test. Prefer a coherent module with a small, intentional interface over scattering domain logic across many thin wrappers. A deeper module is useful only when it hides genuine complexity behind a clearer contract; do not add abstraction merely to satisfy this heuristic.

Place validation at the meaningful boundary. Preserve or add the smallest feedback loop that can catch the expected failure: types and static checks, focused tests, integration tests, or real UI/browser verification as appropriate. Tests should prove behavior and protect decisions, not mirror incidental implementation details.

## Implement In Tight Loops

Break the change into vertical slices that can be verified independently:

1. Make one coherent slice.
2. Run the fastest relevant check immediately.
3. Inspect the result and correct the design or implementation before expanding scope.

Do not generate a large patch and defer all validation to the end. When feedback contradicts the plan, update the plan and shared vocabulary instead of patching around the symptom.

Keep code legible to its next editor: name concepts consistently, keep responsibilities near their boundaries, and leave tests and interfaces clearer than before. Avoid broad cleanup unrelated to the requested change.

## Finish With Evidence

Report the design decisions that materially shaped the change, the checks actually run and their results, and any remaining assumptions or risks. Do not claim validation that was not performed.
