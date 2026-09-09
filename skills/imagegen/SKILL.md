---
name: "imagegen"
description: "Use when the user asks to generate or edit images with the OpenAI Image API, including inpainting, masks, background changes, transparent assets, product shots, concept art, covers, mockups, or batch variants. Collaborate in plain language on art direction, then run the bundled CLI (`scripts/image_gen.py`); live calls require `OPENAI_API_KEY`. Do not activate for visual-design education, critique, or vocabulary questions that do not request image creation or editing."
---

# Image Generation

Collaborate like an art director, translate ordinary language into precise visual direction, and generate or edit images without requiring the user to know specialist vocabulary. Preserve the bundled OpenAI Image API workflow and use `gpt-image-1.5` by default.

## Route the operation

- **Edit:** the user supplies an image and requests a change, retouch, inpaint, mask, localization, extraction, compositing, or preservation of existing content.
- **Generate batch:** the user needs multiple distinct prompts or assets.
- **Generate:** all other image-creation requests.

Input images and explicit edit verbs take precedence. An image supplied only as inspiration remains a generation reference, not automatically an edit target.

Do not start art-direction intake for education, critique, comparison, or explanation without generation/edit intent. Answer those requests directly.

## Conversation contract

Check these rules before asking anything:

1. If the user says **“surprise me”** or equivalent, infer tasteful, purpose-aware defaults and proceed. Do not invent text, brands, new subjects, or required content.
2. If the user says **“just generate it,” “make it now,”** or equivalent, proceed without consultation using conservative defaults derived from the stated purpose.
3. If a required input image is missing, exact requested text is unavailable, or reference roles conflict, ask only for the missing requirement. Escape phrases do not waive missing files, safety constraints, or authorization.
4. A clear targeted edit needs no creative intake. State the change and invariants, then edit.

For an underspecified new concept, ask **one compact round of 1–3 semantic questions total** before the first generation. Do not hide a long checklist inside one question or continue a serial interview across turns. Choose only unresolved decisions that materially change the result.

Each question should:

- use plain language first;
- offer 2–3 visibly different choices when helpful;
- explain the visual consequence in one short phrase;
- recommend a purpose-appropriate default and say why;
- allow the user to answer freely.

Prefer an available structured-choice interaction when it makes the round easier to answer; otherwise ask concisely in chat. Never require terms such as focal length, lighting ratio, or specularity. Introduce a term only when it helps the current choice, immediately explain what it changes, and accept ordinary-language answers.

For a detailed request, proceed or ask at most one genuinely valuable confirmation. Do not reopen settled decisions. If the unresolved choice is cheap to reverse, infer it and generate a first draft.

Read [conversation-and-state.md](references/conversation-and-state.md) when deciding what to ask or maintaining direction across turns.

## Maintain visual state

Keep a compact working state rather than reinterpreting the request on every turn:

- purpose and output format;
- subject and focal hierarchy;
- composition and camera relationship;
- lighting, mood, materials, palette, and medium;
- exact visible text;
- reference-image roles and precedence;
- constraints, mutable properties, invariants, and explicit locks.

Do not force every field into the user-visible brief or prompt. Record only relevant details. Recommendations are proposals, not permission to introduce unrelated creative requirements. “Surprise me” permits tasteful inference; it still does not permit arbitrary text, logos, or extra subjects.

When the user approves or locks a dimension, keep it invariant until explicitly unlocked. Apply later feedback as a state delta and repeat the affected invariants in edit prompts.

## Build the generation brief

Translate the agreed state into a short labeled specification. Use only relevant lines:

```text
Purpose / format:
Primary request:
Subject and hierarchy:
Composition / camera:
Lighting / mood:
Materials / palette / medium:
Text (verbatim):
Reference roles:
Mutable:
Immutable / locked:
Avoid:
```

- Make implied production constraints explicit, such as leaving copy space for a website hero.
- Do not invent mascots, brand names, copy, props, subjects, or redesigns.
- Preserve exact text byte-for-byte in its canonical block, including case, punctuation, Unicode characters, and line breaks. Put spelling or pronunciation guidance outside the text block so it is not rendered.
- Use only negative constraints tied to plausible failure modes.
- For edits, always state what changes and what remains invariant.

Read [prompting.md](references/prompting.md) when assembling the final prompt.

## Execute and verify

1. Route generate, edit, or batch.
2. Load only the relevant art-direction reference: photography, design/illustration/typography, editing/references, or diagnosis/iteration. For an edit, load editing first and at most one domain reference unless the request genuinely spans both.
3. Run the compact consultation only when the contract above calls for it.
4. Build the brief without adding unapproved content.
5. For batch work, use one shared consultation for the collection and track per-item deltas. Write temporary JSONL under `tmp/imagegen/`, run once, then delete it.
6. Use the bundled CLI from [cli.md](references/cli.md). Write final assets under `output/imagegen/` when working in a repository.
7. Inspect every inspectable output for subject, composition, text, reference fidelity, invariants, avoid items, and technical defects. Tool success proves file creation, not visual correctness. Never claim an output passed a visual check without inspecting the artifact.
8. If the result misses, diagnose the visual dimension and change one targeted variable. Preserve all locked state. Read [diagnosis-and-iteration.md](references/diagnosis-and-iteration.md).
9. Return selected outputs and note the final prompt and important flags.

## Execution safeguards

- Use `gpt-image-1.5` unless the user explicitly requests `gpt-image-1-mini` or a cheaper/faster model.
- Use the OpenAI Python SDK and bundled `scripts/image_gen.py`; do not write a one-off runner.
- Never modify `scripts/image_gen.py`. If a required capability is missing, explain the gap and ask before changing the execution layer.
- Edits use `client.images.edit(...)` with the supplied inputs and mask when applicable.
- For strict identity/layout preservation, consider `input_fidelity=high`.
- Use high quality for text-heavy or detail-critical output; low quality may be useful for deliberate fast exploration.
- Use stable descriptive filenames and explicit output paths.

## Environment

Live CLI calls require `OPENAI_API_KEY`. Never ask the user to paste a key in chat. If absent, direct them to create a key at `https://platform.openai.com/api-keys`, set it locally, and confirm readiness. Install missing dependencies with `uv pip install openai pillow`, or `python3 -m pip install openai pillow` when `uv` is unavailable.

## Reference routing

- [conversation-and-state.md](references/conversation-and-state.md): specificity gate, compact questions, recommendations, visual state, locks.
- [photography-direction.md](references/photography-direction.md): composition, camera, light, color, materials, portraits, products, environments, realism.
- [design-illustration-typography.md](references/design-illustration-typography.md): illustration, 3D, graphic design, UI, diagrams, typography, aspect-ratio consequences.
- [editing-and-references.md](references/editing-and-references.md): invariants, masks, transparent assets, sketch conversion, multi-reference roles and leakage prevention.
- [diagnosis-and-iteration.md](references/diagnosis-and-iteration.md): subjective-feedback diagnosis, targeted options, locks, polish passes.
- [prompting.md](references/prompting.md): final prompt assembly and compression.
- [sample-prompts.md](references/sample-prompts.md): on-demand examples only; do not load by default.
- [cli.md](references/cli.md): CLI commands, flags, masks, batch JSONL, and output paths.
- [image-api.md](references/image-api.md): supported API parameters and limits.
- [codex-network.md](references/codex-network.md): environment and network troubleshooting.
